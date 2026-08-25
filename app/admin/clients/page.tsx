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
      <section className="rounded-[1.4rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff8f1)] p-6 shadow-[0_16px_40px_rgba(210,189,152,0.1)]">
        <p className="inline-flex rounded-full bg-[#fff6e3] px-4 py-2 text-[0.76rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">
          Clients
        </p>
        <h1 className="mt-5 font-[family:var(--font-cormorant)] text-[2.6rem] leading-[0.96] text-[#4b4550] sm:text-[3.2rem]">
          Comptes et projets
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#7b7068]">
          Vue d&apos;ensemble des utilisateurs inscrits, de leur statut et de
          leur projet de marque.
        </p>
      </section>

      <section className="overflow-hidden rounded-[1.2rem] border border-[#eadfca] bg-white shadow-[0_14px_32px_rgba(210,189,152,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[#eadfca] bg-[#fffdf7] text-left">
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Entreprise
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Projet
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-[#f2e9dc] align-top last:border-b-0">
                  <td className="px-5 py-4 text-sm font-semibold leading-6 text-[#4b4550]">
                    {account.company_name ?? "Non renseignee"}
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-[#7b7068]">
                    {account.project_name ?? "Aucun projet"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] ${
                          account.is_active
                            ? "bg-[#eef6eb] text-[#5f8d63]"
                            : "bg-[#f4efe9] text-[#9b8d80]"
                        }`}
                      >
                        {account.is_active ? "Actif" : "Desactive"}
                      </span>
                      {account.is_admin ? (
                        <span className="rounded-full bg-[#f2eef7] px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#7a7087]">
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
