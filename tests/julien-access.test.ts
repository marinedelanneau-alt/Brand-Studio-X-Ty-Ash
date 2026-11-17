import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({authorize:vi.fn(),identity:vi.fn(),lookup:vi.fn(),insert:vi.fn(),update:vi.fn(),upsert:vi.fn(),filters:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/session",()=>({getAuthenticatedInvitationAdmin:m.authorize}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:()=>({auth:{admin:{getUserById:m.identity}},from:(table:string)=>{
 if(!["client_access_codes","profiles"].includes(table))throw new Error("Unexpected table");
 const q={select:()=>q,ilike:(...args:unknown[])=>{m.filters(...args);return q;},eq:(...args:unknown[])=>{m.filters(...args);return q;},is:(...args:unknown[])=>{m.filters(...args);return q;},maybeSingle:m.lookup,insert:m.insert,update:(payload:unknown)=>{m.update(payload);return {...q,maybeSingle:async()=>({data:{id:7},error:null})};},upsert:m.upsert};return q;
}})}));
import { grantJulienAccess } from "../lib/julien-access";
const account={id:7,auth_user_id:"julien",role:"user",is_admin:false};
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://cplzwnlstcpqqzqeawgs.supabase.co");vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","test");
 m.identity.mockResolvedValue({data:{user:{id:"julien",email:"jsene@ty-ash.com"}},error:null});
 m.lookup.mockResolvedValue({data:account,error:null});m.insert.mockResolvedValue({error:null});m.upsert.mockResolvedValue({error:null});
});
describe("targeted server-side Admin grant",()=>{
 it("promotes Julien's verified account and grants client reading",async()=>{
  await grantJulienAccess("julien");await grantJulienAccess("julien");
  expect(m.insert).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenCalledWith({auth_user_id:"julien",is_active:true,code:null,role:"admin",is_admin:true,can_view_clients:true,complimentary_access:true});
  expect(m.filters).toHaveBeenCalledWith("id",7);expect(m.filters).toHaveBeenCalledWith("email","jsene@ty-ash.com");
  expect(m.upsert).toHaveBeenCalledWith(expect.objectContaining({id:"julien"}),{onConflict:"id",ignoreDuplicates:true});
 });
 it("creates Julien's missing application profile with the Admin role",async()=>{
  m.lookup.mockResolvedValueOnce({data:null,error:null});
  await grantJulienAccess("julien");
  expect(m.insert).toHaveBeenCalledWith(expect.objectContaining({email:"jsene@ty-ash.com",role:"admin",is_admin:true,can_view_clients:true,complimentary_access:true}));
 });
 it("recovers a concurrent insert without duplicating the profile",async()=>{
  m.lookup.mockResolvedValueOnce({data:null,error:null});m.insert.mockResolvedValue({error:{code:"23505"}});
  await grantJulienAccess("julien");expect(m.insert).toHaveBeenCalledTimes(1);expect(m.update).toHaveBeenCalledTimes(1);
 });
 it("refuses an unrelated Auth identity",async()=>{
  m.identity.mockResolvedValue({data:{user:{email:"other@example.test"}},error:null});
  await expect(grantJulienAccess("other")).rejects.toThrow("Identité");expect(m.update).not.toHaveBeenCalled();expect(m.insert).not.toHaveBeenCalled();
 });
 it("keeps the grant idempotent for an existing Admin",async()=>{
  m.lookup.mockResolvedValue({data:{...account,role:"admin",is_admin:true},error:null});
  await grantJulienAccess("julien");
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({role:"admin",is_admin:true,can_view_clients:true}));
 });
 it("refuses an unknown role or conflicting identity without overwriting them",async()=>{
  for(const changed of [{role:"unknown"},{auth_user_id:"other"}]){
   m.lookup.mockResolvedValue({data:{...account,...changed},error:null});
   await expect(grantJulienAccess("julien")).rejects.toThrow("incompatible");
  }
  expect(m.update).not.toHaveBeenCalled();
 });
 it("authorizes the Admin before any identity lookup or write",async()=>{
  m.authorize.mockRejectedValue(new Error("Forbidden"));
  await expect(grantJulienAccess("julien")).rejects.toThrow("Forbidden");expect(m.identity).not.toHaveBeenCalled();
 });
});
