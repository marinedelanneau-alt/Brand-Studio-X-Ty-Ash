import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({verify:vi.fn(),exchange:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseAuthServerClient:async()=>({auth:{verifyOtp:m.verify,exchangeCodeForSession:m.exchange}})}));
import { GET } from "../app/auth/reset/callback/route";
beforeEach(()=>{vi.resetAllMocks();m.verify.mockResolvedValue({error:null});m.exchange.mockResolvedValue({error:null});});
describe("secure first-password callback",()=>{
 for(const type of ["invite","recovery"]) it(`verifies ${type} and redirects without tokens`,async()=>{
  const result=await GET(new Request(`https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=secret&type=${type}`));
  expect(m.verify).toHaveBeenCalledWith({token_hash:"secret",type});
  expect(result.headers.get("location")).toBe("https://brand-studio-x-ty-ash.vercel.app/auth/reset-password");
  expect(result.headers.get("cache-control")).toBe("no-store");
 });
 it("rejects expired tokens",async()=>{
  m.verify.mockResolvedValue({error:{message:"expired"}});
  const result=await GET(new Request("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=secret&type=invite"));
  expect(result.headers.get("location")).toContain("error=invalid_or_expired");
 });
 it("preserves existing PKCE reset links",async()=>{
  await GET(new Request("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?code=pkce"));
  expect(m.exchange).toHaveBeenCalledWith("pkce");expect(m.verify).not.toHaveBeenCalled();
 });
 it("rejects unsupported token types and external redirect parameters",async()=>{
  const result=await GET(new Request("https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback?token_hash=secret&type=signup&next=https://evil.example"));
  expect(m.verify).not.toHaveBeenCalled();expect(result.headers.get("location")).toBe("https://brand-studio-x-ty-ash.vercel.app/auth/reset-password?error=missing_code");
 });
});
