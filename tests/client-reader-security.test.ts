import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({user:{id:"verified-auth"} as {id:string}|null,account:{id:7,auth_user_id:"verified-auth",role:"user",is_admin:false,is_active:true,can_view_clients:false},from:vi.fn(),lookup:vi.fn(),legacy:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("react",()=>({cache:(fn:unknown)=>fn}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>({value:"legacy-admin-code"})})}));
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`redirect:${path}`);}}));
vi.mock("@/lib/access-codes",()=>({findAccountByAuthUserId:m.lookup,findAccountByCode:m.legacy}));
vi.mock("@/lib/supabase/server",()=>({
 createSupabaseAuthServerClient:async()=>({auth:{getUser:async()=>({data:{user:m.user},error:null})}}),
 createSupabaseServerClient:()=>({from:m.from}),
}));
vi.mock("@/lib/content-releases",()=>({isControlledProductionContentEnabled:()=>false}));
vi.mock("@/lib/training",()=>({getModulesWithExercises:async()=>[],getModuleProgress:vi.fn()}));
import { getAdminUsers } from "../lib/admin-user-insights";
import { getAuthenticatedClientReader, getAuthenticatedInvitationAdmin } from "../lib/session";
beforeEach(()=>{
 vi.clearAllMocks();m.user={id:"verified-auth"};m.account={id:7,auth_user_id:"verified-auth",role:"user",is_admin:false,is_active:true,can_view_clients:false};
 m.lookup.mockImplementation(async()=>m.account);
 m.legacy.mockResolvedValue({role:"admin",is_admin:true,is_active:true});
 m.from.mockImplementation(()=>{const query={select:()=>query,eq:()=>query,order:()=>query,then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:[],error:null}).then(resolve)};return query;});
});
describe("service-role client reads require a verified session and extra permission",()=>{
 it("rejects a normal user before any service-role data query",async()=>{
  await expect(getAdminUsers()).rejects.toThrow("redirect:/mon-espace");
  expect(m.lookup).toHaveBeenCalledWith("verified-auth");expect(m.from).not.toHaveBeenCalled();
 });
 it("rejects an absent Auth session even with a legacy Admin cookie",async()=>{
  m.user=null;
  await expect(getAdminUsers()).rejects.toThrow("redirect:/");
  expect(m.lookup).not.toHaveBeenCalled();expect(m.legacy).not.toHaveBeenCalled();expect(m.from).not.toHaveBeenCalled();
 });
 it("allows Julien to read but never to invite/change access",async()=>{
  m.account.can_view_clients=true;
  expect(await getAdminUsers()).toEqual([]);
  expect(m.from).toHaveBeenCalledWith("user_answers");
  await expect(getAuthenticatedInvitationAdmin()).rejects.toThrow("redirect:/admin/clients");
 });
 it("preserves Admin client reads and invitation access",async()=>{
  m.account.role="admin";m.account.is_admin=true;
  expect(await getAuthenticatedInvitationAdmin()).toMatchObject({is_admin:true});
  expect(await getAdminUsers()).toEqual([]);
 });
 it("rejects inactive client readers",async()=>{
  m.account.can_view_clients=true;m.account.is_active=false;
  await expect(getAuthenticatedClientReader()).rejects.toThrow("redirect:/");
  expect(m.from).not.toHaveBeenCalled();
 });
});
