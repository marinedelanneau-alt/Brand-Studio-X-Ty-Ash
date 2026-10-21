"use server";
import { getAuthenticatedInvitationAdmin } from "@/lib/session";
import { prepareAndSendJulienInvitation, type JulienInvitationState } from "@/lib/julien-invitation";
import { revalidatePath } from "next/cache";
export async function inviteJulien(_previous: JulienInvitationState): Promise<JulienInvitationState> {
  void _previous; // Progress is recomputed server-side; never trust client state.
  await getAuthenticatedInvitationAdmin();
  const result = await prepareAndSendJulienInvitation();
  revalidatePath("/admin/clients");
  return result;
}
