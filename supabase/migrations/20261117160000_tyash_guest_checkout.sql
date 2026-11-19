begin;

-- Extend the existing annual ledger; never replace historical orders/accounts.
alter table public.annual_payments alter column account_id drop not null;
alter table public.annual_payments alter column auth_user_id drop not null;
alter table public.annual_payments add column purchase_email text;
alter table public.annual_payments add column owner_hash text;
alter table public.annual_payments add column terms_snapshot jsonb;
alter table public.annual_payments add column fulfillment_state text not null default 'pending'
  check (fulfillment_state in ('pending','ready','existing_access','expired_access','inactive_account'));
alter table public.annual_payments add column activation_required boolean not null default false;
alter table public.annual_payments add column email_message_id text;
alter table public.annual_payments add column email_payload text;
alter table public.annual_payments add column email_claim_until timestamptz;
alter table public.annual_payments add column email_sent_at timestamptz;
alter table public.annual_payments add column password_initialized_at timestamptz;
alter table public.annual_payments add constraint guest_purchase_identity check
  (purchase_email is null or (purchase_email=lower(btrim(purchase_email)) and owner_hash is not null and length(owner_hash)=64 and terms_snapshot is not null));
-- Different browsers must receive indistinguishable Checkout behavior. A global
-- email uniqueness error would publicly disclose an existing paid account.
create unique index annual_guest_email_owner_mode on public.annual_payments(purchase_email,owner_hash,live_mode) where purchase_email is not null;

create table public.annual_activation_grants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.annual_payments(id),
  auth_user_id uuid not null references auth.users(id),
  token_hash text not null unique,
  expires_at timestamptz not null default now()+interval '1 hour',
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.annual_activation_grants enable row level security;
revoke all on public.annual_activation_grants from public,anon,authenticated;
grant all on public.annual_activation_grants to service_role;

create function public.reserve_guest_annual_checkout(target_email text,target_owner_hash text,target_price_id text,target_live_mode boolean,target_terms jsonb)
returns public.annual_payments language plpgsql security definer set search_path=public as $$
declare p public.annual_payments%rowtype;
begin
  if target_email<>lower(btrim(target_email)) or target_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'
    or length(target_email)>254 or length(target_owner_hash)<>64 or target_terms is null then raise exception 'Invalid purchase'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_email,0));
  select * into p from public.annual_payments where purchase_email=target_email and owner_hash=target_owner_hash and live_mode=target_live_mode for update;
  if found then
    if p.owner_hash is distinct from target_owner_hash or p.paid_at is not null or p.status in ('processing','refunded','disputed','paid') then
      raise exception 'Purchase unavailable';
    end if;
    if p.status in ('failed','expired') then
      update public.annual_payments set status='pending',session_id=null,checkout_attempt=checkout_attempt+1,
        checkout_expires_at=now()+interval '31 minutes',price_id=target_price_id,terms_snapshot=target_terms,updated_at=now()
        where id=p.id returning * into p;
    elsif p.session_id is null and p.checkout_expires_at<=now() then raise exception 'Checkout requires reconciliation';
    end if;
  else
    insert into public.annual_payments(purchase_email,owner_hash,price_id,live_mode,terms_snapshot)
      values(target_email,target_owner_hash,target_price_id,target_live_mode,target_terms) returning * into p;
  end if;
  return p;
end $$;

-- Service-only lookup avoids paginating Auth identities or exposing existence.
create function public.annual_auth_identity(target_email text)
returns table(id uuid,has_password boolean) language sql security definer set search_path=public as $$
  select u.id,coalesce(u.encrypted_password,'')<>'' from auth.users u where lower(u.email)=lower(btrim(target_email));
$$;

-- Bind only a verified paid ledger to its recorded email's Auth identity.
-- Existing profiles, roles, answers and projects are preserved. Renewal remains disabled.
create function public.bind_guest_annual_payment(target_order_id uuid,target_auth_user_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare p public.annual_payments%rowtype; a public.client_access_codes%rowtype; existing_password boolean;
begin
  select * into p from public.annual_payments where id=target_order_id;
  if not found or p.purchase_email is null then raise exception 'Paid purchase required'; end if;
  -- Same lock order as checkout reservation: email first, then ledger row.
  perform pg_advisory_xact_lock(hashtextextended(p.purchase_email,0));
  select * into p from public.annual_payments where id=target_order_id for update;
  if not found or p.purchase_email is null or p.status<>'paid' or p.paid_at is null then raise exception 'Paid purchase required'; end if;
  if p.fulfillment_state<>'pending' then return p.fulfillment_state; end if;
  select coalesce(encrypted_password,'')<>'' into existing_password from auth.users where id=target_auth_user_id and lower(email)=p.purchase_email;
  if not found then raise exception 'Identity mismatch'; end if;
  if (select count(*) from public.client_access_codes where lower(email)=p.purchase_email)>1 then raise exception 'Ambiguous identity'; end if;
  select * into a from public.client_access_codes where lower(email)=p.purchase_email for update;
  if found then
    if a.auth_user_id is not null and a.auth_user_id<>target_auth_user_id then raise exception 'Profile identity mismatch'; end if;
    if not a.is_active then
      update public.annual_payments set fulfillment_state='inactive_account' where id=p.id; return 'inactive_account';
    end if;
    if public.account_lifetime_exempt(a.is_admin,a.role,a.email) or (a.complimentary_access and not a.annual_access_required)
      or exists(select 1 from public.subscriptions s where s.user_id=a.id and s.access_granted and s.status in ('paid','active','trialing'))
      or exists(select 1 from public.annual_payments other where other.account_id=a.id and other.id<>p.id and other.paid_at is not null) then
      update public.annual_payments set fulfillment_state='existing_access' where id=p.id; return 'existing_access';
    end if;
    if a.access_started_at is not null then
      update public.annual_payments set fulfillment_state='expired_access' where id=p.id; return 'expired_access';
    end if;
    -- An old unpaid reservation cannot coexist with a second account purchase.
    if exists(select 1 from public.annual_payments other where other.account_id=a.id and other.id<>p.id) then raise exception 'Existing purchase requires reconciliation'; end if;
    update public.client_access_codes set auth_user_id=target_auth_user_id,annual_access_required=true,
      access_started_at=p.paid_at,access_expires_at=p.expires_at where id=a.id;
  else
    insert into public.client_access_codes(email,auth_user_id,code,client_name,company_name,is_active,is_admin,role,annual_access_required,access_started_at,access_expires_at)
      values(p.purchase_email,target_auth_user_id,null,'','',true,false,'user',true,p.paid_at,p.expires_at) returning * into a;
  end if;
  update public.annual_payments set account_id=a.id,auth_user_id=target_auth_user_id,
    activation_required=not existing_password,fulfillment_state='ready',updated_at=now() where id=p.id;
  return 'ready';
end $$;

revoke all on function public.reserve_guest_annual_checkout(text,text,text,boolean,jsonb) from public,anon,authenticated;
revoke all on function public.annual_auth_identity(text) from public,anon,authenticated;
revoke all on function public.bind_guest_annual_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_guest_annual_checkout(text,text,text,boolean,jsonb) to service_role;
grant execute on function public.annual_auth_identity(text) to service_role;
grant execute on function public.bind_guest_annual_payment(uuid,uuid) to service_role;
commit;
