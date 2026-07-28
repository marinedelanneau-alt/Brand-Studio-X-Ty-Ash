import { describe, expect, it } from "vitest";
import { copyrightText, shouldRequireAcceptance } from "../lib/legal-policy";

describe("legal enforcement policy", () => {
  const base = { isAdmin: false, createdAt: "2026-07-01", accepted: false };
  it("never blocks when disabled", () => expect(shouldRequireAcceptance({...base,mode:"disabled"})).toBe(false));
  it("blocks only admins in admin_only", () => {
    expect(shouldRequireAcceptance({...base,mode:"admin_only"})).toBe(false);
    expect(shouldRequireAcceptance({...base,mode:"admin_only",isAdmin:true})).toBe(true);
  });
  it("supports new users without blocking existing users", () => {
    expect(shouldRequireAcceptance({...base,mode:"new_users_only",cutoff:"2026-06-01"})).toBe(true);
    expect(shouldRequireAcceptance({...base,mode:"new_users_only",cutoff:"2026-08-01"})).toBe(false);
  });
  it("blocks every unaccepted user in all_users", () => expect(shouldRequireAcceptance({...base,mode:"all_users"})).toBe(true));
  it("never blocks an accepted version", () => expect(shouldRequireAcceptance({...base,mode:"all_users",accepted:true})).toBe(false));
});
describe("copyright", () => {
  it("uses a single year in 2026", () => expect(copyrightText(2026)).toContain("© 2026 Brand Studio"));
  it("uses a dynamic range later", () => expect(copyrightText(2027)).toContain("© 2026–2027 Brand Studio"));
});
