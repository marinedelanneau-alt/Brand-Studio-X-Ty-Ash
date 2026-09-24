import LogoutButton from "./logout-button";

export default function PreviewAccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--tyash-label-text)]">
          Environnement de prévisualisation
        </p>
        <h1 className="mt-4 text-3xl text-[var(--heading-color)]">Accès administrateur requis</h1>
        <p className="mt-4 leading-7 text-[var(--text-muted)]">
          Cette version contient des fonctionnalités et des contenus en cours de
          validation. Elle n’est pas accessible aux bêta-testeurs.
        </p>
        <LogoutButton className="mt-6 h-12 rounded-xl bg-[#4b4550] px-5 font-bold text-white" />
      </section>
    </main>
  );
}
