alter table public.user_answers
  add column if not exists client_updated_at timestamptz not null default now();

create index if not exists user_answers_client_updated_idx
  on public.user_answers(project_id, module_key, client_updated_at desc);

create or replace function public.upsert_user_answers_if_newer(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_answers (
    user_id,
    project_id,
    module_key,
    submodule_key,
    exercise_key,
    question_key,
    field_key,
    answer_value,
    source_version_id,
    client_updated_at,
    updated_at
  )
  select
    (row->>'user_id')::bigint,
    (row->>'project_id')::bigint,
    row->>'module_key',
    row->>'submodule_key',
    row->>'exercise_key',
    row->>'question_key',
    coalesce(row->>'field_key', 'answer'),
    coalesce(row->'answer_value', 'null'::jsonb),
    nullif(row->>'source_version_id', '')::uuid,
    (row->>'client_updated_at')::timestamptz,
    now()
  from jsonb_array_elements(p_rows) as row
  on conflict (user_id, project_id, question_key, field_key)
  do update set
    answer_value = excluded.answer_value,
    module_key = excluded.module_key,
    submodule_key = excluded.submodule_key,
    exercise_key = excluded.exercise_key,
    source_version_id = excluded.source_version_id,
    client_updated_at = excluded.client_updated_at,
    updated_at = now()
  where public.user_answers.client_updated_at <= excluded.client_updated_at;
end;
$$;

revoke all on function public.upsert_user_answers_if_newer(jsonb) from public;
grant execute on function public.upsert_user_answers_if_newer(jsonb) to service_role;
