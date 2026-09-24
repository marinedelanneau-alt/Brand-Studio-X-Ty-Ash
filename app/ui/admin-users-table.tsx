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
    <section className="bs-light-surface overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
      <div className="grid gap-3 border-b border-[var(--border)] p-5 md:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="admin-user-search">Rechercher un utilisateur</label>
        <input id="admin-user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom, entreprise ou e-mail" className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--heading-color)] outline-none focus:border-[var(--tyash-primary)]" />
        <div className="flex flex-wrap gap-2" aria-label="Filtrer par statut">
          {["Tous", "Nouveau", "En cours", "Terminé"].map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${status === item ? "bg-[#17213b] text-[#f5efe6]" : "border border-[var(--border)] bg-[var(--tyash-subtle)] text-[var(--text-primary)]"}`}>{item}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[68rem] w-full border-collapse text-left">
          <thead className="bg-[var(--tyash-subtle)] text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]"><tr>{["Nom", "Entreprise / marque", "E-mail", "Inscription", "Progression", "Dernière activité", "Statut"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>
          <tbody>{visible.map((user) => <tr key={user.id} className="border-t border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--tyash-subtle)]"><td className="px-5 py-4 font-bold text-[var(--heading-color)]"><Link className="hover:text-[var(--tyash-label-text)]" href={`/admin/users/${user.id}`}>{user.name}</Link></td><td className="px-5 py-4">{user.company}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{date(user.createdAt)}</td><td className="px-5 py-4 font-bold">{user.progress} %</td><td className="px-5 py-4">{date(user.lastActivityAt)}</td><td className="px-5 py-4"><span className="rounded-full bg-[var(--tyash-soft)] px-3 py-1 text-xs font-black text-[var(--tyash-label-text)]">{user.status}</span></td></tr>)}</tbody>
        </table>
        {visible.length === 0 ? <p className="p-8 text-center text-sm text-[var(--text-muted)]">Aucun utilisateur ne correspond à cette recherche.</p> : null}
      </div>
    </section>
  );
}
