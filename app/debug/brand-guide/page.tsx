import { notFound } from "next/navigation";
import { generateGuideFromAnswers } from "@/lib/brand-guide";
import { normalizeBrandPalette, normalizeBrandValuesFromExercise } from "@/lib/brand-guide-normalizers";
import { createBrandGuideData } from "@/lib/brand-guide-pdf-data";
import { BRAND_GUIDE_TYPOGRAPHY, BRAND_GUIDE_TYPE_LIMITS } from "@/lib/brand-guide-typography-scale";
import { buildBrandVisualIdentity, createPdfThemeFromBrandPalette } from "@/lib/brand-visual-identity";
import { getAuthenticatedAccount } from "@/lib/session";
import { getWorkspaceData } from "@/lib/training";

export const dynamic = "force-dynamic";

const Json = ({ value }: { value: unknown }) => (
  <pre className="overflow-auto rounded-2xl bg-stone-950 p-5 text-xs text-stone-100">
    {JSON.stringify(value, null, 2)}
  </pre>
);

export default async function BrandGuideDebugPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const account = await getAuthenticatedAccount();
  const workspace = await getWorkspaceData(account.id);
  if (!workspace.project) notFound();

  const exercises = workspace.modules.flatMap((module) =>
    module.exercises.map((exercise) => ({ module, exercise })),
  );
  const valueSource = exercises.find(({ exercise }) => exercise.type === "table" && exercise.question.toLowerCase().includes("valeur"));
  const paletteSource = exercises.find(({ exercise }) => exercise.type === "color_palette");
  const rawValues = valueSource ? valueSource.module.answers[valueSource.exercise.id] ?? [] : [];
  const rawPalette = paletteSource ? paletteSource.module.answers[paletteSource.exercise.id] ?? [] : [];
  const guide = generateGuideFromAnswers({
    project: workspace.project,
    modules: workspace.modules,
    brandName: account.company_name || workspace.project.name,
  });
  const data = createBrandGuideData(guide);
  const identity = buildBrandVisualIdentity(guide);
  const theme = createPdfThemeFromBrandPalette(identity);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-8">
      <h1 className="text-3xl font-semibold">Debug du Guide de Marque</h1>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Valeurs</h2>
        <p>Source : sous-module {valueSource?.exercise.submodule_id ?? "absent"}, exercice {valueSource?.exercise.id ?? "absent"}</p>
        <Json value={{ raw: rawValues, normalized: normalizeBrandValuesFromExercise(rawValues), pdf: data.values }} />
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Palette</h2>
        <p>Source : sous-module {paletteSource?.exercise.submodule_id ?? "absent"}, exercice {paletteSource?.exercise.id ?? "absent"}</p>
        <Json value={{ raw: rawPalette, normalized: normalizeBrandPalette(rawPalette), pdf: data.palette }} />
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Typographie</h2>
        <Json value={{ scale: BRAND_GUIDE_TYPOGRAPHY, limits: BRAND_GUIDE_TYPE_LIMITS }} />
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Thème</h2>
        <Json value={{ colors: theme.colors, direction: theme.direction, source: identity.colors }} />
      </section>
    </main>
  );
}
