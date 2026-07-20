"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cog6ToothIcon,
  HomeIcon,
  Square2StackIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import LogoutButton from "./logout-button";

type AdminShellProps = {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/modules", label: "Modules", icon: Square2StackIcon },
  { href: "/admin/versions", label: "Versions", icon: Square2StackIcon },
  { href: "/admin/clients", label: "Clients", icon: UsersIcon },
];

export default function AdminShell({
  adminName,
  adminEmail,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#4b4550]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-[#ddd1bf] bg-[#1f2937] text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-5 py-6">
            <div className="rounded-[0.9rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f0cf55]">
                Administration
              </p>
              <p className="mt-3 text-xl font-semibold">Brand Studio</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Modules, comptes et progression de la plateforme.
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-[0.8rem] px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#f0cf55] text-[#1f2937]"
                        : "text-white/80 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 rounded-[0.9rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-[0.8rem] bg-[#f0cf55] text-sm font-black text-[#1f2937]">
                  {adminName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {adminName}
                  </p>
                  <p className="truncate text-xs leading-5 text-white/60">
                    {adminEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2 pt-6">
              <Link
                href="/mon-espace"
                className="flex items-center gap-3 rounded-[0.8rem] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                <Cog6ToothIcon className="size-5 shrink-0" />
                <span>Espace client</span>
              </Link>
              <LogoutButton className="flex h-12 w-full items-center justify-center rounded-[0.8rem] bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15" />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[#ddd1bf] bg-[#fbf8f2] px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cf7430]">
                  Console
                </p>
                <p className="mt-2 text-lg font-semibold text-[#4b4550]">
                  Gestion de la formation
                </p>
              </div>
              <div className="inline-flex items-center rounded-[0.8rem] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#6b625a]">
                Session admin active
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
