-- Target: Brand Studio X Ty Ash / cplzwnlstcpqqzqeawgs ONLY.
-- PostgreSQL has no reliable portable Supabase project-ref primitive. These
-- structural checks are NOT proof of project identity: select Ty Ash explicitly.
-- One transaction: a failed precondition leaves no partial schema changes.
begin;
do $preconditions$
declare required_name text; required_column record;
begin
  foreach required_name in array array['content_releases','content_release_snapshots','application_release_state','admin_audit_logs','brand_modules','brand_submodules','module_exercises','user_answers'] loop
    if to_regclass('public.' || required_name) is null then raise exception 'Missing prerequisite table: %',required_name; end if;
  end loop;
  for required_column in select * from (values
    ('content_releases','id','uuid'),('content_releases','source_release_id','uuid'),
    ('content_releases','status','text'),('content_releases','published_at','timestamp with time zone'),
    ('content_release_snapshots','release_id','uuid'),('content_release_snapshots','modules','jsonb'),
    ('content_release_snapshots','schema_version','integer'),
    ('content_release_snapshots','brand_guide_settings','jsonb'),('content_release_snapshots','pdf_settings','jsonb'),
    ('content_release_snapshots','interface_settings','jsonb'),
    ('application_release_state','published_release_id','uuid'),('application_release_state','current_draft_release_id','uuid'),
    ('user_answers','module_key','text'),('user_answers','question_key','text')
  ) as required(table_name,column_name,type_name) loop
    if not exists (select 1 from pg_attribute a where a.attrelid=to_regclass('public.' || required_column.table_name)
      and a.attname=required_column.column_name and not a.attisdropped
      and format_type(a.atttypid,a.atttypmod)=required_column.type_name) then
      raise exception 'Missing or incompatible column: %.%',required_column.table_name,required_column.column_name;
    end if;
  end loop;
  foreach required_name in array array[
    'auth.uid()', 'public.is_admin(uuid)', 'public.content_release_answer_slots(jsonb)',
    'public.content_release_exercise_type(jsonb)',
    'public.clone_content_release(uuid,text,boolean)',
    'public.update_current_draft_snapshot_if_unchanged(uuid,timestamp with time zone,integer,jsonb,jsonb,jsonb,jsonb)',
    'public.mark_content_release_ready(uuid,text)', 'public.publish_content_release(uuid,text)'
  ] loop
    if to_regprocedure(required_name) is null then raise exception 'Missing prerequisite function: %',required_name; end if;
  end loop;
  if not exists (select 1 from pg_roles where rolname='authenticated')
    or not exists (select 1 from public.application_release_state state
      join public.content_releases release on release.id=state.published_release_id
      join public.content_release_snapshots snapshot on snapshot.release_id=release.id
      where state.id=1 and release.status='published' and snapshot.schema_version=1) then
    raise exception 'Controlled release state missing or incompatible';
  end if;
  if exists (select 1 from pg_attribute where attrelid='public.content_releases'::regclass
    and attname='pathway_root_id' and not attisdropped and atttypid<>'uuid'::regtype) then
    raise exception 'Incompatible existing pathway_root_id';
  end if;
end;
$preconditions$;

