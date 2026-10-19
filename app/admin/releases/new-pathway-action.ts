"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/session";
import { createIndependentPathwayDraft, getApplicationReleaseState, getRetainedPathwaySnapshots } from "@/lib/content-releases";
import { prepareIndependentPathway } from "@/lib/pathway-versions";
import { prepareTyAshPathway } from "@/lib/tyash-pathway-seed";

export async function createTyAshPathwayDraft() {
  await getAuthenticatedAdmin();
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co") {
      throw new Error("Cette action est réservée au projet Brand Studio X Ty Ash.");
    }
    const state = await getApplicationReleaseState();
    if (state.current_draft_release_id) throw new Error("Un brouillon existe déjà. Aucun nouveau parcours n’a été créé.");
    const history = await getRetainedPathwaySnapshots();
    const modules = prepareTyAshPathway(history.map(h => h.modules));
    await createIndependentPathwayDraft({
      name: "Nouveau parcours Ty Ash — 4 modules / 43 exercices",
      modules,
      expectedPublishedReleaseId: state.published_release_id,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "Création du parcours Ty Ash impossible.";
    redirect(`/admin/releases?kind=error&message=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/modules");
  revalidatePath("/admin/releases");
  redirect("/admin/modules?status=saved");
}

export async function createNewPathwayDraft(form: FormData) {
  await getAuthenticatedAdmin();
  try {
    const file = form.get("pathway");
    const name = String(form.get("name") ?? "").trim();
    if (!(file instanceof File) || !file.size || file.size > 2_000_000 || !name) {
      throw new Error("Choisissez un fichier de parcours et un nom de brouillon.");
    }
    const state = await getApplicationReleaseState();
    if (state.current_draft_release_id) throw new Error("Un brouillon existe déjà. Terminez sa révision avant de créer un nouveau parcours.");
    const parsed = JSON.parse(await file.text());
    const modules = Array.isArray(parsed) ? parsed : parsed.modules;
    if (!Array.isArray(modules)) throw new Error("Le fichier ne contient pas de parcours.");
    const history = await getRetainedPathwaySnapshots();
    const prepared = prepareIndependentPathway(modules, history.map(h => h.modules));
    await createIndependentPathwayDraft({ name, modules: prepared, expectedPublishedReleaseId: state.published_release_id });
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "Création du parcours impossible.";
    redirect(`/admin/releases?kind=error&message=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/modules");
  revalidatePath("/admin/releases");
  redirect("/admin/modules?status=saved");
}
