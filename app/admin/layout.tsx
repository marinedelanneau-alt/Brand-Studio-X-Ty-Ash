import AdminShell from "@/app/ui/admin-shell";
import DatabaseErrorState from "@/app/ui/database-error-state";
import { getAuthenticatedAdmin } from "@/lib/session";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { unstable_rethrow } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let account: Awaited<ReturnType<typeof getAuthenticatedAdmin>> | null = null;
  let loadError = "";

  try {
    account = await getAuthenticatedAdmin();
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
    >
      {children}
    </AdminShell>
  );
}