-- BEGIN SHARED PATHWAY CONTRACT (generated; see scripts/sync-pathway-contract.mjs)
create or replace function public.independent_pathway_contract()
returns jsonb language sql immutable set search_path = public as $contract$
  select $schema${"modules":{"type":"array","minItems":1,"items":{"type":"object","required":["id","stableKey","position","title","submodules"],"properties":{"id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"stableKey":{"type":"string","pattern":"^tyash_v1_.+"},"position":{"type":"integer","minimum":1,"maximum":9007199254740991},"video_url":{"type":["string","null"]},"audio_url":{"type":["string","null"]},"audio_transcript":{"type":["string","null"]},"editorKey":{"type":["string","null"]},"editorRevision":{"type":["string","null"]},"created_at":{"type":["string","null"]},"updated_at":{"type":["string","null"]},"title":{"type":"string","minLength":1,"pattern":"\\S"},"content_html":{"type":"string"},"is_published":{"type":"boolean"},"submodules":{"type":"array","minItems":1,"items":{"type":"object","required":["id","stableKey","position","module_id","title","content_html","exercises"],"properties":{"id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"stableKey":{"type":"string","pattern":"^tyash_v1_.+"},"position":{"type":"integer","minimum":1,"maximum":9007199254740991},"video_url":{"type":["string","null"]},"audio_url":{"type":["string","null"]},"audio_transcript":{"type":["string","null"]},"editorKey":{"type":["string","null"]},"editorRevision":{"type":["string","null"]},"created_at":{"type":["string","null"]},"updated_at":{"type":["string","null"]},"module_id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"title":{"type":"string","minLength":1,"pattern":"\\S"},"content_html":{"type":"string"},"exercises":{"type":"array","items":{"type":"object","required":["id","stableKey","position","module_id","submodule_id","type","question","options"],"properties":{"id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"stableKey":{"type":"string","pattern":"^tyash_v1_.+"},"position":{"type":"integer","minimum":1,"maximum":9007199254740991},"video_url":{"type":["string","null"]},"audio_url":{"type":["string","null"]},"audio_transcript":{"type":["string","null"]},"editorKey":{"type":["string","null"]},"editorRevision":{"type":["string","null"]},"created_at":{"type":["string","null"]},"updated_at":{"type":["string","null"]},"module_id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"submodule_id":{"type":"integer","minimum":-9007199254740991,"maximum":-1},"type":{"type":"string","enum":["static_text","popup_message","image_upload","open","single","multiple","checklist","table","boolean","color","fill_blank","prompt_open","group_open","brand_persona","spectrum","color_palette","typography","editorial_calendar","moodboard"]},"question":{"type":"string"},"options":{"type":"array","items":{"type":"string"}},"explanation":{"type":"string"},"answer_placeholder":{"type":["string","null"]},"exercise_group_id":{"type":["string","null"]},"completion":{"type":"object","properties":{"required":{"type":"boolean"},"optionalFields":{"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":0,"maximum":9007199254740991}},"optionalRows":{"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":0,"maximum":9007199254740991}},"optionalCells":{"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":0,"maximum":9007199254740991}}},"additionalProperties":false},"videoUrl":{"type":["string","null"]},"audioUrl":{"type":["string","null"]},"audioTranscript":{"type":["string","null"]},"answerPlaceholder":{"type":["string","null"]},"feedback_config":{"type":["object","null"],"required":["enabled","type","minLength","maxLength","requiredKeywords","forbiddenKeywords","clarityScoreEnabled","rules","positiveMessage","neutralMessage","improvementMessage","excellentMessage"],"properties":{"enabled":{"type":"boolean"},"clarityScoreEnabled":{"type":"boolean"},"positiveMessage":{"type":"string"},"neutralMessage":{"type":"string"},"improvementMessage":{"type":"string"},"excellentMessage":{"type":"string"},"minLength":{"type":"integer","minimum":0,"maximum":9007199254740991},"maxLength":{"type":"integer","minimum":0,"maximum":9007199254740991},"requiredKeywords":{"type":"array","items":{"type":"string"}},"forbiddenKeywords":{"type":"array","items":{"type":"string"}},"type":{"type":"string","enum":["rule_based","manual","ai_ready"]},"rules":{"type":"array","items":{"type":"object","required":["id","condition","message","level"],"properties":{"id":{"type":"string"},"condition":{"type":"string","enum":["length_less_than","length_between","contains_generic_words","contains_required_keywords","passes_all_checks"]},"message":{"type":"string"},"level":{"type":"string","enum":["improve","warning","good","excellent"]}}}}}},"contentHtml":{"type":"string"}}}},"videoUrl":{"type":["string","null"]},"audioUrl":{"type":["string","null"]},"audioTranscript":{"type":["string","null"]},"answerPlaceholder":{"type":["string","null"]},"contentHtml":{"type":"string"}}}},"videoUrl":{"type":["string","null"]},"audioUrl":{"type":["string","null"]},"audioTranscript":{"type":["string","null"]},"answerPlaceholder":{"type":["string","null"]},"isPublished":{"type":"boolean"},"contentHtml":{"type":"string"}}}},"spectrum":{"type":"object","required":["leftLabel","rightLabel","defaultValue"],"properties":{"leftLabel":{"type":"string"},"rightLabel":{"type":"string"},"leftEmoji":{"type":"string"},"rightEmoji":{"type":"string"},"helperText":{"type":"string"},"leftEdgeMessage":{"type":"string"},"rightEdgeMessage":{"type":"string"},"enableJustification":{"type":"boolean"},"requireJustification":{"type":"boolean"},"enableEdgeEffect":{"type":"boolean"},"defaultValue":{"type":"integer","minimum":0,"maximum":100},"edgeThreshold":{"type":"integer","minimum":0,"maximum":50},"edgeEffectType":{"type":"string","enum":["confetti","sparkle","pulse"]}}},"numericOptions":{"__table_rows__:":{"type":"integer","minimum":1,"maximum":1000},"__table_columns__:":{"type":"integer","minimum":1,"maximum":1000},"__group_open_layout__:":{"type":"integer","minimum":1,"maximum":1000},"__question_columns__:":{"type":"integer","minimum":1,"maximum":1000},"__image_upload_max__:":{"type":"integer","minimum":1,"maximum":1000}}}$schema$::jsonb;
$contract$;
revoke all on function public.independent_pathway_contract() from public,anon,authenticated;
-- END SHARED PATHWAY CONTRACT

-- Small contract interpreter, not a second content model. The JSON contract is
-- shared with the existing TypeScript validator's independent-pathway boundary.
create or replace function public.assert_pathway_contract(document jsonb, rule jsonb)
returns void language plpgsql set search_path = public as $$
declare actual_type text := jsonb_typeof(document); field record; child jsonb; wanted text;
begin
  if document is null then raise exception 'Invalid admin structure: missing value'; end if;
  if actual_type='number' and (document::text)::numeric=trunc((document::text)::numeric) then actual_type:='integer'; end if;
  if rule ? 'type' then
    if jsonb_typeof(rule->'type')='array' then
      if not (rule->'type' @> to_jsonb(actual_type)) then raise exception 'Invalid admin structure: type'; end if;
    elsif rule->>'type'<>actual_type then raise exception 'Invalid admin structure: type'; end if;
  end if;
  if rule ? 'enum' and not (rule->'enum' @> jsonb_build_array(document)) then raise exception 'Invalid admin structure: enum'; end if;
  if actual_type='integer' then
    if (rule ? 'minimum' and (document::text)::numeric < (rule->>'minimum')::numeric)
      or (rule ? 'maximum' and (document::text)::numeric > (rule->>'maximum')::numeric) then
      raise exception 'Invalid admin structure: number range';
    end if;
  elsif actual_type='string' then
    wanted:=document #>> '{}';
    if (rule ? 'minLength' and length(wanted)<(rule->>'minLength')::integer)
      or (rule ? 'pattern' and wanted !~ (rule->>'pattern')) then raise exception 'Invalid admin structure: string'; end if;
  elsif actual_type='array' then
    if rule ? 'minItems' and jsonb_array_length(document)<(rule->>'minItems')::integer then raise exception 'Invalid admin structure: array length'; end if;
    if rule->>'uniqueItems'='true' and exists (select 1 from jsonb_array_elements(document) item group by item having count(*)>1) then
      raise exception 'Invalid admin structure: duplicate items';
    end if;
    if rule ? 'items' then
      for child in select * from jsonb_array_elements(document) loop perform public.assert_pathway_contract(child,rule->'items'); end loop;
    end if;
  elsif actual_type='object' then
    for wanted in select jsonb_array_elements_text(coalesce(rule->'required','[]'::jsonb)) loop
      if not (document ? wanted) then raise exception 'Invalid admin structure: required field %',wanted; end if;
    end loop;
    for field in select * from jsonb_each(document) loop
      if rule->'properties' ? field.key then perform public.assert_pathway_contract(field.value,rule->'properties'->field.key);
      elsif rule->>'additionalProperties'='false' then raise exception 'Invalid admin structure: unknown property'; end if;
    end loop;
  end if;
end;
$$;
revoke all on function public.assert_pathway_contract(jsonb,jsonb) from public,anon,authenticated;

create or replace function public.decode_pathway_option(encoded text)
returns jsonb language plpgsql immutable set search_path = public as $$
declare result bytea:=''::bytea; cursor_pos integer:=1; ch text;
begin
  while cursor_pos<=length(encoded) loop
    ch:=substr(encoded,cursor_pos,1);
    if ch='%' then
      if substr(encoded,cursor_pos+1,2) !~ '^[0-9a-fA-F]{2}$' then raise exception 'Invalid option encoding'; end if;
      result:=result || decode(substr(encoded,cursor_pos+1,2),'hex'); cursor_pos:=cursor_pos+3;
    else result:=result || convert_to(ch,'UTF8'); cursor_pos:=cursor_pos+1; end if;
  end loop;
  return convert_from(result,'UTF8')::jsonb;
end;
$$;
revoke all on function public.decode_pathway_option(text) from public,anon,authenticated;

create or replace function public.validate_independent_admin_modules(modules jsonb)
returns void language plpgsql set search_path = public as $$
declare m jsonb; s jsonb; e jsonb; canonical_type text; config jsonb; option_text text; key_name text; indexes jsonb;
  numeric_rule record; field_count integer; row_count integer; column_count integer; bound_value integer; i integer;
  contract jsonb:=public.independent_pathway_contract();
begin
  perform public.assert_pathway_contract(modules,contract->'modules');
  if exists(select 1 from public.content_release_answer_slots(modules) group by stable_key having count(*)>1)
    or exists(select 1 from public.content_release_answer_slots(modules) group by numeric_id having count(*)>1) then
    raise exception 'Invalid admin structure: duplicate identities';
  end if;
  if exists(select 1 from jsonb_array_elements(modules) item group by (item->>'position')::numeric having count(*)>1) then
    raise exception 'Invalid admin structure: module positions';
  end if;
  for m in select * from jsonb_array_elements(modules) loop
    if exists(select 1 from jsonb_array_elements(m->'submodules') item group by (item->>'position')::numeric having count(*)>1) then raise exception 'Invalid admin structure: submodule positions'; end if;
    if exists(select 1 from jsonb_array_elements(m->'submodules') sub cross join lateral jsonb_array_elements(sub->'exercises') item group by (item->>'position')::numeric having count(*)>1) then raise exception 'Invalid admin structure: question positions'; end if;
    for s in select * from jsonb_array_elements(m->'submodules') loop
      if s->'module_id'<>m->'id' then raise exception 'Invalid admin structure: submodule parent'; end if;
      for e in select * from jsonb_array_elements(s->'exercises') loop
        canonical_type:=public.content_release_exercise_type(e);
        if e->'module_id'<>m->'id' or e->'submodule_id'<>s->'id' then raise exception 'Invalid admin structure: question parent'; end if;
        for numeric_rule in select * from jsonb_each(contract->'numericOptions') loop
          if (select count(*) from jsonb_array_elements_text(e->'options') o where starts_with(o,numeric_rule.key))>1 then raise exception 'Invalid admin structure: duplicate numeric config'; end if;
          for option_text in select substr(o,length(numeric_rule.key)+1) from jsonb_array_elements_text(e->'options') o where starts_with(o,numeric_rule.key) loop
            if option_text !~ '^[1-9][0-9]*$' then raise exception 'Invalid admin structure: numeric config'; end if;
            perform public.assert_pathway_contract(to_jsonb(option_text::numeric),numeric_rule.value);
          end loop;
        end loop;
        if canonical_type='spectrum' then
          if (select count(*) from jsonb_array_elements_text(e->'options') o where starts_with(o,'__spectrum_config__:'))<>1 then raise exception 'Invalid admin structure: spectrum config'; end if;
          select public.decode_pathway_option(substr(o,length('__spectrum_config__:')+1)) into config from jsonb_array_elements_text(e->'options') o where starts_with(o,'__spectrum_config__:');
          perform public.assert_pathway_contract(config,contract->'spectrum');
        end if;
        if e ? 'completion' then
          select count(*) into field_count from jsonb_array_elements_text(e->'options') o where starts_with(o,'__question_item__:') and btrim(substr(o,length('__question_item__:')+1))<>'';
          if field_count=0 and canonical_type='group_open' then
            select count(*) into field_count from jsonb_array_elements_text(e->'options') o where starts_with(o,'__group_open__:') and btrim(substr(o,length('__group_open__:')+1))<>'';
          end if;
          row_count:=3; column_count:=3;
          for option_text in select * from jsonb_array_elements_text(e->'options') loop
            if starts_with(option_text,'__table_rows__:') and substr(option_text,length('__table_rows__:')+1) ~ '^[1-9][0-9]*$' then row_count:=substr(option_text,length('__table_rows__:')+1)::integer;
            elsif starts_with(option_text,'__table_columns__:') and substr(option_text,length('__table_columns__:')+1) ~ '^[1-9][0-9]*$' then column_count:=substr(option_text,length('__table_columns__:')+1)::integer; end if;
          end loop;
          foreach key_name in array array['optionalFields','optionalRows','optionalCells'] loop
            if not (e->'completion' ? key_name) then continue; end if;
            if (key_name='optionalFields' and canonical_type not in ('group_open','table'))
              or (key_name<>'optionalFields' and canonical_type<>'table') then raise exception 'Invalid admin structure: optional fields'; end if;
            bound_value:=case key_name when 'optionalFields' then field_count when 'optionalRows' then row_count else row_count*column_count end;
            indexes:=e->'completion'->key_name;
            for i in select item::text::integer from jsonb_array_elements(indexes) item loop
              if i>=bound_value then raise exception 'Invalid admin structure: optional index'; end if;
            end loop;
          end loop;
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;
revoke all on function public.validate_independent_admin_modules(jsonb) from public,anon,authenticated;

-- Additive: no historical snapshot, answer, progress, account or pointer is rewritten.
alter table public.content_releases
  add column if not exists pathway_root_id uuid references public.content_releases(id) on delete restrict;

create or replace function public.inherit_pathway_root()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.pathway_root_id is distinct from old.pathway_root_id then
      raise exception 'Pathway identity is immutable';
    end if;
  elsif new.pathway_root_id is null and new.source_release_id is not null then
    select pathway_root_id into new.pathway_root_id from public.content_releases where id = new.source_release_id;
  elsif new.pathway_root_id is not null and new.pathway_root_id <> new.id then
    raise exception 'New pathway must be its own root';
  end if;
  return new;
end;
$$;
revoke all on function public.inherit_pathway_root() from public, anon, authenticated;
create or replace trigger content_releases_pathway_identity before insert or update of pathway_root_id
on public.content_releases for each row execute function public.inherit_pathway_root();

create or replace function public.assert_pathway_answer_slots(previous_modules jsonb, next_modules jsonb)
returns void language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.content_release_answer_slots(previous_modules) previous
    left join public.content_release_answer_slots(next_modules) candidate
      on candidate.kind = previous.kind and candidate.stable_key = previous.stable_key
    where candidate.stable_key is null or candidate.parent_key is distinct from previous.parent_key
      or candidate.position_value is distinct from previous.position_value
      or (previous.numeric_id is not null and candidate.numeric_id is distinct from previous.numeric_id)
      or candidate.exercise_type is distinct from previous.exercise_type
  ) then raise exception 'Identifiants ou positions incompatibles : protection des reponses'; end if;
end;
$$;
revoke all on function public.assert_pathway_answer_slots(jsonb,jsonb) from public, anon, authenticated;

create or replace function public.assert_independent_pathway_snapshot(target_id uuid, next_modules jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare root_id uuid; baseline record;
begin
  select pathway_root_id into root_id from public.content_releases where id = target_id;
  if root_id is null then return; end if;
  perform public.validate_independent_admin_modules(next_modules);
  if next_modules is null or jsonb_typeof(next_modules) <> 'array' or jsonb_array_length(next_modules) = 0 then
    raise exception 'Empty or invalid pathway';
  end if;
  if exists (select 1 from public.content_release_answer_slots(next_modules) candidate
    where candidate.stable_key is null or not starts_with(candidate.stable_key, 'tyash_v1_')
      or candidate.numeric_id is null or candidate.numeric_id !~ '^-[1-9][0-9]*$') then
    raise exception 'Independent Ty Ash identities required';
  end if;
  if exists (select 1 from public.content_release_answer_slots(next_modules)
    group by stable_key having count(*) > 1) or exists (
    select 1 from public.content_release_answer_slots(next_modules) group by numeric_id having count(*) > 1
  ) then raise exception 'Duplicate pathway identities'; end if;
  if exists (
    select 1 from public.content_release_snapshots snapshot
    join public.content_releases release on release.id = snapshot.release_id
    cross join lateral public.content_release_answer_slots(snapshot.modules) previous
    cross join lateral public.content_release_answer_slots(next_modules) candidate
    where release.pathway_root_id is distinct from root_id
      and (candidate.numeric_id = previous.numeric_id or candidate.stable_key = previous.stable_key)
  ) then raise exception 'Identity already reserved by another pathway'; end if;
  for baseline in select snapshot.modules from public.content_release_snapshots snapshot
    join public.content_releases release on release.id = snapshot.release_id
    where release.pathway_root_id = root_id and release.published_at is not null
  loop
    perform public.assert_pathway_answer_slots(baseline.modules, next_modules);
  end loop;
end;
$$;
revoke all on function public.assert_independent_pathway_snapshot(uuid,jsonb) from public, anon, authenticated;

create or replace function public.guard_independent_pathway_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform 1 from public.application_release_state where id = 1 for update;
  if tg_op = 'UPDATE' and exists (select 1 from public.content_releases
    where id = old.release_id and published_at is not null) then
    raise exception 'Historical snapshots are immutable';
  end if;
  perform public.assert_independent_pathway_snapshot(new.release_id, new.modules);
  return new;
end;
$$;
revoke all on function public.guard_independent_pathway_snapshot() from public, anon, authenticated;
create or replace trigger independent_pathway_snapshot_guard before insert or update
on public.content_release_snapshots for each row execute function public.guard_independent_pathway_snapshot();

-- Keep the original protection for legacy releases. Explicit roots use their own
-- published history as baseline and reserve identities against every other root.
create or replace function public.guard_controlled_release_publication()
returns trigger language plpgsql security definer set search_path = public as $$
declare previous_modules jsonb; next_modules jsonb;
begin
  if new.status <> 'published' or old.status = 'published' then return new; end if;
  select modules into next_modules from public.content_release_snapshots where release_id = new.id and schema_version = 1;
  if next_modules is null or jsonb_array_length(next_modules) = 0 then raise exception 'Invalid snapshot'; end if;
  if new.pathway_root_id is not null then
    perform public.assert_independent_pathway_snapshot(new.id, next_modules);
  else
    select snapshot.modules into previous_modules from public.application_release_state state
      join public.content_release_snapshots snapshot on snapshot.release_id = state.published_release_id where state.id = 1;
    if previous_modules is null then raise exception 'Official snapshot missing'; end if;
    perform public.assert_pathway_answer_slots(previous_modules, next_modules);
  end if;
  return new;
end;
$$;

revoke all on function public.guard_controlled_release_publication() from public,anon,authenticated;

create or replace function public.create_independent_pathway_draft(
  draft_name text, snapshot_modules jsonb, expected_published_release_id uuid
)
returns uuid language plpgsql security definer set search_path = public as $$
declare actor uuid := auth.uid(); state_row public.application_release_state%rowtype;
  next_id uuid := gen_random_uuid();
begin
  if not public.is_admin(actor) then raise exception 'admin role required'; end if;
  if nullif(btrim(draft_name), '') is null then raise exception 'draft name required'; end if;
  select * into state_row from public.application_release_state where id = 1 for update;
  if state_row.published_release_id is distinct from expected_published_release_id then raise exception 'Published release changed'; end if;
  if state_row.current_draft_release_id is not null then raise exception 'A current draft already exists'; end if;
  -- Reject malformed content BEFORE inserting any release or snapshot.
  perform public.validate_independent_admin_modules(snapshot_modules);
  insert into public.content_releases(id,name,status,created_by,source_release_id,pathway_root_id)
    values(next_id,btrim(draft_name),'draft',actor,state_row.published_release_id,next_id);
  insert into public.content_release_snapshots(release_id,schema_version,modules,brand_guide_settings,pdf_settings,interface_settings,updated_by)
    select next_id,1,snapshot_modules,brand_guide_settings,pdf_settings,interface_settings,actor
    from public.content_release_snapshots where release_id = state_row.published_release_id;
  if not found then raise exception 'Official snapshot missing'; end if;
  update public.application_release_state set current_draft_release_id = next_id,updated_at = now(),updated_by = actor where id = 1;
  insert into public.admin_audit_logs(admin_user_id,action_type,entity_type,entity_id,release_id,metadata)
    values(actor,'independent_pathway_created','content_release',next_id::text,next_id,
      jsonb_build_object('source_release_id',state_row.published_release_id));
  return next_id;
end;
$$;
revoke all on function public.create_independent_pathway_draft(text,jsonb,uuid) from public,anon;
grant execute on function public.create_independent_pathway_draft(text,jsonb,uuid) to authenticated;

-- Reinstall the exact protection trigger from 20261008120000; do not rely on
-- whether that migration's trigger still exists. No other trigger is removed.
create or replace trigger controlled_release_publication_compatible
before update of status on public.content_releases
for each row execute function public.guard_controlled_release_publication();
alter table public.content_releases enable always trigger controlled_release_publication_compatible;
alter table public.content_releases enable always trigger content_releases_pathway_identity;
alter table public.content_release_snapshots enable always trigger independent_pathway_snapshot_guard;
commit;
