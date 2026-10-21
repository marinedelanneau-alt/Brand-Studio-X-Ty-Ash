import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({save:vi.fn(),from:vi.fn(),account:{id:7,role:"user",is_admin:false,is_active:true,can_view_clients:true,complimentary_access:true}}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/session",()=>({getAuthenticatedAccount:async()=>m.account}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:()=>({from:m.from})}));
vi.mock("@/lib/content-releases",()=>({getAdminPreviewAnswers:vi.fn(),saveAdminPreviewAnswers:vi.fn()}));
vi.mock("@/lib/training",()=>({
 getWorkspaceData:async()=>({project:{id:70,account_id:7},contentPreview:{isPreviewMode:false},modules:[{id:-1,stableKey:"tyash_v1_module",position:1,submodules:[],exercises:[{id:-2,stableKey:"tyash_v1_question",type:"open",position:1,submodule_id:null}],answers:{},answerVersions:{}}]}),
 upsertStableModuleAnswers:m.save,
}));
import { syncAnswerMutations } from "../app/sync-answer-mutations";
import { getSubscriptionAccessStatus, hasActiveAccess } from "../lib/subscriptions";
beforeEach(()=>{
 vi.clearAllMocks();Object.assign(m.account,{is_active:true,is_admin:false,role:"user",can_view_clients:true,complimentary_access:true});
 m.from.mockImplementation((table:string)=>{
  if(table!=="client_access_codes" && !(table==="subscriptions" && !m.account.complimentary_access))throw new Error("Unexpected subscription access");
  const query={select:()=>query,eq:()=>query,order:()=>query,limit:()=>query,maybeSingle:async()=>({data:table==="subscriptions"?{status:"paid",access_granted:true,plan:"brand_studio"}:m.account,error:null})};return query;
 });
});
const mutation={id:"mutation",userId:7,projectId:70,moduleId:-1,exerciseId:-2,moduleStableKey:"tyash_v1_module",exerciseStableKey:"tyash_v1_question",values:["My answer"],revision:1,updatedAt:Date.now(),operation:"upsert" as const};
describe("complimentary learner plus client consultation",()=>{
 it("grants active access without querying Stripe subscriptions",async()=>{
  expect(await getSubscriptionAccessStatus(7)).toMatchObject({plan:"complimentary",accessGranted:true,stripeCustomerId:null,stripeSubscriptionId:null});
  expect(await hasActiveAccess(7)).toBe(true);
 });
 it("keeps normal paid learner answer saving unchanged",async()=>{
  m.account.can_view_clients=false;m.account.complimentary_access=false;
  await syncAnswerMutations([mutation]);
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({userId:7,projectId:70}));
 });
 it("preserves Admin personal answer saving",async()=>{
  m.account.role="admin";m.account.is_admin=true;m.account.can_view_clients=false;m.account.complimentary_access=false;
  await syncAnswerMutations([mutation]);
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({userId:7,projectId:70}));
 });
 it("saves own answers through the real synchronization action",async()=>{
  await syncAnswerMutations([mutation]);
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({userId:7,projectId:70,answers:[expect.objectContaining({exerciseId:-2,values:["My answer"]})]}));
 });
 it("rejects another client identity or project before any write",async()=>{
  for(const changed of [{userId:8},{projectId:80}])await expect(syncAnswerMutations([{...mutation,...changed}])).rejects.toThrow("invalide");
  expect(m.save).not.toHaveBeenCalled();
 });
 it("revokes complimentary access when the account is inactive",async()=>{
  m.account.is_active=false;
  expect(await hasActiveAccess(7)).toBe(false);
  await expect(syncAnswerMutations([mutation])).rejects.toThrow("Accès requis");
  expect(m.save).not.toHaveBeenCalled();
 });
});
