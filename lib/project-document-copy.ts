// Presentation only: existing export types, snapshots and download URLs stay intact.
export function projectDocumentCopy(original: string, replacement: string) {
  return process.env.NEXT_PUBLIC_SUPABASE_URL === "https://cplzwnlstcpqqzqeawgs.supabase.co"
    ? replacement
    : original;
}

export const projectDocumentTitle = projectDocumentCopy("Guide de marque", "Carnet de projet");
export const projectDocumentHeading = projectDocumentCopy("Ton Guide de Marque", "TON CARNET DE PROJET");
export const adminDocumentTitle = projectDocumentCopy("Guide de Marque", "Brief stratégique vidéo");
export const projectDocumentDescription = "Retrouve toutes tes réponses et les éléments clés qui guideront la création de ta vidéo.";
