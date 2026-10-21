import AdminShell from "@/app/ui/admin-shell";
import DatabaseErrorState from "@/app/ui/database-error-state";
import { getAuthenticatedClientReader } from "@/lib/session";
import { canAdminister } from "@/lib/account-permissions";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";
import { isLegalPreviewEnabled } from "@/lib/legal";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let account: Awaited<ReturnType<typeof getAuthenticatedClientReader>> | null = null;
  let loadError = "";

  try {
    account = await getAuthenticatedClientReader();
  } catch (error) {
    unstable_rethrow(error);
    loadError = getUserFacingDataErrorMessage(error);
  }

  if (!account) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <DatabaseErrorState
            title="Administration temporairement indisponible"
            message={loadError}
            backHref="/"
          />
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      adminName={account.client_name ?? "Administrateur"}
      adminEmail={account.email}
      showLegal={isLegalPreviewEnabled()}
      readOnly={!canAdminister(account)}
    >
      {children}
    </AdminShell>
  );
}
