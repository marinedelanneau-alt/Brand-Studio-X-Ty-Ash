-- Additive scheduling for controlled content releases.
-- This never updates legacy content or user answers.

create table if not exists public.content_release_schedules (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.content_releases(id) on delete restrict,
  scheduled_by bigint not null references public.client_access_codes(id) on delete restrict,
  scheduled_at timestamptz not null,
  timezone text not null default 'Europe/Paris',
  notes text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'processing', 'published', 'cancelled', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index if not exists content_release_one_active_schedule_idx
  on public.content_release_schedules(release_id)
  where status in ('scheduled', 'processing');

create index if not exists content_release_due_schedule_idx
  on public.content_release_schedules(scheduled_at)
  where status = 'scheduled';

alter table public.content_release_schedules enable row level security;

create policy content_release_schedules_admin_all
  on public.content_release_schedules
  for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.schedule_content_release(
  target_release_id uuid,
  deployment_at timestamptz,
  deployment_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  account_id bigint;
  schedule_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;
  if deployment_at <= now() then
    raise exception 'scheduled date must be in the future';
  end if;
  if nullif(btrim(deployment_notes), '') is null then
    raise exception 'deployment notes are required';
  end if;
  if not exists (
    select 1 from public.content_releases
    where id = target_release_id and status = 'ready'
  ) then
    raise exception 'only a ready release can be scheduled';
  end if;

  select id into account_id
  from public.client_access_codes
  where auth_user_id = auth.uid() and (role = 'admin' or is_admin = true)
  limit 1;

  insert into public.content_release_schedules (
    release_id, scheduled_by, scheduled_at, notes
  )
  values (target_release_id, account_id, deployment_at, btrim(deployment_notes))
  returning id into schedule_id;

  return schedule_id;
end;
$$;

create or replace function public.cancel_content_release_schedule(
  target_schedule_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  update public.content_release_schedules
  set status = 'cancelled', updated_at = now()
  where id = target_schedule_id and status = 'scheduled';

  if not found then
    raise exception 'active schedule not found';
  end if;
end;
$$;

create or replace function public.publish_scheduled_content_release(
  target_schedule_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  schedule_record public.content_release_schedules%rowtype;
  target public.content_releases%rowtype;
begin
  select * into schedule_record
  from public.content_release_schedules
  where id = target_schedule_id
  for update;

  if schedule_record.status <> 'processing'
     or schedule_record.scheduled_at > now() then
    raise exception 'schedule is not ready for publication';
  end if;

  select * into target
  from public.content_releases
  where id = schedule_record.release_id
  for update;

  if target.status <> 'ready' then
    raise exception 'release is no longer ready';
  end if;

  update public.content_releases
  set status = 'archived', updated_at = now()
  where status = 'published';

  update public.content_releases
  set status = 'published',
      notes = schedule_record.notes,
      published_at = now(),
      updated_at = now()
  where id = target.id;

  update public.application_release_state
  set published_release_id = target.id,
      current_draft_release_id = null,
      updated_at = now()
  where id = 1;

  update public.content_release_schedules
  set status = 'published',
      published_at = now(),
      updated_at = now(),
      error_message = null
  where id = target_schedule_id;

  insert into public.admin_audit_logs (
    admin_user_id, action_type, entity_type, entity_id, release_id, metadata
  )
  select
    account.auth_user_id,
    'publish_scheduled_release',
    'content_release',
    target.id::text,
    target.id,
    jsonb_build_object('schedule_id', target_schedule_id)
  from public.client_access_codes account
  where account.id = schedule_record.scheduled_by;

  return target.id;
end;
$$;

revoke all on function public.publish_scheduled_content_release(uuid)
  from public, anon, authenticated;
grant execute on function public.publish_scheduled_content_release(uuid)
  to service_role;
