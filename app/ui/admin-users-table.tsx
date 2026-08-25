"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminUserView } from "@/lib/admin-user-insights";

const date = (value: string) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "—";

export default function AdminUsersTable({ users }: { users: AdminUserView[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return users.filter((user) =>
      (status === "Tous" || user.status === status) &&
      (!needle || `${user.name} ${user.company} ${user.email}`.toLocaleLowerCase("fr").includes(needle)),
    );
  }, [query, status, users]);

  return (
    <section className="bs-light-surface overflow-hidden rounded-[1.4rem] border border-[#eadfca] bg-white shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
      <div className="grid gap-3 border-b border-[#eadfca] p-5 md:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="admin-user-search">Rechercher un utilisateur</label>
        <input id="admin-user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom, entreprise ou e-mail" className="h-12 rounded-xl border border-[#d7c8b7] bg-[#fffdf7] px-4 text-sm text-[#17213b] outline-none focus:border-[#df9b39]" />
        <div className="flex flex-wrap gap-2" aria-label="Filtrer par statut">
          {["Tous", "Nouveau", "En cours", "Terminé"].map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${status === item ? "bg-[#17213b] text-[#f5efe6]" : "border border-[#eadfca] bg-[#fff8f1] text-[#5d5752]"}`}>{item}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[68rem] w-full border-collapse text-left">
          <thead className="bg-[#fff8f1] text-xs font-black uppercase tracking-[0.14em] text-[#7a736d]"><tr>{["Nom", "Entreprise / marque", "E-mail", "Inscription", "Progression", "Dernière activité", "Statut"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>
          <tbody>{visible.map((user) => <tr key={user.id} className="border-t border-[#eee3d4] text-sm text-[#5d5752] hover:bg-[#fffaf3]"><td className="px-5 py-4 font-bold text-[#17213b]"><Link className="hover:text-[#cf7430]" href={`/admin/users/${user.id}`}>{user.name}</Link></td><td className="px-5 py-4">{user.company}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{date(user.createdAt)}</td><td className="px-5 py-4 font-bold">{user.progress} %</td><td className="px-5 py-4">{date(user.lastActivityAt)}</td><td className="px-5 py-4"><span className="rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-black text-[#9b5424]">{user.status}</span></td></tr>)}</tbody>
        </table>
        {visible.length === 0 ? <p className="p-8 text-center text-sm text-[#7a736d]">Aucun utilisateur ne correspond à cette recherche.</p> : null}
      </div>
    </section>
  );
}
