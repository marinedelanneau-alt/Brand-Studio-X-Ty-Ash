-- Additive, opt-in preparation. No UPDATE/DELETE on existing accounts or subscriptions.
begin;
alter table public.purchase_activation_codes add column if not exists offer_version text;
create unique index if not exists activation_v1_unique_session on public.purchase_activation_codes(stripe_checkout_session_id)
  where offer_version = 'brand-studio-289-12m-v1';
create table if not exists public.commercial_orders_v1 (
  session_id text primary key,
  account_id bigint,
  email text not null,
  offer_version text not null,
  amount integer not null check (amount = 28900),
  currency text not null check (currency = 'eur'),
  live_mode boolean not null,
  consent jsonb not null,
  legal_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz,
  payment_event_id text unique,
  payment_intent_id text,
  check ((paid_at is null and expires_at is null) or (paid_at is not null and expires_at > paid_at))
);
alter table public.commercial_orders_v1 enable row level security;
revoke all on public.commercial_orders_v1 from anon, authenticated;
grant all on public.commercial_orders_v1 to service_role;
create index if not exists commercial_orders_v1_account on public.commercial_orders_v1(account_id);
create table if not exists public.commercial_withdrawals_v1 (
  session_id text primary key references public.commercial_orders_v1(session_id),
  customer_name text not null,
  receipt_email text not null,
  declaration text not null,
  received_at timestamptz not null default now(),
  receipt_sent_at timestamptz,
  status text not null default 'received' check (status in ('received','processing','completed'))
);
alter table public.commercial_withdrawals_v1 enable row level security;
revoke all on public.commercial_withdrawals_v1 from anon, authenticated;
grant all on public.commercial_withdrawals_v1 to service_role;
commit;
