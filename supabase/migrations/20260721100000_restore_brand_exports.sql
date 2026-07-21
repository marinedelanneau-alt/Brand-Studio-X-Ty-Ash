create table if not exists public.brand_exports (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.brand_projects(id) on delete cascade,
  export_type text not null default 'brand_guide',
  file_url text,
  generated_at timestamptz not null default now(),
  guide_snapshot jsonb not null default '{}'::jsonb
);
create index if not exists brand_exports_project_type_generated_idx
  on public.brand_exports(project_id, export_type, generated_at desc);
alter table public.brand_exports enable row level security;

drop policy if exists brand_exports_own_read on public.brand_exports;
create policy brand_exports_own_read on public.brand_exports for select using (
  exists (
    select 1 from public.brand_projects p
    join public.client_access_codes a on a.id = p.account_id
    where p.id = project_id and a.auth_user_id = auth.uid()
  ) or public.is_current_user_admin()
);
