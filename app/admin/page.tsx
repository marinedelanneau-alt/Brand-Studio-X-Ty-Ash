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
    <section className="bs-light-surface rounded-[1.6rem] border border-[#eadfca] bg-[linear-gradient(135deg,#fffdfa,#fff6e8)] p-7 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
      <p className="inline-flex rounded-full bg-[#fff1c7] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#b5661f]">Lecture des parcours</p>
      <h1 className="mt-5 font-[family:var(--font-cormorant)] text-4xl leading-none text-[#17213b] sm:text-5xl">Les histoires de marque en mouvement</h1>
      <p className="mt-4 max-w-3xl leading-7 text-[#5d5752]">Consultez l’avancement et les réponses de chaque participante. Cet espace est strictement en lecture seule.</p>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([label, value]) => <article key={label} className="bs-light-surface rounded-[1.2rem] border border-[#eadfca] bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7a736d]">{label}</p><p className="mt-4 text-3xl font-black text-[#17213b]">{value}</p></article>)}</section>
    <AdminUsersTable users={users} />
  </div>;
}
