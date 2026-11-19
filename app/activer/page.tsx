import Link from "next/link";
import BrandStudioTyAshLockup from "@/app/ui/brand-studio-tyash-lockup";
import AccessPageBackground from "@/app/ui/access-page-background";
import AnnualPasswordForm, { AnnualResendForm } from "@/app/ui/annual-password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activez votre accès — Brand Studio X TyASH", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash: token } = await searchParams;
  return <main className="relative isolate min-h-screen px-4 py-10"><AccessPageBackground />
    <section className="relative mx-auto max-w-xl rounded-[2rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-6 sm:p-9">
      <BrandStudioTyAshLockup compact />
      <h1 className="mt-8 font-[family:var(--font-cormorant)] text-4xl leading-tight text-[var(--heading-color)]">Bienvenue dans Brand Studio X TyASH !</h1>
      <p className="my-6 text-base leading-7 text-[var(--text-muted)]">Votre accès est prêt. Choisissez votre mot de passe pour commencer votre parcours.</p>
      {token && /^[a-f0-9]{40,128}$/i.test(token) ? <AnnualPasswordForm token={token} /> : <p className="text-sm leading-7">Ouvrez votre lien personnel reçu par e-mail ou demandez un nouveau lien ci-dessous.</p>}
      <AnnualResendForm />
      <Link href="/" className="mt-6 block text-center text-sm underline">Déjà un accès ? Se connecter</Link>
    </section>
  </main>;
}
