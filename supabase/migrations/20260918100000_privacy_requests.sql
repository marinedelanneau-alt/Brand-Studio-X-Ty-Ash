begin;
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  account_id bigint not null,
  request_type text not null check (request_type in ('access','rectification','erasure','opposition','restriction','portability','withdrawal')),
  message text not null default '' check (length(message) <= 4000),
  status text not null default 'received' check (status in ('received','processing','completed')),
  created_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '1 month'),
  completed_at timestamptz
);
create index if not exists privacy_requests_account_idx on public.privacy_requests(account_id, created_at);
alter table public.privacy_requests enable row level security;
revoke all on public.privacy_requests from anon, authenticated;
grant all on public.privacy_requests to service_role;
-- Only authenticated server actions perform scoped writes. No public insert API.
commit;
