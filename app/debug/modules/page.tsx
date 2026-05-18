import Link from "next/link";
import { getModulesWithExercises } from "@/lib/training";

export default async function DebugModulesPage() {
  let modules = [] as Awaited<ReturnType<typeof getModulesWithExercises>>;
  let fetchFailed = false;

  try {
    modules = await getModulesWithExercises({ includeUnpublished: true });
  } catch (err) {
    // In local builds the Supabase env may be missing; allow build to succeed and
    // show a helpful message in the HTML. On Vercel (with env set) the page will
    // render the real data.
    fetchFailed = true;
    modules = [];
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Debug — Modules (public)</h1>
      <p className="mb-4">This page is temporary and intended to verify deployed modules.</p>
      {fetchFailed ? (
        <div className="rounded border p-4 bg-yellow-50">Could not fetch modules (missing env). Check deployment environment.</div>
      ) : null}
      <ul className="list-disc pl-6 space-y-2 mt-4">
        {modules.map((m) => (
          <li key={m.id}>
            <a href={`/mon-espace/module/${m.id}`} className="text-sky-600 underline">
              {m.position} — {m.title}
            </a>{" "}
            <span className="text-sm text-gray-600">{m.is_published ? "(published)" : "(draft)"}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
