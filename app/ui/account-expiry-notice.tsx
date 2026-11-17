import { isLifetimeExempt, type LifetimeAccount } from "@/lib/account-lifetime";
export default function AccountExpiryNotice({ account }: { account: LifetimeAccount }) {
  if (isLifetimeExempt(account) || !account.access_expires_at) return null;
  const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(new Date(account.access_expires_at));
  return <aside aria-label="Mon accès Brand Studio" className="mx-auto mt-5 max-w-6xl rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm text-[var(--text-primary)]"><p className="font-semibold">Mon accès Brand Studio</p><p className="mt-1">Accès actif jusqu’au : {date}</p></aside>;
}
