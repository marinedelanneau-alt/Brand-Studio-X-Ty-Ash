import ResetPasswordForm from "@/app/ui/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#fbf6ee] px-4 py-10 text-[#4b4550]">
      <section className="mx-auto max-w-xl rounded-[1.6rem] border border-[#eadfca] bg-[#fffdf7] p-6 shadow-[0_18px_46px_rgba(210,189,152,0.12)] sm:p-8">
        <p className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.74rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
          Sécurité
        </p>
        <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[#4b4550]">
          Choisir un nouveau mot de passe
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#7b7068]">
          Saisis ton nouveau mot de passe pour retrouver ton espace Brand Studio.
        </p>
        <div className="mt-6">
          <ResetPasswordForm hasCallbackError={Boolean(error)} />
        </div>
      </section>
    </main>
  );
}
