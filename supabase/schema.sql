create table if not exists public.client_access_codes (
  id bigint generated always as identity primary key,
  code text not null unique,
  email text not null unique,
  client_name text,
  company_name text,
  is_active boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.client_access_codes
  add column if not exists email text;

alter table public.client_access_codes
  add column if not exists client_name text;

alter table public.client_access_codes
  add column if not exists company_name text;

alter table public.client_access_codes
  add column if not exists is_active boolean not null default true;

alter table public.client_access_codes
  add column if not exists is_admin boolean not null default false;

alter table public.client_access_codes
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.brand_projects (
  id bigint generated always as identity primary key,
  account_id bigint not null unique references public.client_access_codes(id) on delete cascade,
  name text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_projects
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

create table if not exists public.brand_modules (
  id bigint generated always as identity primary key,
  title text not null,
  position integer not null unique,
  video_url text not null,
  content_html text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_submodules (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  title text not null,
  position integer not null,
  video_url text not null,
  content_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table if not exists public.module_exercises (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  submodule_id bigint references public.brand_submodules(id) on delete cascade,
  position integer not null,
  type text not null check (type in ('open', 'single', 'multiple', 'boolean', 'color', 'fill_blank')),
  explanation text not null default '',
  answer_placeholder text not null default '',
  question text not null,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique nulls not distinct (submodule_id, position)
);

alter table public.module_exercises
  add column if not exists explanation text not null default '';

alter table public.module_exercises
  add column if not exists answer_placeholder text not null default '';

alter table public.module_exercises
  add column if not exists submodule_id bigint references public.brand_submodules(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'module_exercises'
      and constraint_name = 'module_exercises_type_check'
  ) then
    alter table public.module_exercises
      drop constraint module_exercises_type_check;
  end if;
end $$;

alter table public.module_exercises
  add constraint module_exercises_type_check
  check (type in ('open', 'single', 'multiple', 'boolean', 'color', 'fill_blank'));

create table if not exists public.project_exercise_answers (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.brand_projects(id) on delete cascade,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  exercise_id bigint not null references public.module_exercises(id) on delete cascade,
  answer_text text,
  selected_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, exercise_id)
);

create table if not exists public.project_module_states (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.brand_projects(id) on delete cascade,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, module_id)
);

create table if not exists public.brand_exports (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.brand_projects(id) on delete cascade,
  export_type text not null default 'brand_guide',
  file_url text,
  generated_at timestamptz not null default now(),
  guide_snapshot jsonb not null default '{}'::jsonb
);

create index if not exists brand_exports_project_type_generated_idx
  on public.brand_exports (project_id, export_type, generated_at desc);

create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.client_access_codes(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  price_id text,
  plan text not null default 'brand_studio',
  status text not null default 'pending',
  access_granted boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists user_id bigint references public.client_access_codes(id) on delete cascade;

alter table public.subscriptions
  add column if not exists stripe_customer_id text;

alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

alter table public.subscriptions
  add column if not exists stripe_checkout_session_id text;

alter table public.subscriptions
  add column if not exists price_id text;

alter table public.subscriptions
  add column if not exists plan text not null default 'brand_studio';

alter table public.subscriptions
  add column if not exists status text not null default 'pending';

alter table public.subscriptions
  add column if not exists access_granted boolean not null default false;

alter table public.subscriptions
  add column if not exists current_period_end timestamptz;

alter table public.subscriptions
  add column if not exists created_at timestamptz not null default now();

alter table public.subscriptions
  add column if not exists updated_at timestamptz not null default now();

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

alter table public.client_access_codes enable row level security;
alter table public.brand_projects enable row level security;
alter table public.brand_modules enable row level security;
alter table public.brand_submodules enable row level security;
alter table public.module_exercises enable row level security;
alter table public.project_exercise_answers enable row level security;
alter table public.project_module_states enable row level security;
alter table public.brand_exports enable row level security;
alter table public.subscriptions enable row level security;
