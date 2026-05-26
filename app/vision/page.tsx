import { redirect } from "next/navigation";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";

export default async function VisionPage() {
  const account = await getAuthenticatedAccount();

  if (!(await hasActiveAccess(account.id))) {
    redirect("/pricing");
  }

  redirect("/mon-espace");
}
