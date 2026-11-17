begin;

alter table public.client_access_codes
  add column if not exists access_started_at timestamptz,
  add column if not exists access_expires_at timestamptz,
  add column if not exists access_deletion_started_at timestamptz,
  add column if not exists access_deletion_token uuid,
  add column if not exists access_deletion_lease_until timestamptz;

create or replace function public.account_lifetime_exempt(admin_flag boolean, account_role text, account_email text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(admin_flag, false) or coalesce(account_role = 'admin', false)
    or lower(trim(coalesce(account_email, ''))) = 'jsene@ty-ash.com';
$$;

-- Existing clients get a full year from the FIRST installation, never from
-- their historical signup date. Reapplying the migration does not reset it.
update public.client_access_codes
set access_started_at = now(), access_expires_at = now() + interval '1 year'
where access_started_at is null
  and not public.account_lifetime_exempt(is_admin, role, email);

create or replace function public.set_account_lifetime()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.access_deletion_started_at is not null and (
    new.email is distinct from old.email or new.auth_user_id is distinct from old.auth_user_id or
    new.is_admin is distinct from old.is_admin or new.role is distinct from old.role or
    new.access_started_at is distinct from old.access_started_at or
    new.access_expires_at is distinct from old.access_expires_at or new.is_active
  ) then raise exception 'Account deletion already started'; end if;
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' then
      if public.account_lifetime_exempt(new.is_admin, new.role, new.email) then
        raise exception 'Server-managed account exemption';
      end if;
      new.access_started_at := now();
      new.access_deletion_started_at := null;
      new.access_deletion_token := null;
      new.access_deletion_lease_until := null;
    elsif new.access_started_at is distinct from old.access_started_at
       or new.access_expires_at is distinct from old.access_expires_at
       or new.access_deletion_started_at is distinct from old.access_deletion_started_at
       or new.access_deletion_token is distinct from old.access_deletion_token
       or new.access_deletion_lease_until is distinct from old.access_deletion_lease_until then
      raise exception 'Server-managed account lifetime';
    end if;
    if tg_op = 'UPDATE' and (new.is_admin is distinct from old.is_admin or new.role is distinct from old.role
      or new.email is distinct from old.email or new.auth_user_id is distinct from old.auth_user_id) then
      raise exception 'Server-managed account identity';
    end if;
  end if;
  if public.account_lifetime_exempt(new.is_admin, new.role, new.email) then
    new.access_started_at := null;
    new.access_expires_at := null;
  else
    new.access_started_at := coalesce(new.access_started_at, now());
    new.access_expires_at := new.access_started_at + interval '1 year';
  end if;
  return new;
end $$;
drop trigger if exists client_account_lifetime on public.client_access_codes;
create trigger client_account_lifetime before insert or update on public.client_access_codes
for each row execute function public.set_account_lifetime();

create index if not exists client_account_expiry_idx on public.client_access_codes(access_expires_at)
where access_expires_at is not null;

create table if not exists public.account_expiry_reminders (
  account_id bigint not null references public.client_access_codes(id) on delete cascade,
  expires_at timestamptz not null,
  stage text not null check (stage in ('month', 'fortnight')),
  claim_token uuid not null default gen_random_uuid(),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  message_id text,
  primary key (account_id, expires_at, stage)
);
alter table public.account_expiry_reminders enable row level security;
revoke all on public.account_expiry_reminders from public, anon, authenticated;
grant all on public.account_expiry_reminders to service_role;

create or replace function public.claim_account_expiry_reminders(reminder_stage text, batch_limit integer default 50)
returns table(account_id bigint, email text, client_name text, expires_at timestamptz, claim_token uuid)
language plpgsql security definer set search_path = public as $$
begin
  if reminder_stage not in ('month', 'fortnight') then raise exception 'Invalid stage'; end if;
  return query
  with candidates as (
    select a.* from public.client_access_codes a
    where not public.account_lifetime_exempt(a.is_admin, a.role, a.email)
      and a.access_deletion_started_at is null and a.access_expires_at > now()
      and case when reminder_stage = 'month' then
        now() >= a.access_expires_at - interval '1 month' and now() < a.access_expires_at - interval '14 days'
      else now() >= a.access_expires_at - interval '14 days' end
      and not exists (select 1 from public.account_expiry_reminders r
        where r.account_id = a.id and r.expires_at = a.access_expires_at and r.stage = reminder_stage
          and (r.sent_at is not null or r.claimed_at > now() - interval '1 hour'))
    order by a.access_expires_at, a.id limit least(greatest(batch_limit, 1), 100)
    for update of a skip locked
  ), claimed as (
    insert into public.account_expiry_reminders as existing(account_id, expires_at, stage)
    select c.id, c.access_expires_at, reminder_stage from candidates c
    on conflict on constraint account_expiry_reminders_pkey do update
      set claimed_at = now(), claim_token = gen_random_uuid()
      where existing.sent_at is null and existing.claimed_at <= now() - interval '1 hour'
    returning existing.account_id, existing.expires_at, existing.claim_token
  )
  select c.id, c.email, c.client_name, c.access_expires_at, r.claim_token
  from candidates c join claimed r on r.account_id = c.id;
end $$;

create or replace function public.claim_expired_accounts(batch_limit integer default 10)
returns setof public.client_access_codes
language sql security definer set search_path = public as $$
  with candidates as (
    select id from public.client_access_codes a
    where not public.account_lifetime_exempt(a.is_admin, a.role, a.email)
      and a.access_expires_at <= now()
      and (a.access_deletion_lease_until is null or a.access_deletion_lease_until <= now())
    order by a.access_expires_at, a.id limit least(greatest(batch_limit, 1), 50)
    for update skip locked
  )
  update public.client_access_codes a set is_active = false,
    access_deletion_started_at = coalesce(a.access_deletion_started_at, now()),
    access_deletion_token = gen_random_uuid(), access_deletion_lease_until = now() + interval '15 minutes'
  from candidates c where a.id = c.id returning a.*;
$$;

-- Storage is removed via its API and Auth irreversibly soft-deleted before
-- finalization. Immutable legal acceptances keep their Auth tombstone FK.
create or replace function public.finalize_expired_account(target_account_id bigint, deletion_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare target public.client_access_codes%rowtype;
begin
  select * into target from public.client_access_codes where id = target_account_id for update;
  if not found then return; end if;
  if public.account_lifetime_exempt(target.is_admin, target.role, target.email)
    or target.access_expires_at is null or target.access_expires_at > now()
    or target.access_deletion_started_at is null or target.access_deletion_token is distinct from deletion_token
    or target.access_deletion_lease_until <= now() then raise exception 'Deletion not authorized'; end if;
  delete from public.user_answers where user_id = target.id
    or project_id in (select id from public.brand_projects where account_id = target.id);
  delete from public.user_module_progress where user_id = target.id
    or project_id in (select id from public.brand_projects where account_id = target.id);
  delete from public.tyash_questionnaire_prefills where project_id in (select id from public.brand_projects where account_id = target.id);
  delete from public.privacy_requests where account_id = target.id;
  delete from public.purchase_activation_codes where lower(email) = lower(target.email);
  if to_regclass('public.profiles') is not null then
    execute 'delete from public.profiles where id = $1' using target.auth_user_id;
  end if;
  -- Orders and immutable acceptance evidence are retained separately from the
  -- deleted workspace; detach the application account without rewriting receipts.
  update public.commercial_orders_v1 set account_id = null where account_id = target.id;
  delete from public.client_access_codes where id = target.id;
end $$;

revoke all on function public.claim_account_expiry_reminders(text, integer) from public, anon, authenticated;
revoke all on function public.claim_expired_accounts(integer) from public, anon, authenticated;
revoke all on function public.finalize_expired_account(bigint, uuid) from public, anon, authenticated;
grant execute on function public.claim_account_expiry_reminders(text, integer) to service_role;
grant execute on function public.claim_expired_accounts(integer) to service_role;
grant execute on function public.finalize_expired_account(bigint, uuid) to service_role;
commit;
