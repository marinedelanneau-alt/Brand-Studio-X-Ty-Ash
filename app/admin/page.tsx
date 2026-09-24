import AdminUsersTable from "@/app/ui/admin-users-table";
import { getAdminUsers } from "@/lib/admin-user-insights";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const users = await getAdminUsers();
  const stats = [
    ["Utilisateurs", users.length],
    ["Nouveaux", users.filter((user) => user.status === "Nouveau").length],
    ["En cours", users.filter((user) => user.status === "En cours").length],
    ["Terminés", users.filter((user) => user.status === "Terminé").length],
    ["Progression moyenne", `${users.length ? Math.round(users.reduce((sum, user) => sum + user.progress, 0) / users.length) : 0} %`],
  ];
  return <div className="space-y-6">
    <section className="bs-light-surface rounded-[1.6rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-7 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
      <p className="inline-flex rounded-full bg-[var(--tyash-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">Lecture des parcours</p>
      <h1 className="mt-5 font-[family:var(--font-cormorant)] text-4xl leading-none text-[var(--heading-color)] sm:text-5xl">Les histoires de marque en mouvement</h1>
      <p className="mt-4 max-w-3xl leading-7 text-[var(--text-primary)]">Consultez l’avancement et les réponses de chaque participante. Cet espace est strictement en lecture seule.</p>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([label, value]) => <article key={label} className="bs-light-surface rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</p><p className="mt-4 text-3xl font-black text-[var(--heading-color)]">{value}</p></article>)}</section>
    <AdminUsersTable users={users} />
  </div>;
}
