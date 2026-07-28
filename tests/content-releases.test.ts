import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  compareReleaseSnapshots,
  normalizeReleaseSnapshotModules,
  summarizeReleaseDifferences,
} from "../lib/content-release-diff";
import { resolveReleaseSelectionIntent } from "../lib/content-release-policy";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260728140000_controlled_content_releases.sql",
    import.meta.url,
  ),
  "utf8",
);
const resolver = readFileSync(
  new URL("../lib/content-releases.ts", import.meta.url),
  "utf8",
);
const schedulingMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260728170000_schedule_content_releases.sql",
    import.meta.url,
  ),
  "utf8",
);
const releasesPage = readFileSync(
  new URL("../app/admin/releases/page.tsx", import.meta.url),
  "utf8",
);

describe("migration contrôlée des releases", () => {
  it("reste additive et ne détruit aucune table ou réponse historique", () => {
    expect(migration).not.toMatch(/\bdrop\s+table\b/i);
    expect(migration).not.toMatch(
      /\b(?:delete|update)\s+(?:from\s+)?public\.(?:brand_modules|brand_submodules|module_exercises|project_exercise_answers)\b/i,
    );
    expect(migration).toContain(
      "This migration is deliberately additive",
    );
  });

  it("garantit une seule release publiée et une publication atomique", () => {
    expect(migration).toMatch(
      /content_releases_one_published_idx[\s\S]*status = 'published'/,
    );
    const publication =
      migration.match(
        /create or replace function public\.publish_content_release[\s\S]*?\n\$\$;/,
      )?.[0] ?? "";
    expect(publication).toContain("status <> 'ready'");
    expect(publication).toContain("for update");
    expect(publication).toContain("status = 'archived'");
    expect(publication).toContain("status = 'published'");
    expect(publication).toContain("published_release_id = target.id");
    expect(publication).not.toMatch(/\bcommit\b/i);
  });

  it("interdit de modifier le contenu publié ou archivé", () => {
    expect(migration).toContain("guard_published_release_content");
    expect(migration).toContain(
      "status in ('published', 'archived')",
    );
    expect(migration).toContain("only the current draft can be updated");
  });

  it("conserve le mode historique comme valeur par défaut", () => {
    expect(resolver).toContain(
      'process.env.CONTENT_RELEASE_READ_MODE === "controlled"',
    );
    expect(resolver).toContain("resolveReleaseSelectionIntent");
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: false,
        adminPreviewEnabled: false,
        controlledProductionEnabled: false,
        previewMode: null,
        publishedReleaseId: "published",
        draftReleaseId: "draft",
      }),
    ).toEqual({
      source: "legacy",
      requestedReleaseId: null,
      previewRequested: false,
    });
  });
});

describe("identité stable et comparaison", () => {
  it("préserve les clés existantes et en crée pour les nouvelles entités", () => {
    const normalized = normalizeReleaseSnapshotModules([
      {
        id: 12,
        title: "Module",
        submodules: [
          {
            clientId: "sub-a",
            title: "Sous-module",
            exercises: [{ clientId: "question-a", question: "Question" }],
          },
        ],
      },
    ]);
    expect(normalized[0].stableKey).toBe("module_12");
    expect(normalized[0].submodules[0].stableKey).toBe("submodule_sub-a");
    expect(normalized[0].submodules[0].exercises[0].stableKey).toBe(
      "exercise_question-a",
    );
  });

  it("détecte ajouts, déplacements, modifications et retraits", () => {
    const published = [
      {
        stableKey: "module_one",
        title: "Titre V1",
        position: 1,
        submodules: [
          {
            stableKey: "sub_one",
            title: "Sous-module",
            position: 1,
            exercises: [
              {
                stableKey: "exercise_removed",
                question: "Ancienne question",
                position: 1,
              },
            ],
          },
        ],
      },
    ];
    const draft = [
      {
        stableKey: "module_one",
        title: "Titre V2",
        position: 2,
        submodules: [
          {
            stableKey: "sub_one",
            title: "Sous-module",
            position: 1,
            exercises: [
              {
                stableKey: "exercise_added",
                question: "Nouvelle question",
                position: 1,
              },
            ],
          },
        ],
      },
    ];
    const summary = summarizeReleaseDifferences(
      compareReleaseSnapshots(published, draft),
    );
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
    expect(summary.modified).toBeGreaterThanOrEqual(1);
    expect(summary.moved).toBeGreaterThanOrEqual(1);
  });
});

describe("déploiement global programmé", () => {
  it("ne touche jamais au contenu historique ni aux réponses", () => {
    expect(schedulingMigration).not.toMatch(
      /\b(?:delete|update)\s+(?:from\s+)?public\.(?:brand_modules|brand_submodules|module_exercises|project_exercise_answers|user_answers)\b/i,
    );
  });

  it("réserve l'exécution automatique au service cron", () => {
    expect(schedulingMigration).toContain(
      "revoke all on function public.publish_scheduled_content_release(uuid)",
    );
    expect(schedulingMigration).toContain("from public, anon, authenticated");
    expect(schedulingMigration).toContain("to service_role");
  });

  it("conserve une confirmation persistante après publication", () => {
    expect(schedulingMigration).toContain("status = 'published'");
    expect(schedulingMigration).toContain("published_at = now()");
    expect(releasesPage).toContain("Confirmations de déploiement");
    expect(releasesPage).toContain("Déploiement effectué");
  });

  it("propose le déploiement immédiat et la programmation", () => {
    expect(releasesPage).toContain(
      "Déployer à tous les utilisateurs maintenant",
    );
    expect(releasesPage).toContain("Programmer le déploiement");
  });
});

describe("résolution centrale de la release active", () => {
  const state = {
    publishedReleaseId: "published-v1",
    draftReleaseId: "draft-v2",
  };

  it("la production historique reste la source par défaut", () => {
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: false,
        adminPreviewEnabled: false,
        controlledProductionEnabled: false,
        previewMode: null,
        ...state,
      }),
    ).toEqual({
      source: "legacy",
      requestedReleaseId: null,
      previewRequested: false,
    });
  });

  it("un utilisateur standard ne peut jamais sélectionner le brouillon", () => {
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: false,
        adminPreviewEnabled: true,
        controlledProductionEnabled: true,
        previewMode: "new_user",
        ...state,
      }).requestedReleaseId,
    ).toBe("published-v1");
  });

  it("un Admin voit la publication par défaut", () => {
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: true,
        adminPreviewEnabled: true,
        controlledProductionEnabled: true,
        previewMode: null,
        ...state,
      }).requestedReleaseId,
    ).toBe("published-v1");
  });

  it("un Admin en aperçu voit le brouillon explicite", () => {
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: true,
        adminPreviewEnabled: true,
        controlledProductionEnabled: false,
        previewMode: "current_answers",
        ...state,
      }),
    ).toEqual({
      source: "controlled",
      requestedReleaseId: "draft-v2",
      previewRequested: true,
    });
  });

  it("un brouillon absent retombe sur la publication", () => {
    expect(
      resolveReleaseSelectionIntent({
        viewerIsAdmin: true,
        adminPreviewEnabled: true,
        controlledProductionEnabled: true,
        previewMode: "new_user",
        publishedReleaseId: "published-v1",
        draftReleaseId: null,
      }).requestedReleaseId,
    ).toBe("published-v1");
  });
});
