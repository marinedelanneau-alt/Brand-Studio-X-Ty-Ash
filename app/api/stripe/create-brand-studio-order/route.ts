export async function POST() {
  return Response.json({ error: "Cette offre est remplacée par l’accès annuel à 55 €. Connectez-vous et rendez-vous sur /commander." }, { status: 410 });
}
