import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("activates exactly 365 days once, blocks unpaid/expired JWTs, preserves Admins and data", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
      create table client_access_codes(id bigint primary key, email text, client_name text, role text default 'user',
        is_admin boolean default false,is_active boolean default true,complimentary_access boolean default false,auth_user_id uuid);
      create table subscriptions(user_id bigint, plan text, status text,access_granted boolean,current_period_end timestamptz,
        provider text default 'stripe',stripe_checkout_session_id text,stripe_subscription_id text);
      create table brand_projects(id bigint primary key,account_id bigint);
      create table user_answers(id bigint primary key,answer text);
      alter table user_answers enable row level security;
      create policy fixture_own on user_answers for all to authenticated using (true) with check (true);
      grant select,insert,update on user_answers to authenticated;
      grant select,update on client_access_codes to authenticated;
      insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
      insert into client_access_codes(id,email,role,is_admin,auth_user_id) values
        (1,'marine@example.test','admin',true,'00000000-0000-0000-0000-000000000001'),
        (2,'client@example.test','user',false,'00000000-0000-0000-0000-000000000002');
      insert into subscriptions(user_id,plan,status,access_granted,stripe_checkout_session_id) values(2,'brand_studio','paid',true,'cs_historical');
      insert into user_answers values(1,'réponse conservée');
    `);
    await db.exec(readFileSync(new URL("../supabase/migrations/20261113180000_account_lifetime.sql", import.meta.url), "utf8"));
    const before = (await db.query<{ id: number; email: string; access_started_at: Date | null; access_expires_at: Date | null }>("select * from client_access_codes order by id")).rows;
    await db.exec("insert into client_access_codes(id,email,complimentary_access) values(4,'unpaid-historical@example.test',true)");
    await db.exec(readFileSync(new URL("../supabase/migrations/20261117120000_tyash_annual_payments.sql", import.meta.url), "utf8"));
    expect((await db.query("select id,email,access_started_at,access_expires_at from client_access_codes where id<3 order by id")).rows)
      .toEqual(before.map(({ id,email,access_started_at,access_expires_at }) => ({ id,email,access_started_at,access_expires_at })));
    expect((await db.query("select annual_access_required,access_started_at,access_expires_at,complimentary_access from client_access_codes where id=4")).rows[0])
      .toEqual({ annual_access_required: true, access_started_at: null, access_expires_at: null, complimentary_access: true });
    await db.exec(`insert into client_access_codes(id,email,auth_user_id,annual_access_required)
      values(3,'new@example.test','00000000-0000-0000-0000-000000000003',true);
      set test.uid='00000000-0000-0000-0000-000000000003';`);
    expect((await db.query<{ access_started_at: null }>("select access_started_at from client_access_codes where id=3")).rows[0].access_started_at).toBeNull();
    await db.exec("set role authenticated");
    expect((await db.query("select * from user_answers")).rows).toHaveLength(0);
    await expect(db.exec("insert into user_answers values(2,'unpaid')")).rejects.toThrow(/row-level security/);
    await expect(db.exec("update client_access_codes set annual_access_required=false where id=3")).rejects.toThrow(/Server-managed/);
    await expect(db.exec("select * from annual_payments")).rejects.toThrow(/permission denied/);
    await expect(db.exec("select reserve_annual_checkout(3,'00000000-0000-0000-0000-000000000003','price_test',false)")).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
    const reserve = () => db.query<{ id: string; checkout_attempt: number }>("select * from reserve_annual_checkout(3,'00000000-0000-0000-0000-000000000003','price_test',false)");
    const order = (await reserve()).rows[0];
    expect((await reserve()).rows[0].id).toBe(order.id);
    await expect(db.exec("select reserve_annual_checkout(3,'00000000-0000-0000-0000-000000000003','price_live',true)")).rejects.toThrow(/environment mismatch/);
    await db.exec("update annual_payments set session_id='cs_test', status='processing' where account_id=3");
    await expect(reserve()).rejects.toThrow(/already paid or processing/);
    await db.exec("update annual_payments set status='failed' where account_id=3");
    expect((await reserve()).rows[0].checkout_attempt).toBe(2);
    await db.exec("update annual_payments set session_id='cs_retry' where account_id=3");
    const paidAt = new Date(Date.now()-1000).toISOString();
    const apply = (date = paidAt) => db.query("select apply_annual_payment('cs_retry','pi_test','cus_test','evt_test',$1,false)",[date]);
    await apply();
    const paid = (await db.query<{ paid_at: Date; expires_at: Date }>("select paid_at,expires_at from annual_payments")).rows[0];
    expect(paid.expires_at.getTime()-paid.paid_at.getTime()).toBe(365*86400000);
    await apply(new Date().toISOString());
    expect((await db.query("select paid_at,expires_at from annual_payments")).rows[0]).toEqual(paid);
    await expect(reserve()).rejects.toThrow(/already paid/);
    await db.exec("set role authenticated");
    expect((await db.query("select * from user_answers")).rows).toHaveLength(1);
    await db.exec("insert into user_answers values(2,'progression sauvegardée')");
    await expect(db.exec("update client_access_codes set access_expires_at=now()+interval '10 years' where id=3")).rejects.toThrow(/Server-managed/);
    await db.exec("reset role; update annual_payments set status='refunded' where account_id=3");
    await apply();
    expect((await db.query<{ status: string }>("select status from annual_payments")).rows[0].status).toBe("refunded");
    await db.exec("set role authenticated");
    expect((await db.query("select * from user_answers")).rows).toHaveLength(0);
    await db.exec("reset role; update annual_payments set status='paid', paid_at=now()-interval '366 days', expires_at=now()-interval '1 day' where account_id=3");
    await db.exec("set role authenticated");
    expect((await db.query("select * from user_answers")).rows).toHaveLength(0);
    await db.exec("set test.uid='00000000-0000-0000-0000-000000000001'");
    expect((await db.query("select * from user_answers")).rows).toHaveLength(2); // Admin remains unlimited.
    await db.exec("reset role");
    expect((await db.query("select * from claim_expired_accounts(10)")).rows).toHaveLength(0);
    await expect(db.exec("select finalize_expired_account(3,gen_random_uuid())")).rejects.toThrow(/disabled/);
    expect((await db.query("select * from auth.users")).rows).toHaveLength(3);
    expect((await db.query("select * from user_answers")).rows).toHaveLength(2);
    expect((await db.query("select * from client_access_codes")).rows).toHaveLength(4);
  } finally { await db.close(); }
}, 30000);
