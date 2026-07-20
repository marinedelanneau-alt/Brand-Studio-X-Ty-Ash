begin;

create extension if not exists pgcrypto;

alter table public.client_access_codes
  add column if not exists role text not null default 'user';

alter table public.client_access_codes drop constraint if exists client_access_codes_role_check;
alter table public.client_access_codes
  add constraint client_access_codes_role_check check (role in ('user', 'admin'));

update public.client_access_codes
set role = 'admin', is_admin = true
where lower(email) = 'marine.delanneau@gmail.com';

create table if not exists public.editorial_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  legacy_module_id bigint unique references public.brand_modules(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_versions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.editorial_modules(id) on delete restrict,
  version_number integer not null,
  status text not null check (status in ('draft', 'scheduled', 'published', 'archived')),
  title text not null,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  publication_timezone text not null default 'Europe/Paris',
  publication_notes text,
  based_on_version_id uuid references public.module_versions(id) on delete set null,
  unique (module_id, version_number)
);

create unique index if not exists module_versions_one_published_idx
  on public.module_versions(module_id) where status = 'published';
create unique index if not exists module_versions_one_draft_per_admin_idx
  on public.module_versions(module_id, created_by) where status = 'draft';
create index if not exists module_versions_scheduled_idx
  on public.module_versions(scheduled_publish_at) where status = 'scheduled';

create table if not exists public.submodule_versions (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  submodule_key text not null,
  title text not null,
  description text,
  sort_order integer not null,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_version_id, submodule_key)
);

create table if not exists public.exercise_versions (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  submodule_key text not null,
  exercise_key text not null,
  exercise_type text not null,
  title text,
  description text,
  sort_order integer not null,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_version_id, exercise_key)
);

create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  exercise_key text not null,
  question_key text not null,
  field_key text not null default 'answer',
  label text not null,
  helper_text text,
  question_type text not null,
  configuration jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_version_id, question_key, field_key)
);

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.client_access_codes(id) on delete restrict,
  project_id bigint not null references public.brand_projects(id) on delete restrict,
  module_key text not null,
  submodule_key text not null,
  exercise_key text not null,
  question_key text not null,
  field_key text not null default 'answer',
  answer_value jsonb not null default 'null'::jsonb,
  source_version_id uuid references public.module_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id, question_key, field_key)
);

create index if not exists user_answers_project_module_idx
  on public.user_answers(project_id, module_key);

create table if not exists public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.client_access_codes(id) on delete restrict,
  project_id bigint not null references public.brand_projects(id) on delete restrict,
  module_key text not null,
  started_version_id uuid references public.module_versions(id) on delete set null,
  latest_viewed_version_id uuid references public.module_versions(id) on delete set null,
  completed_version_id uuid references public.module_versions(id) on delete set null,
  last_question_key text,
  completion_percentage numeric(5,2) not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, project_id, module_key)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  module_key text,
  version_id uuid references public.module_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_current_user_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.client_access_codes
    where auth_user_id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

alter table public.editorial_modules enable row level security;
alter table public.module_versions enable row level security;
alter table public.submodule_versions enable row level security;
alter table public.exercise_versions enable row level security;
alter table public.question_versions enable row level security;
alter table public.user_answers enable row level security;
alter table public.user_module_progress enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy editorial_modules_published_read on public.editorial_modules for select
  using (public.is_current_user_admin() or exists (
    select 1 from public.module_versions v where v.module_id = id and v.status = 'published'
  ));
create policy editorial_modules_admin_all on public.editorial_modules for all
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy module_versions_visible_read on public.module_versions for select
  using (status = 'published' or public.is_current_user_admin());
create policy module_versions_admin_all on public.module_versions for all
  using (public.is_current_user_admin()) with check (public.is_current_user_admin());

create policy submodule_versions_visible_read on public.submodule_versions for select using (
  public.is_current_user_admin() or exists (
    select 1 from public.module_versions v where v.id = module_version_id and v.status = 'published'
  )
);
create policy exercise_versions_visible_read on public.exercise_versions for select using (
  public.is_current_user_admin() or exists (
    select 1 from public.module_versions v where v.id = module_version_id and v.status = 'published'
  )
);
create policy question_versions_visible_read on public.question_versions for select using (
  public.is_current_user_admin() or exists (
    select 1 from public.module_versions v where v.id = module_version_id and v.status = 'published'
  )
);
create policy submodule_versions_admin_all on public.submodule_versions for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy exercise_versions_admin_all on public.exercise_versions for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy question_versions_admin_all on public.question_versions for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

