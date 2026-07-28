"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getPublishedLegalDocument, isLegalPreviewEnabled } from "@/lib/legal";

export async function acceptCurrentTerms(formData: FormData) {
  if (!isLegalPreviewEnabled() || formData.get("accepted") !== "on") throw new Error("Acceptation explicite requise.");
  const auth = await createSupabaseAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/");
  const document = await getPublishedLegalDocument("terms_of_use");
  if (!document || document.id !== formData.get("documentId")) throw new Error("Version juridique invalide.");
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipHash = ip ? createHash("sha256").update(`${process.env.LEGAL_IP_HASH_SALT ?? "preview-only"}:${ip}`).digest("hex") : null;
  const { error } = await auth.from("legal_acceptances").insert({
    user_id: user.id, legal_document_id: document.id, document_type: document.document_type,
    document_version: document.version, acceptance_method: "explicit_checkbox",
    source: "acceptance_gate", ip_hash: ipHash, user_agent: requestHeaders.get("user-agent"),
  });
  if (error && error.code !== "23505") throw error;
  redirect("/mon-espace");
}
