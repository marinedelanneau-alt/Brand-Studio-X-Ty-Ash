"use client";

export default function AdminError() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Recharge l’administration</h1>
      <p className="mt-4">La page n’a pas pu terminer son opération. Une ancienne version peut être restée ouverte après une mise à jour du site.</p>
      <p className="mt-3">Recharge la page pour retrouver les modules et vérifier le résultat avant de relancer une publication.</p>
      <a href="/admin/modules" className="mt-6 inline-flex rounded-xl border px-5 py-3 font-bold">Ouvrir les modules</a>
    </main>
  );
}