create policy user_answers_own on public.user_answers for all using (
  exists (select 1 from public.client_access_codes a where a.id = user_id and a.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.client_access_codes a where a.id = user_id and a.auth_user_id = auth.uid())
  and exists (select 1 from public.brand_projects p where p.id = project_id and p.account_id = user_id)
);
create policy user_progress_own on public.user_module_progress for all using (
  exists (select 1 from public.client_access_codes a where a.id = user_id and a.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.client_access_codes a where a.id = user_id and a.auth_user_id = auth.uid())
  and exists (select 1 from public.brand_projects p where p.id = project_id and p.account_id = user_id)
);
create policy audit_admin_read on public.admin_audit_logs for select using (public.is_current_user_admin());
create policy audit_admin_insert on public.admin_audit_logs for insert with check (public.is_current_user_admin());

create or replace function public.publish_module_version(target_version_id uuid, audit_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public
as $$
declare
  target public.module_versions%rowtype;
begin
  if not public.is_current_user_admin() then
    raise exception 'admin role required';
  end if;
  select * into target from public.module_versions where id = target_version_id for update;
  if target.id is null or target.status not in ('draft', 'scheduled') then
    raise exception 'version cannot be published';
  end if;
  update public.module_versions set status = 'archived', updated_at = now()
    where module_id = target.module_id and status = 'published';
  update public.module_versions set status = 'published', published_at = now(),
    scheduled_publish_at = null, updated_at = now() where id = target.id;
  insert into public.admin_audit_logs(admin_user_id, action_type, entity_type, entity_id, module_key, version_id, metadata)
  select auth.uid(), 'version_published', 'module_version', target.id::text, em.module_key, target.id, audit_metadata
  from public.editorial_modules em where em.id = target.module_id;
end;
$$;

create or replace function public.publish_due_module_versions()
returns integer language plpgsql security definer set search_path = public
as $$
declare
  target record;
  published_count integer := 0;
begin
  for target in
    select * from public.module_versions
    where status = 'scheduled' and scheduled_publish_at <= now()
    order by scheduled_publish_at for update skip locked
  loop
    update public.module_versions set status = 'archived', updated_at = now()
      where module_id = target.module_id and status = 'published';
    update public.module_versions set status = 'published', published_at = now(),
      scheduled_publish_at = null, updated_at = now() where id = target.id and status = 'scheduled';
    if found then
      insert into public.admin_audit_logs(action_type, entity_type, entity_id, version_id, metadata)
      values ('version_published', 'module_version', target.id::text, target.id, '{"source":"scheduler"}'::jsonb);
      published_count := published_count + 1;
    end if;
  end loop;
  return published_count;
end;
$$;

revoke all on function public.publish_due_module_versions() from public, anon, authenticated;
grant execute on function public.publish_due_module_versions() to service_role;

create or replace function public.create_module_draft(source_version_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare source public.module_versions%rowtype; next_id uuid; next_number integer;
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  select * into source from public.module_versions where id = source_version_id;
  if source.id is null then raise exception 'source version not found'; end if;
  if exists (select 1 from public.module_versions where module_id = source.module_id and status = 'draft' and created_by = auth.uid()) then
    raise exception 'a draft already exists';
  end if;
  select coalesce(max(version_number), 0) + 1 into next_number from public.module_versions where module_id = source.module_id;
  insert into public.module_versions(module_id, version_number, status, title, configuration, created_by, based_on_version_id)
  values(source.module_id, next_number, 'draft', source.title, source.configuration, auth.uid(), source.id) returning id into next_id;
  insert into public.submodule_versions(module_version_id, submodule_key, title, description, sort_order, configuration)
    select next_id, submodule_key, title, description, sort_order, configuration from public.submodule_versions where module_version_id = source.id;
  insert into public.exercise_versions(module_version_id, submodule_key, exercise_key, exercise_type, title, description, sort_order, configuration)
    select next_id, submodule_key, exercise_key, exercise_type, title, description, sort_order, configuration from public.exercise_versions where module_version_id = source.id;
  insert into public.question_versions(module_version_id, exercise_key, question_key, field_key, label, helper_text, question_type, configuration, sort_order, is_required)
    select next_id, exercise_key, question_key, field_key, label, helper_text, question_type, configuration, sort_order, is_required from public.question_versions where module_version_id = source.id;
  insert into public.admin_audit_logs(admin_user_id, action_type, entity_type, entity_id, version_id, metadata)
    values(auth.uid(), case when source.status = 'archived' then 'version_restored' else 'draft_created' end,
      'module_version', next_id::text, next_id, jsonb_build_object('source_version_id', source.id));
  return next_id;
end;
$$;

create or replace function public.schedule_module_version(target_version_id uuid, publish_at timestamptz, timezone_name text, notes text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  if publish_at <= now() then raise exception 'scheduled date must be in the future'; end if;
  update public.module_versions set status = 'scheduled', scheduled_publish_at = publish_at,
    publication_timezone = coalesce(nullif(timezone_name, ''), 'Europe/Paris'), publication_notes = notes, updated_at = now()
    where id = target_version_id and status = 'draft';
  if not found then raise exception 'draft not found'; end if;
  insert into public.admin_audit_logs(admin_user_id, action_type, entity_type, entity_id, version_id, metadata)
    values(auth.uid(), 'publication_scheduled', 'module_version', target_version_id::text, target_version_id,
      jsonb_build_object('scheduled_publish_at', publish_at, 'timezone', timezone_name));
end;
$$;

create or replace function public.cancel_scheduled_version(target_version_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  update public.module_versions set status = 'draft', scheduled_publish_at = null, updated_at = now()
    where id = target_version_id and status = 'scheduled';
  if not found then raise exception 'scheduled version not found'; end if;
  insert into public.admin_audit_logs(admin_user_id, action_type, entity_type, entity_id, version_id)
    values(auth.uid(), 'publication_cancelled', 'module_version', target_version_id::text, target_version_id);
end;
$$;

-- Non-destructive bootstrap: current content becomes version 1, with keys based on
-- permanent legacy IDs (never on mutable titles or positions).
insert into public.editorial_modules(module_key, legacy_module_id)
select 'module_' || m.id, m.id from public.brand_modules m
on conflict (module_key) do nothing;

insert into public.module_versions(module_id, version_number, status, title, published_at, configuration)
select em.id, 1, 'published', bm.title, coalesce(bm.updated_at, now()),
  jsonb_build_object('legacy_module_id', bm.id, 'position', bm.position,
    'video_url', bm.video_url, 'audio_url', bm.audio_url,
    'audio_transcript', bm.audio_transcript, 'content_html', bm.content_html,
    'is_published', bm.is_published)
from public.editorial_modules em
join public.brand_modules bm on bm.id = em.legacy_module_id
where not exists (select 1 from public.module_versions mv where mv.module_id = em.id);

insert into public.submodule_versions(module_version_id, submodule_key, title, description, sort_order, configuration)
select mv.id, 'submodule_' || bs.id, bs.title, bs.content_html, bs.position,
  jsonb_build_object('legacy_submodule_id', bs.id, 'video_url', bs.video_url,
    'audio_url', bs.audio_url, 'audio_transcript', bs.audio_transcript)
from public.brand_submodules bs
join public.editorial_modules em on em.legacy_module_id = bs.module_id
join public.module_versions mv on mv.module_id = em.id and mv.status = 'published'
on conflict (module_version_id, submodule_key) do nothing;

insert into public.exercise_versions(module_version_id, submodule_key, exercise_key, exercise_type, title, description, sort_order, configuration)
select mv.id, coalesce('submodule_' || me.submodule_id, 'module_root'),
  'exercise_' || me.id, me.type, me.question, me.explanation, me.position,
  jsonb_build_object('legacy_exercise_id', me.id, 'options', me.options,
    'answer_placeholder', me.answer_placeholder, 'audio_url', me.audio_url,
    'audio_transcript', me.audio_transcript)
from public.module_exercises me
join public.editorial_modules em on em.legacy_module_id = me.module_id
join public.module_versions mv on mv.module_id = em.id and mv.status = 'published'
on conflict (module_version_id, exercise_key) do nothing;

insert into public.question_versions(module_version_id, exercise_key, question_key, field_key, label, helper_text, question_type, sort_order, configuration)
select mv.id, 'exercise_' || me.id, 'question_' || me.id, 'answer', me.question,
  me.explanation, me.type, me.position,
  jsonb_build_object('legacy_exercise_id', me.id, 'options', me.options,
    'answer_placeholder', me.answer_placeholder)
from public.module_exercises me
join public.editorial_modules em on em.legacy_module_id = me.module_id
join public.module_versions mv on mv.module_id = em.id and mv.status = 'published'
on conflict (module_version_id, question_key, field_key) do nothing;

insert into public.user_answers(user_id, project_id, module_key, submodule_key, exercise_key, question_key, field_key, answer_value, source_version_id, created_at, updated_at)
select bp.account_id, pea.project_id, em.module_key,
  coalesce('submodule_' || me.submodule_id, 'module_root'), 'exercise_' || pea.exercise_id,
  'question_' || pea.exercise_id, 'answer',
  case when pea.answer_text is not null then to_jsonb(pea.answer_text) else pea.selected_options end,
  mv.id, pea.created_at, pea.updated_at
from public.project_exercise_answers pea
join public.brand_projects bp on bp.id = pea.project_id
join public.module_exercises me on me.id = pea.exercise_id
join public.editorial_modules em on em.legacy_module_id = pea.module_id
join public.module_versions mv on mv.module_id = em.id and mv.status = 'published'
on conflict (user_id, project_id, question_key, field_key)
do update set answer_value = excluded.answer_value, updated_at = greatest(public.user_answers.updated_at, excluded.updated_at);

commit;
