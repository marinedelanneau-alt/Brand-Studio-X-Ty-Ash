begin;

-- Preserve historical accounts and purchases. New self-registered accounts use
-- only this payment ledger; a legacy subscription cannot grant them access.
alter table public.client_access_codes add column if not exists annual_access_required boolean not null default false;

create table public.annual_payments (
  id uuid primary key default gen_random_uuid(),
  account_id bigint not null unique references public.client_access_codes(id),
  auth_user_id uuid not null references auth.users(id),
  offer_version text not null default 'tyash-beta-55-365-v1' check (offer_version = 'tyash-beta-55-365-v1'),
  live_mode boolean not null,
  price_id text not null,
  session_id text unique,
  customer_id text,
  payment_intent_id text unique,
  amount integer not null default 5500 check (amount = 5500),
  currency text not null default 'eur' check (currency = 'eur'),
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','expired','refunded','disputed')),
  checkout_attempt integer not null default 1,
  checkout_expires_at timestamptz not null default now() + interval '31 minutes',
  paid_at timestamptz,
  expires_at timestamptz,
  payment_event_id text unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((paid_at is null and expires_at is null) or (paid_at is not null and expires_at = paid_at + interval '31536000 seconds'))
);
alter table public.annual_payments enable row level security;
revoke all on public.annual_payments from public, anon, authenticated;
grant all on public.annual_payments to service_role;

-- Identity and entitlement fields are exclusively server-managed. An expiry
-- never causes a deletion. Keep the previous protection of identity fields.
create or replace function public.set_account_lifetime()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin') then
    if tg_op = 'INSERT' then raise exception 'Server-managed account creation'; end if;
    if new.is_admin is distinct from old.is_admin or new.role is distinct from old.role
      or new.email is distinct from old.email or new.auth_user_id is distinct from old.auth_user_id
      or new.is_active is distinct from old.is_active
      or new.complimentary_access is distinct from old.complimentary_access
      or new.annual_access_required is distinct from old.annual_access_required
      or new.access_started_at is distinct from old.access_started_at
      or new.access_expires_at is distinct from old.access_expires_at
      or new.access_deletion_started_at is distinct from old.access_deletion_started_at
      or new.access_deletion_token is distinct from old.access_deletion_token
      or new.access_deletion_lease_until is distinct from old.access_deletion_lease_until then
      raise exception 'Server-managed account identity and access';
    end if;
  end if;
  -- Do not recalculate historical deadlines or change existing Admin accounts.
  if tg_op = 'INSERT' and not new.annual_access_required
    and not public.account_lifetime_exempt(new.is_admin,new.role,new.email) then
    new.access_started_at := coalesce(new.access_started_at,now());
    new.access_expires_at := coalesce(new.access_expires_at,new.access_started_at + interval '1 year');
  end if;
  return new;
end $$;

-- Existing unpaid learners also need a first purchase. Keep all their project
-- data and identity fields. Preserve Admin exemptions and evidenced historical
-- Stripe purchases (including expired purchases, which cannot be renewed yet).
update public.client_access_codes a
set annual_access_required=true, access_started_at=null, access_expires_at=null
where a.is_active and not a.annual_access_required
  and not public.account_lifetime_exempt(a.is_admin,a.role,a.email)
  and not exists (
    select 1 from public.subscriptions s where s.user_id=a.id and s.provider='stripe'
      and s.status in ('paid','active','trialing')
      and (s.stripe_checkout_session_id is not null or s.stripe_subscription_id is not null)
  );

-- Kill the old deletion entry points as well as the application worker.
create or replace function public.claim_expired_accounts(batch_limit integer default 10)
returns setof public.client_access_codes language sql security definer set search_path = public as $$
  select * from public.client_access_codes where false;
