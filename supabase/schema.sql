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

-- Le modèle éditorial versionné et sa migration additive sont définis dans
-- supabase/migrations/20260720190000_editorial_versioning.sql.

alter table public.client_access_codes
  add column if not exists auth_user_id uuid unique;

alter table public.client_access_codes
  add column if not exists email text;

alter table public.client_access_codes
  alter column code drop not null;

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
  audio_url text,
  audio_transcript text,
  content_html text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_modules
  add column if not exists audio_url text;

alter table public.brand_modules
  add column if not exists audio_transcript text;

create table if not exists public.brand_submodules (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  title text not null,
  position integer not null,
  video_url text not null,
  audio_url text,
  audio_transcript text,
  content_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

alter table public.brand_submodules
  add column if not exists audio_url text;

alter table public.brand_submodules
  add column if not exists audio_transcript text;

create table if not exists public.module_exercises (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.brand_modules(id) on delete cascade,
  submodule_id bigint references public.brand_submodules(id) on delete cascade,
  position integer not null,
  type text not null check (type in ('open', 'single', 'multiple', 'boolean', 'color', 'fill_blank')),
  explanation text not null default '',
  answer_placeholder text not null default '',
  audio_url text,
  audio_transcript text,
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
  add column if not exists audio_url text;

alter table public.module_exercises
  add column if not exists audio_transcript text;

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

create table if not exists public.purchase_activation_codes (
  id bigint generated always as identity primary key,
  code text not null unique,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  price_id text,
  status text not null default 'paid',
  consumed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_activation_codes
  add column if not exists code text;

alter table public.purchase_activation_codes
  add column if not exists email text;

alter table public.purchase_activation_codes
  add column if not exists stripe_customer_id text;

alter table public.purchase_activation_codes
  add column if not exists stripe_subscription_id text;

alter table public.purchase_activation_codes
  add column if not exists stripe_checkout_session_id text;

alter table public.purchase_activation_codes
  add column if not exists price_id text;

alter table public.purchase_activation_codes
  add column if not exists status text not null default 'paid';

alter table public.purchase_activation_codes
  add column if not exists consumed_at timestamptz;

alter table public.purchase_activation_codes
  add column if not exists expires_at timestamptz;

alter table public.purchase_activation_codes
  add column if not exists created_at timestamptz not null default now();

alter table public.purchase_activation_codes
  add column if not exists updated_at timestamptz not null default now();

create index if not exists purchase_activation_codes_email_idx
  on public.purchase_activation_codes (email);

create index if not exists purchase_activation_codes_checkout_session_idx
  on public.purchase_activation_codes (stripe_checkout_session_id);

create table if not exists public.communication_actions (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.client_access_codes(id) on delete cascade,
  project_id bigint not null references public.brand_projects(id) on delete cascade,
  source_idea_id uuid,
  title text not null,
  description text,
  objective text,
  secondary_objective text,
  target_audience jsonb not null default '[]'::jsonb,
  action_type text,
  start_date date,
  target_month text,
  target_quarter text,
  recurrence text,
  impact_level text,
  effort_level text,
  calculated_priority text,
  estimated_budget numeric,
  required_resources jsonb not null default '[]'::jsonb,
  external_help_needed text,
  first_step text,
  status text not null default 'Idée',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communication_actions
  add column if not exists user_id bigint references public.client_access_codes(id) on delete cascade;

alter table public.communication_actions
  add column if not exists project_id bigint references public.brand_projects(id) on delete cascade;

alter table public.communication_actions
  add column if not exists source_idea_id uuid;

alter table public.communication_actions
  add column if not exists title text;

alter table public.communication_actions
  add column if not exists description text;

alter table public.communication_actions
  add column if not exists objective text;

alter table public.communication_actions
  add column if not exists secondary_objective text;

alter table public.communication_actions
  add column if not exists target_audience jsonb not null default '[]'::jsonb;

alter table public.communication_actions
  add column if not exists action_type text;

alter table public.communication_actions
  add column if not exists start_date date;

alter table public.communication_actions
  add column if not exists target_month text;

alter table public.communication_actions
  add column if not exists target_quarter text;

alter table public.communication_actions
  add column if not exists recurrence text;

alter table public.communication_actions
  add column if not exists impact_level text;

alter table public.communication_actions
  add column if not exists effort_level text;

alter table public.communication_actions
  add column if not exists calculated_priority text;

alter table public.communication_actions
  add column if not exists estimated_budget numeric;

alter table public.communication_actions
  add column if not exists required_resources jsonb not null default '[]'::jsonb;

alter table public.communication_actions
  add column if not exists external_help_needed text;

alter table public.communication_actions
  add column if not exists first_step text;

alter table public.communication_actions
  add column if not exists status text not null default 'Idée';

alter table public.communication_actions
  add column if not exists sort_order integer not null default 0;

alter table public.communication_actions
  add column if not exists created_at timestamptz not null default now();

alter table public.communication_actions
  add column if not exists updated_at timestamptz not null default now();

create index if not exists communication_actions_project_idx
  on public.communication_actions (project_id, sort_order, created_at desc);

create index if not exists communication_actions_user_idx
  on public.communication_actions (user_id);

create index if not exists communication_actions_status_idx
  on public.communication_actions (project_id, status);

create index if not exists communication_actions_start_date_idx
  on public.communication_actions (project_id, start_date);

alter table public.client_access_codes enable row level security;
alter table public.brand_projects enable row level security;
alter table public.brand_modules enable row level security;
alter table public.brand_submodules enable row level security;
alter table public.module_exercises enable row level security;
alter table public.project_exercise_answers enable row level security;
alter table public.project_module_states enable row level security;
alter table public.brand_exports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.purchase_activation_codes enable row level security;
alter table public.communication_actions enable row level security;

drop policy if exists communication_actions_select_own on public.communication_actions;
create policy communication_actions_select_own
  on public.communication_actions
  for select
  using (
    exists (
      select 1
      from public.client_access_codes account
      where account.id = communication_actions.user_id
        and account.auth_user_id = auth.uid()
    )
  );

drop policy if exists communication_actions_insert_own on public.communication_actions;
create policy communication_actions_insert_own
  on public.communication_actions
  for insert
  with check (
    exists (
      select 1
      from public.client_access_codes account
      where account.id = communication_actions.user_id
        and account.auth_user_id = auth.uid()
    )
  );

drop policy if exists communication_actions_update_own on public.communication_actions;
create policy communication_actions_update_own
  on public.communication_actions
  for update
  using (
    exists (
      select 1
      from public.client_access_codes account
      where account.id = communication_actions.user_id
        and account.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.client_access_codes account
      where account.id = communication_actions.user_id
        and account.auth_user_id = auth.uid()
    )
  );

drop policy if exists communication_actions_delete_own on public.communication_actions;
create policy communication_actions_delete_own
  on public.communication_actions
  for delete
  using (
    exists (
      select 1
      from public.client_access_codes account
      where account.id = communication_actions.user_id
        and account.auth_user_id = auth.uid()
    )
  );
