import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({send:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@getbrevo/brevo",()=>({BrevoClient:class { transactionalEmails={sendTransacEmail:m.send}; }}));
import { sendJulienInvitationEmail } from "../lib/mailer";
beforeEach(()=>{vi.clearAllMocks();vi.spyOn(console,"error").mockImplementation(()=>{});vi.stubEnv("BREVO_API_KEY","server-key");vi.stubEnv("BREVO_SENDER_EMAIL","marine@example.test");m.send.mockResolvedValue({messageId:"message-id"});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe("Julien custom email",()=>{
 it("uses the exact recipient, subject, text and secure activation button",async()=>{
  const link="https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=secret&type=invite";
  expect(await sendJulienInvitationEmail(link)).toBe("message-id");
  expect(m.send).toHaveBeenCalledWith(expect.objectContaining({subject:"Julien, votre accès à Brand Studio X Ty Ash est prêt",to:[{email:"jsene@ty-ash.com",name:"Julien SENE"}],htmlContent:expect.stringContaining("CRÉER MON COMPTE"),textContent:expect.stringContaining(link)}));
 });
 it("fails when Brevo does not acknowledge acceptance",async()=>{
  m.send.mockResolvedValue({});
  await expect(sendJulienInvitationEmail("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback")).rejects.toThrow("Brevo");
 });
 it("rejects all other domains before an email request",async()=>{
  await expect(sendJulienInvitationEmail("https://brand-studio-tyash.vercel.app/auth/reset/callback")).rejects.toThrow("Domaine");
  expect(m.send).not.toHaveBeenCalled();
 });
 it("logs filtered API details only on the server and returns a generic error",async()=>{
  m.send.mockRejectedValue({statusCode:401,body:{code:"unauthorized",message:"Key not found: server-key"},message:"unsafe activation URL"});
  await expect(sendJulienInvitationEmail("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=activation-secret&type=recovery")).rejects.toThrow("Envoi Brevo non confirmé");
  expect(console.error).toHaveBeenCalledWith("[Ty Ash] Julien Brevo email failure",{httpStatus:401,code:"unauthorized",message:"Key not found: [REDACTED]"});
  expect(m.send).toHaveBeenCalledTimes(1);
 });
});
