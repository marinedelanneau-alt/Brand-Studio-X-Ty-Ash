import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("installs, claims reminders once, excludes Admins/Julien and deletes only an expired workspace", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create table public.client_access_codes (
        id bigint primary key, email text, client_name text, role text default 'user',
        is_admin boolean default false, is_active boolean default true, auth_user_id uuid,
        created_at timestamptz default '2020-01-01'
      );
      create table public.brand_projects(id bigint primary key, account_id bigint references client_access_codes(id) on delete cascade);
      create table public.user_answers(id bigint primary key, user_id bigint references client_access_codes(id), project_id bigint references brand_projects(id), answer text);
      create table public.user_module_progress(id bigint primary key, user_id bigint references client_access_codes(id), project_id bigint references brand_projects(id));
      create table public.tyash_questionnaire_prefills(project_id bigint references brand_projects(id), updated_by bigint references client_access_codes(id));
      create table public.project_exercise_answers(project_id bigint references brand_projects(id) on delete cascade);
      create table public.brand_exports(project_id bigint references brand_projects(id) on delete cascade);
      create table public.subscriptions(user_id bigint references client_access_codes(id) on delete cascade);
      create table public.privacy_requests(account_id bigint);
      create table public.purchase_activation_codes(email text);
      create table public.commercial_orders_v1(account_id bigint, receipt text);
      create table public.profiles(id uuid);
      create table public.legal_acceptances(user_id uuid references auth.users(id), evidence text);
      insert into public.client_access_codes(id,email,role,is_admin,is_active) values
        (1,'marine@example.test','admin',true,true),
        (2,'jsene@ty-ash.com','user',false,true),
        (3,'flag-admin@example.test','user',true,false),
        (4,'old-client@example.test','user',false,true),
        (5,'other-client@example.test','user',false,true);
      grant select,update on public.client_access_codes to authenticated;
    `);
    const sql = readFileSync(new URL("../supabase/migrations/20261113180000_account_lifetime.sql", import.meta.url), "utf8");
    await db.exec(sql);
    const initial = (await db.query<{ id: number; access_started_at: Date | null }>("select id,access_started_at from client_access_codes order by id")).rows;
    expect(initial.slice(0, 3).every(account => account.access_started_at === null)).toBe(true);
    expect(initial[3].access_started_at).not.toBeNull();
    const year = await db.query<{ valid: boolean }>("select access_started_at >= now() - interval '1 minute' and access_expires_at = access_started_at + interval '1 year' as valid from client_access_codes where id=4");
    expect(year.rows[0].valid).toBe(true);
    await db.exec(sql); // Reinstallation never moves the deadline.
    expect((await db.query<{ access_started_at: Date | null }>("select access_started_at from client_access_codes where id=4")).rows[0].access_started_at).toEqual(initial[3].access_started_at);

    await db.exec("set role authenticated");
    await expect(db.query("select * from claim_expired_accounts(10)")).rejects.toThrow(/permission denied/);
    await expect(db.query("select * from claim_account_expiry_reminders('month',10)")).rejects.toThrow(/permission denied/);
    await expect(db.query("select * from account_expiry_reminders")).rejects.toThrow(/permission denied/);
    await expect(db.query("update client_access_codes set access_started_at = now() where id=4")).rejects.toThrow(/Server-managed/);
    await expect(db.query("update client_access_codes set email = 'jsene@ty-ash.com' where id=4")).rejects.toThrow(/Server-managed/);
    await db.exec("reset role");

    await db.exec("insert into client_access_codes(id,email,access_started_at) values(6,'leap@example.test','2024-02-29T12:34:56Z')");
    expect((await db.query<{ expiry: string }>("select to_char(access_expires_at at time zone 'UTC','YYYY-MM-DD HH24:MI:SS') as expiry from client_access_codes where id=6")).rows[0].expiry).toBe("2025-02-28 12:34:56");
    await db.exec("delete from client_access_codes where id=6");
    await db.exec("update client_access_codes set access_started_at=now()-interval '1 year'+interval '20 days' where id=4");
    const month = (await db.query<{ account_id: number; claim_token: string }>("select * from claim_account_expiry_reminders('month',10)")).rows;
    expect(month.map(row => row.account_id)).toEqual([4]);
    expect((await db.query("select * from claim_account_expiry_reminders('month',10)")).rows).toHaveLength(0);
    await db.query("update account_expiry_reminders set sent_at=now() where claim_token=$1", [month[0].claim_token]);
    await db.exec("update client_access_codes set access_started_at=now()-interval '1 year'+interval '14 days' where id=4");
    expect((await db.query<{ account_id: number }>("select * from claim_account_expiry_reminders('fortnight',10)")).rows.map(row => row.account_id)).toEqual([4]);
    expect((await db.query("select * from claim_account_expiry_reminders('month',10)")).rows).toHaveLength(0);
    await db.exec("update account_expiry_reminders set claimed_at=now()-interval '2 hours' where stage='fortnight'");
    expect((await db.query("select * from claim_account_expiry_reminders('fortnight',10)")).rows).toHaveLength(1); // Provider failure can retry.

    await db.exec(`
      insert into auth.users values('00000000-0000-0000-0000-000000000004');
      update client_access_codes set auth_user_id='00000000-0000-0000-0000-000000000004',access_started_at=now()-interval '1 year'-interval '1 second' where id=4;
      insert into brand_projects values(40,4),(50,5);
      insert into user_answers values(400,4,40,'expired answer'),(500,5,50,'keep answer');
      insert into user_module_progress values(400,4,40);
      insert into tyash_questionnaire_prefills values(40,1),(50,2);
      insert into project_exercise_answers values(40),(50);
      insert into brand_exports values(40),(50);
      insert into subscriptions values(4),(5);
      insert into privacy_requests values(4),(5);
      insert into purchase_activation_codes values('old-client@example.test'),('other-client@example.test');
      insert into commercial_orders_v1 values(4,'keep durable receipt');
      insert into profiles values('00000000-0000-0000-0000-000000000004');
      insert into legal_acceptances values('00000000-0000-0000-0000-000000000004','keep immutable evidence');
    `);
    await expect(db.query("select finalize_expired_account(5,gen_random_uuid())")).rejects.toThrow(/not authorized/);
    const claimed = (await db.query<{ id: number; is_active: boolean; access_deletion_token: string }>("select * from claim_expired_accounts(10)")).rows;
    expect(claimed.map(row => row.id)).toEqual([4]); expect(claimed[0].is_active).toBe(false);
    expect((await db.query("select * from claim_expired_accounts(10)")).rows).toHaveLength(0);
    await expect(db.query("update client_access_codes set role='admin' where id=4")).rejects.toThrow(/already started/);
    await expect(db.query("select finalize_expired_account(4,gen_random_uuid())")).rejects.toThrow(/not authorized/);
    await db.query("select finalize_expired_account(4,$1)", [claimed[0].access_deletion_token]);
    expect((await db.query("select id from client_access_codes order by id")).rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 5 }]);
    expect((await db.query("select answer from user_answers")).rows).toEqual([{ answer: "keep answer" }]);
    expect((await db.query("select id from brand_projects")).rows).toEqual([{ id: 50 }]);
    expect((await db.query("select * from profiles")).rows).toHaveLength(0);
    expect((await db.query("select evidence from legal_acceptances")).rows).toEqual([{ evidence: "keep immutable evidence" }]);
    expect((await db.query("select * from commercial_orders_v1")).rows).toEqual([{ account_id: null, receipt: "keep durable receipt" }]);
  } finally { await db.close(); }
}, 30000);