$$;
create or replace function public.finalize_expired_account(target_account_id bigint, deletion_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin raise exception 'Automatic expiry deletion is disabled'; end $$;

-- Account row locking and Stripe's stable idempotency key prevent two parallel
-- requests from charging twice. No manual renewal is enabled in this version.
create function public.reserve_annual_checkout(target_account_id bigint, target_auth_user_id uuid, target_price_id text, target_live_mode boolean)
returns public.annual_payments language plpgsql security definer set search_path = public as $$
declare a public.client_access_codes%rowtype; p public.annual_payments%rowtype;
begin
  select * into a from public.client_access_codes where id = target_account_id for update;
  if not found or not a.is_active or a.auth_user_id is distinct from target_auth_user_id
    or not a.annual_access_required or a.is_admin or a.role = 'admin' then raise exception 'Account not eligible'; end if;
  select * into p from public.annual_payments where account_id = a.id for update;
  if found then
    if p.live_mode is distinct from target_live_mode then raise exception 'Payment environment mismatch'; end if;
    if p.paid_at is not null or p.status in ('processing','refunded','disputed','paid') then raise exception 'Purchase already paid or processing'; end if;
    if p.status in ('failed','expired') then
      update public.annual_payments set status='pending', session_id=null,
        checkout_attempt=checkout_attempt+1, checkout_expires_at=now()+interval '31 minutes',
        price_id=target_price_id, updated_at=now() where id=p.id returning * into p;
    elsif p.session_id is null and p.checkout_expires_at <= now() then
      -- Ambiguous network/DB failure: reconcile in Stripe, never risk a new payment.
      raise exception 'Checkout requires reconciliation';
    end if;
  else
    insert into public.annual_payments(account_id,auth_user_id,price_id,live_mode)
      values(a.id,target_auth_user_id,target_price_id,target_live_mode) returning * into p;
  end if;
  return p;
end $$;

create function public.apply_annual_payment(target_session_id text, target_payment_intent_id text,
  target_customer_id text, target_event_id text, target_paid_at timestamptz, target_live_mode boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p public.annual_payments%rowtype;
begin
  select * into p from public.annual_payments where session_id=target_session_id for update;
  if not found or p.live_mode is distinct from target_live_mode then raise exception 'Unknown checkout'; end if;
  if target_payment_intent_id is null or target_paid_at is null or target_paid_at > now()+interval '5 minutes' then raise exception 'Invalid payment'; end if;
  if p.paid_at is not null then
    if p.payment_intent_id is distinct from target_payment_intent_id then raise exception 'Payment mismatch'; end if;
    return;
  end if;
  update public.annual_payments set payment_intent_id=target_payment_intent_id, customer_id=target_customer_id,
    paid_at=target_paid_at, expires_at=target_paid_at+interval '31536000 seconds', payment_event_id=target_event_id,
    status=case when status in ('refunded','disputed') then status else 'paid' end, updated_at=now()
    where id=p.id;
  update public.client_access_codes set access_started_at=target_paid_at,
    access_expires_at=target_paid_at+interval '31536000 seconds' where id=p.account_id and annual_access_required;
end $$;

revoke all on function public.reserve_annual_checkout(bigint,uuid,text,boolean) from public,anon,authenticated;
revoke all on function public.apply_annual_payment(text,text,text,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.reserve_annual_checkout(bigint,uuid,text,boolean) to service_role;
grant execute on function public.apply_annual_payment(text,text,text,text,timestamptz,boolean) to service_role;

-- Add restrictive policies alongside existing ownership/publication policies.
-- This also blocks direct Supabase requests with the public anon key or a JWT
-- from an unpaid/expired learner. service_role keeps its existing bypass.
create function public.has_current_paid_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.client_access_codes a where a.auth_user_id=auth.uid() and a.is_active
      and (
        a.is_admin or a.role='admin'
        or (
          a.access_deletion_started_at is null
          and (a.access_expires_at is null or a.access_expires_at > now())
          and case when a.annual_access_required then exists (
            select 1 from public.annual_payments p where p.account_id=a.id and p.auth_user_id=auth.uid()
              and p.status='paid' and p.paid_at <= now() and p.expires_at > now()
          ) else (
            public.account_lifetime_exempt(a.is_admin,a.role,a.email) or a.complimentary_access
            or exists (select 1 from public.subscriptions s where s.user_id=a.id and s.access_granted
              and s.status in ('paid','active','trialing')
              and (a.access_expires_at is not null or s.plan is distinct from 'brand-studio-289-12m-v1' or s.current_period_end > now()))
          ) end
        )
      )
  );
$$;
revoke all on function public.has_current_paid_access() from public;
grant execute on function public.has_current_paid_access() to anon,authenticated,service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array['brand_projects','brand_modules','brand_submodules','module_exercises',
    'project_exercise_answers','project_module_states','brand_exports','communication_actions',
    'editorial_modules','module_versions','submodule_versions','exercise_versions','question_versions',
    'user_answers','user_module_progress','content_release_snapshots','tyash_questionnaire_prefills'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security',table_name);
      execute format('create policy paid_access_required on public.%I as restrictive for all to anon,authenticated using (public.has_current_paid_access()) with check (public.has_current_paid_access())',table_name);
    end if;
  end loop;
end $$;

commit;
