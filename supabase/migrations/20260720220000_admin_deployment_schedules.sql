create table if not exists public.admin_deployment_schedules (
  id uuid primary key default gen_random_uuid(),
  account_id bigint not null references public.client_access_codes(id) on delete restrict,
  scheduled_at timestamptz not null,
  timezone text not null default 'Europe/Paris',
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled','processing','published','cancelled','failed')),
  draft_snapshot jsonb not null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create unique index if not exists admin_deployment_one_active_idx
  on public.admin_deployment_schedules(account_id) where status in ('scheduled','processing');
create index if not exists admin_deployment_due_idx
  on public.admin_deployment_schedules(scheduled_at) where status = 'scheduled';
alter table public.admin_deployment_schedules enable row level security;
create policy admin_deployment_admin_all on public.admin_deployment_schedules for all
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());
