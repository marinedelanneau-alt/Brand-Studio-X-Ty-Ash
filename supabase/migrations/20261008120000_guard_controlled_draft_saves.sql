-- Additive only: no content, account, project, answer or progress data changes.
-- Serializes draft saves with publication and rejects concurrent stale writes.
create or replace function public.update_current_draft_snapshot_if_unchanged(
  target_release_id uuid,
  expected_updated_at timestamptz,
  snapshot_schema_version integer,
  snapshot_modules jsonb,
  snapshot_brand_guide_settings jsonb default '{}'::jsonb,
  snapshot_pdf_settings jsonb default '{}'::jsonb,
  snapshot_interface_settings jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_timestamp_value timestamptz;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin role required'; end if;
  perform 1 from public.application_release_state where id = 1 for update;
  select updated_at into current_timestamp_value
  from public.content_release_snapshots where release_id = target_release_id for update;
  if not found or current_timestamp_value is distinct from expected_updated_at then
    raise exception 'Le brouillon a changé. Recharge l''éditeur avant de réessayer.';
  end if;
  perform public.update_current_draft_snapshot(
    target_release_id, snapshot_schema_version, snapshot_modules,
    snapshot_brand_guide_settings, snapshot_pdf_settings, snapshot_interface_settings
  );
end;
$$;

revoke all on function public.update_current_draft_snapshot_if_unchanged(uuid, timestamptz, integer, jsonb, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public.update_current_draft_snapshot_if_unchanged(uuid, timestamptz, integer, jsonb, jsonb, jsonb, jsonb)
  to authenticated;

-- Also protect publications issued by existing pg_cron jobs, not just the UI.
-- Published answer slots cannot be reassigned to a different entity or type.
-- Match historical storage encodings to their canonical exercise types.
create or replace function public.content_release_exercise_type(exercise_row jsonb)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  stored_type text := exercise_row->>'type';
  question_text text := coalesce(exercise_row->>'question', '');
  config_prefix text;
  resolved_type text;
begin
  if stored_type = 'open' then
    if starts_with(question_text, '__static_text__:') then return 'static_text'; end if;
    if starts_with(question_text, '__popup_message__:') then return 'popup_message'; end if;
    if starts_with(question_text, '__prompt_open__:') then return 'prompt_open'; end if;
    if question_text ~ '_{3,}' then return 'fill_blank'; end if;
  elsif stored_type = 'multiple' then
    if starts_with(question_text, '__checklist__:') then return 'checklist'; end if;
    if starts_with(question_text, '__table__:') then return 'table'; end if;
    for config_prefix, resolved_type in
      select prefix, canonical_type from (values
        (1, '__group_open__:', 'group_open'), (2, '__checklist_entry__:', 'checklist'),
        (3, '__table_rows__:', 'table'), (4, '__table_columns__:', 'table'),
        (5, '__image_upload_max__:', 'image_upload'),
        (6, '__editorial_calendar_config__:', 'editorial_calendar'),
        (7, '__moodboard_config__:', 'moodboard'), (8, '__brand_persona_config__:', 'brand_persona'),
        (9, '__spectrum_config__:', 'spectrum'), (10, '__color_palette_config__:', 'color_palette'),
        (11, '__typography_config__:', 'typography')
      ) encoding(priority, prefix, canonical_type) order by priority
    loop
      if exists (select 1 from jsonb_array_elements_text(coalesce(exercise_row->'options', '[]'::jsonb)) as option_row(option_value)
        where starts_with(option_value, config_prefix)) then return resolved_type; end if;
    end loop;
  end if;
  return stored_type;
end;
$$;
revoke all on function public.content_release_exercise_type(jsonb) from public, anon, authenticated;

create or replace function public.content_release_answer_slots(snapshot_modules jsonb)
returns table(kind text, stable_key text, parent_key text, position_value integer, numeric_id text, exercise_type text)
language sql
immutable
set search_path = public
as $$
  with modules as (
    select item from jsonb_array_elements(snapshot_modules) as entry(item)
  ), submodules as (
    select module.item as module_item, sub.item
    from modules module cross join lateral jsonb_array_elements(module.item->'submodules') sub(item)
  ), exercises as (
    select sub.module_item, sub.item as submodule_item, exercise.item
    from submodules sub cross join lateral jsonb_array_elements(sub.item->'exercises') exercise(item)
  )
  select 'module', item->>'stableKey', '', (item->>'position')::integer,
    coalesce(item->>'id', item->>'legacyId'), null from modules
  union all
  select 'submodule', item->>'stableKey', module_item->>'stableKey', (item->>'position')::integer,
    coalesce(item->>'id', item->>'legacyId'), null from submodules
  union all
  select 'exercise', item->>'stableKey', submodule_item->>'stableKey', (item->>'position')::integer,
    coalesce(item->>'id', item->>'legacyId'), public.content_release_exercise_type(item) from exercises;
$$;
revoke all on function public.content_release_answer_slots(jsonb) from public, anon, authenticated;

create or replace function public.guard_controlled_release_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_modules jsonb;
  next_modules jsonb;
begin
  if new.status <> 'published' or old.status = 'published' then return new; end if;
  select snapshot.modules into previous_modules
  from public.application_release_state state
  join public.content_release_snapshots snapshot on snapshot.release_id = state.published_release_id
  where state.id = 1;
  select modules into next_modules from public.content_release_snapshots
  where release_id = new.id and schema_version = 1;
  if previous_modules is null or next_modules is null or jsonb_typeof(next_modules) <> 'array'
     or jsonb_array_length(next_modules) = 0 then
    raise exception 'Snapshot officiel absent ou invalide : publication bloquée.';
  end if;
  if exists (
    select 1 from public.content_release_answer_slots(previous_modules) previous
    left join public.content_release_answer_slots(next_modules) candidate
      on candidate.kind = previous.kind and candidate.stable_key = previous.stable_key
    where candidate.stable_key is null
      or candidate.parent_key is distinct from previous.parent_key
      or candidate.position_value is distinct from previous.position_value
      or (previous.numeric_id is not null and candidate.numeric_id is distinct from previous.numeric_id)
      or candidate.exercise_type is distinct from previous.exercise_type
  ) then
    raise exception 'Identifiants ou positions incompatibles : publication bloquée pour conserver les réponses.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_controlled_release_publication() from public, anon, authenticated;
drop trigger if exists controlled_release_publication_compatible on public.content_releases;
create trigger controlled_release_publication_compatible
before update of status on public.content_releases
for each row execute function public.guard_controlled_release_publication();
