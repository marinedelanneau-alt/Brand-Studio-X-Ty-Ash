import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mailer = readFileSync(
  new URL("../lib/mailer.ts", import.meta.url),
  "utf8",
);
const resetForm = readFileSync(
  new URL("../app/ui/reset-password-form.tsx", import.meta.url),
  "utf8",
);
const resetCallback = readFileSync(
  new URL("../app/auth/reset/callback/route.ts", import.meta.url),
  "utf8",
);

const resetEmailFunction =
  mailer.match(
    /export async function sendPasswordResetEmail[\s\S]*$/,
  )?.[0] ?? "";

describe("réinitialisation du mot de passe", () => {
  it("envoie un véritable message de récupération et non une activation", () => {
    expect(resetEmailFunction).toContain(
      "Réinitialisation de ton mot de passe Brand Studio",
    );
    expect(resetEmailFunction).toContain("Modifier mon mot de passe");
    expect(resetEmailFunction).not.toContain("Ton aventure commence ici");
    expect(resetEmailFunction).not.toContain("Créer mon mot de passe");
  });

  it("échange le code de récupération contre une session", () => {
    expect(resetCallback).toContain("exchangeCodeForSession(code)");
    expect(resetCallback).toContain("/auth/reset-password");
  });

  it("met à jour le mot de passe avec la session navigateur validée", () => {
    expect(resetForm).toContain("supabase.auth.getUser()");
    expect(resetForm).toContain("supabase.auth.updateUser({ password })");
    expect(resetForm).not.toContain("useActionState(updatePassword");
  });
});
