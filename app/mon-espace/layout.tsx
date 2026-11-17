import { redirect } from "next/navigation";
import { getAuthenticatedAccount } from "@/lib/session";
import { getCurrentTermsRequirement } from "@/lib/legal";
import AccountExpiryNotice from "@/app/ui/account-expiry-notice";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const account = await getAuthenticatedAccount();
  if (account.auth_user_id && await getCurrentTermsRequirement(account.auth_user_id, account)) redirect("/acceptation-cgu");
  return <><AccountExpiryNotice account={account} />{children}</>;
}
