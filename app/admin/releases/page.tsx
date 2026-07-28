import Link from "next/link";
import {
  getApplicationReleaseState,
  getContentReleaseSnapshot,
  isAdminDraftPreviewEnabled,
  listFeatureConfigurations,
  listContentReleaseSchedules,
  listContentReleases,
} from "@/lib/content-releases";
import {
  compareReleaseSnapshots,
  summarizeReleaseDifferences,
} from "@/lib/content-release-diff";
import { getAuthenticatedAdmin } from "@/lib/session";
import {
  cancelScheduledRelease,
  createDraftRelease,
  enterContentPreview,
  markReleaseReady,
  publishReleaseForAllUsers,
  saveDraftFeatureFlag,
  scheduleReleaseForAllUsers,
} from "./actions";

export const dynamic = "force-dynamic";

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(new Date(value))
    : "—";
}

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; kind?: string; technical?: string }>;
}) {
  await getAuthenticatedAdmin();
  const query = await searchParams;
  const previewEnabled = isAdminDraftPreviewEnabled();
  let loadError = "";
  let releases: Awaited<ReturnType<typeof listContentReleases>> = [];
  let state: Awaited<ReturnType<typeof getApplicationReleaseState>> | null = null;

  try {
    [releases, state] = await Promise.all([
      listContentReleases(),
      getApplicationReleaseState(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Le système de releases est indisponible.";
  }

  const published = releases.find(
    (release) => release.id === state?.published_release_id,
  );
  const draft = releases.find(
    (release) => release.id === state?.current_draft_release_id,
  );
  const [publishedSnapshot, draftSnapshot] =
    published && draft
      ? await Promise.all([
          getContentReleaseSnapshot(published.id),
          getContentReleaseSnapshot(draft.id),
        ])
      : [null, null];
  const differences =
    publishedSnapshot && draftSnapshot
      ? compareReleaseSnapshots(
          publishedSnapshot.modules,
          draftSnapshot.modules,
        )
      : [];
  const summary = summarizeReleaseDifferences(differences);
  const featureFlags = draft
    ? await listFeatureConfigurations(draft.id).catch(() => [])
    : [];
  const schedules = await listContentReleaseSchedules().catch(() => []);
  const activeSchedule = draft
    ? schedules.find(
        (schedule) =>
          schedule.release_id === draft.id &&
          (schedule.status === "scheduled" || schedule.status === "processing"),
      )
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#eadfca] bg-white p-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#cf7430]">
          Versions et déploiements
        </p>
        <h1 className="mt-3 text-4xl text-[#4b4550]">
          Publication contrôlée
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-[#7b7068]">
          Le contenu et le code suivent deux workflows distincts. Enregistrer ou
          valider un brouillon ne modifie jamais la version visible par les
          bêta-testeurs.
        </p>
        {query.message ? (
          <p
            className={`mt-4 rounded-xl p-3 ${
              query.kind === "error"
                ? "bg-[#fff0ed] text-[#9d4e40]"
                : "bg-[#eef6eb] text-[#55745a]"
            }`}
          >
            {query.message}
          </p>
        ) : null}
        {loadError ? (
          <div className="mt-4 rounded-xl border border-[#efc6bf] bg-[#fff4f1] p-4">
            <p className="font-bold text-[#9d4e40]">
              Migration de releases non installée dans cet environnement
            </p>
            <p className="mt-2 text-sm text-[#9d4e40]">
              {loadError} La production historique continue de fonctionner sans
              changement.
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#d9e6d5] bg-white p-6">
          <span className="rounded-full bg-[#eef6eb] px-3 py-1 text-xs font-black uppercase tracking-[.14em] text-[#55745a]">
            En ligne
          </span>
          <h2 className="mt-4 text-2xl text-[#4b4550]">Version publiée</h2>
          {published ? (
            <dl className="mt-4 grid gap-3 text-sm">
              <div><dt className="font-bold">Nom</dt><dd>{published.name}</dd></div>
              <div><dt className="font-bold">Version</dt><dd>V{published.version_number}</dd></div>
              <div><dt className="font-bold">Publication</dt><dd>{date(published.published_at)}</dd></div>
              <div><dt className="font-bold">Notes</dt><dd>{published.notes || "Aucune note"}</dd></div>
            </dl>
          ) : <p className="mt-4">Aucune release publiée disponible.</p>}
        </section>

        <section className="rounded-3xl border border-[#eadfca] bg-white p-6">
          <span className="rounded-full bg-[#fff6e3] px-3 py-1 text-xs font-black uppercase tracking-[.14em] text-[#a85a28]">
            Visible uniquement par les administrateurs
          </span>
          <h2 className="mt-4 text-2xl text-[#4b4550]">Brouillon actuel</h2>
          {draft ? (
            <>
              <p className="mt-3">{draft.name} · V{draft.version_number}</p>
              <p className="mt-1 text-sm text-[#7b7068]">
                Statut : {draft.status} · modifié le {date(draft.updated_at)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                <span>{summary.added} ajout(s)</span>
                <span>{summary.modified} modification(s)</span>
                <span>{summary.moved} déplacement(s)</span>
                <span>{summary.disabled} désactivation(s)</span>
                <span>{summary.removed} retrait(s)</span>
              </div>
              {previewEnabled ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <form action={enterContentPreview}>
                    <input type="hidden" name="mode" value="new_user" />
                    <button className="rounded-xl border px-4 py-2 text-sm font-bold">
                      Prévisualiser comme nouvel utilisateur
                    </button>
                  </form>
                  <form action={enterContentPreview}>
                    <input type="hidden" name="mode" value="current_answers" />
                    <button className="rounded-xl border px-4 py-2 text-sm font-bold">
                      Prévisualiser avec mes réponses
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-[#f5f1e8] p-3 text-sm">
                  L’aperçu est désactivé dans cet environnement.
                </p>
              )}
              {draft.status === "draft" ? (
                <form action={markReleaseReady} className="mt-5 space-y-3">
                  <input type="hidden" name="releaseId" value={draft.id} />
                  <label className="block text-sm font-bold">
                    Notes de version obligatoires
                    <textarea name="notes" required className="mt-2 min-h-24 w-full rounded-xl border p-3" />
                  </label>
                  <button className="rounded-xl bg-[#d98632] px-4 py-2 font-bold text-white">
                    Marquer comme prête à publier
                  </button>
                </form>
              ) : null}
              {draft.status === "ready" && activeSchedule ? (
                <div className="mt-5 rounded-2xl border border-[#efd7b8] bg-[#fff6e3] p-4">
                  <p className="font-bold text-[#a85a28]">
                    Déploiement programmé le {date(activeSchedule.scheduled_at)}
                  </p>
                  <p className="mt-2 text-sm">{activeSchedule.notes}</p>
                  {activeSchedule.status === "scheduled" ? (
                    <form action={cancelScheduledRelease} className="mt-3">
                      <input
                        type="hidden"
                        name="scheduleId"
                        value={activeSchedule.id}
                      />
                      <button className="rounded-xl border border-[#a85a28] px-4 py-2 text-sm font-bold text-[#a85a28]">
                        Annuler la programmation
                      </button>
                    </form>
                  ) : (
                    <p className="mt-3 text-sm">Déploiement en cours…</p>
                  )}
                </div>
              ) : draft.status === "ready" ? (
                <div className="mt-5 space-y-5 rounded-2xl border border-[#efc6bf] bg-[#fff4f1] p-4">
                  <p className="font-bold text-[#9d4e40]">
                    Déployer rendra cette version visible par tous les
                    utilisateurs. Choisis un déploiement immédiat ou programmé.
                  </p>
                  <form action={publishReleaseForAllUsers} className="space-y-3">
                    <input type="hidden" name="releaseId" value={draft.id} />
                    <textarea name="notes" required defaultValue={draft.notes ?? ""} className="min-h-24 w-full rounded-xl border p-3" />
                    <label className="block text-sm">
                      Saisis « PUBLIER POUR TOUS »
                      <input name="confirmation" required className="mt-2 h-11 w-full rounded-xl border px-3" />
                    </label>
                    <button className="rounded-xl bg-[#9d4e40] px-4 py-2 font-bold text-white">
                      Déployer à tous les utilisateurs maintenant
                    </button>
                  </form>
                  <div className="border-t border-[#efc6bf] pt-5">
                    <h3 className="font-bold text-[#4b4550]">
                      Programmer ce déploiement
                    </h3>
                    <form action={scheduleReleaseForAllUsers} className="mt-3 space-y-3">
                      <input type="hidden" name="releaseId" value={draft.id} />
                      <textarea name="notes" required defaultValue={draft.notes ?? ""} className="min-h-20 w-full rounded-xl border p-3" />
                      <label className="block text-sm font-bold">
                        Date et heure de Paris
                        <input name="scheduledAt" type="datetime-local" required className="mt-2 h-11 w-full rounded-xl border px-3" />
                      </label>
                      <label className="block text-sm">
                        Saisis « DÉPLOYER À TOUS »
                        <input name="confirmation" required className="mt-2 h-11 w-full rounded-xl border px-3" />
                      </label>
                      <button className="rounded-xl border border-[#9d4e40] px-4 py-2 font-bold text-[#9d4e40]">
                        Programmer le déploiement
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}
            </>
          ) : published ? (
            <form action={createDraftRelease} className="mt-4 space-y-3">
              <input type="hidden" name="sourceReleaseId" value={published.id} />
              <input name="name" required placeholder="Nom du nouveau brouillon" className="h-11 w-full rounded-xl border px-3" />
              <button className="rounded-xl border px-4 py-2 font-bold">
                Créer un nouveau brouillon
              </button>
            </form>
          ) : (
            <p className="mt-4">Aucun brouillon disponible.</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-[#eadfca] bg-white p-6">
        <h2 className="text-2xl text-[#4b4550]">Comparaison publié / brouillon</h2>
        {differences.length ? (
          <ul className="mt-4 space-y-2">
            {differences.map((difference, index) => (
              <li key={`${difference.stableKey}:${difference.kind}:${index}`} className="rounded-xl bg-[#fffaf2] p-3 text-sm">
                <strong>{difference.kind}</strong> · {difference.entityType} · {difference.label}
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-[#7b7068]">Aucune différence détectée.</p>}
        <details className="mt-5">
          <summary className="cursor-pointer font-bold">Diagnostic technique</summary>
          <pre className="mt-3 overflow-auto rounded-xl bg-[#27232a] p-4 text-xs text-white">
            {JSON.stringify({ state, differences }, null, 2)}
          </pre>
        </details>
      </section>

      <section className="rounded-3xl border border-[#d9e6d5] bg-white p-6">
        <h2 className="text-2xl text-[#4b4550]">
          Confirmations de déploiement
        </h2>
        <p className="mt-2 text-sm text-[#7b7068]">
          Chaque déploiement programmé conserve ici son résultat et son heure
          d’exécution.
        </p>
        <div className="mt-4 space-y-3">
          {schedules.length ? schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>
                  {schedule.status === "published"
                    ? "Déploiement effectué"
                    : schedule.status === "failed"
                      ? "Échec du déploiement"
                      : schedule.status === "cancelled"
                        ? "Déploiement annulé"
                        : schedule.status === "processing"
                          ? "Déploiement en cours"
                          : "Déploiement programmé"}
                </strong>
                <span className="text-sm text-[#7b7068]">
                  {date(schedule.published_at ?? schedule.scheduled_at)}
                </span>
              </div>
              <p className="mt-2 text-sm">{schedule.notes}</p>
              {schedule.error_message ? (
                <p className="mt-2 text-sm font-bold text-[#9d4e40]">
                  {schedule.error_message}
                </p>
              ) : null}
            </article>
          )) : (
            <p className="rounded-xl bg-[#f5f1e8] p-3 text-sm">
              Aucun déploiement programmé pour le moment.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[#d8dce6] bg-white p-6">
        <h2 className="text-2xl text-[#4b4550]">Version de code</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-bold">Environnement</dt><dd>{process.env.NEXT_PUBLIC_APP_ENV ?? process.env.VERCEL_ENV ?? "local"}</dd></div>
          <div><dt className="font-bold">Branche</dt><dd>{process.env.VERCEL_GIT_COMMIT_REF ?? "locale"}</dd></div>
          <div><dt className="font-bold">Commit</dt><dd className="break-all">{process.env.VERCEL_GIT_COMMIT_SHA ?? "non disponible"}</dd></div>
          <div><dt className="font-bold">Déploiement</dt><dd>{process.env.VERCEL_URL ?? "serveur local"}</dd></div>
        </dl>
        <p className="mt-4 rounded-xl bg-[#f5f1e8] p-3 text-sm">
          Une release de contenu prête ne déploie jamais le code. Une fusion
          Git contrôlée reste nécessaire.
        </p>
      </section>

      <section className="rounded-3xl border border-[#eadfca] bg-white p-6">
        <h2 className="text-2xl text-[#4b4550]">Fonctionnalités expérimentales</h2>
        <p className="mt-2 text-sm leading-6 text-[#7b7068]">
          Les flags ci-dessous appartiennent uniquement au brouillon. Le ciblage
          par pourcentage reste stable pour un même identifiant utilisateur.
        </p>
        {draft?.status === "draft" ? (
          <form action={saveDraftFeatureFlag} className="mt-5 grid gap-3 rounded-2xl bg-[#fffaf2] p-4 sm:grid-cols-2">
            <input type="hidden" name="releaseId" value={draft.id} />
            <label className="text-sm font-bold">
              Clé stable
              <input name="featureKey" required placeholder="new_brand_guide_pdf" className="mt-2 h-11 w-full rounded-xl border px-3" />
            </label>
            <label className="text-sm font-bold">
              Déploiement progressif
              <input name="rolloutPercentage" type="number" min="0" max="100" defaultValue="0" className="mt-2 h-11 w-full rounded-xl border px-3" />
            </label>
            <label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" /> Activée dans ce brouillon</label>
            <label className="flex items-center gap-2 text-sm"><input name="adminOnly" type="checkbox" defaultChecked /> Admin uniquement</label>
            <label className="text-sm sm:col-span-2">
              Identifiants utilisateurs autorisés (séparés par des virgules)
              <input name="allowedUserIds" className="mt-2 h-11 w-full rounded-xl border px-3" />
            </label>
            <button className="rounded-xl border px-4 py-2 font-bold sm:col-span-2">
              Enregistrer dans le brouillon
            </button>
          </form>
        ) : null}
        <div className="mt-4 space-y-2">
          {featureFlags.map((flag) => (
            <div key={flag.stable_key} className="flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm">
              <strong>{flag.stable_key}</strong>
              <span>
                {flag.enabled ? "activée" : "désactivée"} ·{" "}
                {flag.admin_only ? "Admin uniquement" : `${flag.rollout_percentage} %`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#eadfca] bg-white p-6">
        <h2 className="text-2xl text-[#4b4550]">Historique</h2>
        <div className="mt-4 space-y-3">
          {releases.map((release) => (
            <article key={release.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <strong>V{release.version_number} · {release.name}</strong>
                <p className="text-sm text-[#7b7068]">{release.status} · {date(release.updated_at)}</p>
              </div>
              {release.status === "archived" && !draft ? (
                <form action={createDraftRelease}>
                  <input type="hidden" name="sourceReleaseId" value={release.id} />
                  <input type="hidden" name="name" value={`Restauration de V${release.version_number}`} />
                  <button className="rounded-xl border px-4 py-2 text-sm font-bold">
                    Restaurer comme nouveau brouillon
                  </button>
                </form>
              ) : null}
              <Link href={`/admin/releases?technical=${release.id}`} className="text-sm font-bold text-[#a85a28]">
                Identifier la version
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
