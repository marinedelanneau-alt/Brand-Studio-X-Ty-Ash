import DatabaseErrorState from "@/app/ui/database-error-state";
import { getAdminAccounts } from "@/lib/training";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  let accounts: Awaited<ReturnType<typeof getAdminAccounts>> = [];
  let loadError = "";

  try {
    accounts = await getAdminAccounts();
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (loadError) {
    return (
      <DatabaseErrorState
        title="La liste des comptes est indisponible"
        message={loadError}
        backHref="/admin"
        backLabel="Retour au dashboard"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.4rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] p-6 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
        <p className="inline-flex rounded-full bg-[var(--tyash-soft)] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">
          Clients
        </p>
        <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[var(--heading-color)] sm:text-[3.2rem]">
          Comptes et projets
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
          Vue d&apos;ensemble des utilisateurs inscrits, de leur statut et de
          leur projet de marque.
        </p>
      </section>

      <section className="overflow-hidden rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-left">
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Entreprise
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Projet
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                  <td className="px-5 py-4 text-sm font-semibold leading-6 text-[var(--heading-color)]">
                    {account.company_name ?? "Non renseignee"}
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-[var(--text-muted)]">
                    {account.project_name ?? "Aucun projet"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] ${
                          account.is_active
                            ? "bs-status-light bg-[#eef6eb] text-[var(--status-success-text)]"
                            : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                        }`}
                      >
                        {account.is_active ? "Actif" : "Desactive"}
                      </span>
                      {account.is_admin ? (
                        <span className="rounded-full bs-status-light bg-[#f2eef7] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Admin
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
