-- Resolve the parameter/column ambiguity found by the end-to-end Preview test.
create or replace function public.clone_content_release(
  source_release_id uuid,
  draft_name text,
  replace_current_draft boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  state_row public.application_release_state%rowtype;
  source_row public.content_releases%rowtype;
  next_release_id uuid;
begin
  if not public.is_admin(actor) then raise exception 'admin role required'; end if;
  if nullif(btrim(draft_name), '') is null then raise exception 'draft name required'; end if;

  select * into state_row from public.application_release_state where id = 1 for update;
  select * into source_row from public.content_releases where id = $1;
  if source_row.id is null then raise exception 'source release not found'; end if;

  if state_row.current_draft_release_id is not null then
    if not replace_current_draft then raise exception 'a current draft already exists'; end if;
    update public.content_releases
      set status = 'archived', updated_at = now()
      where id = state_row.current_draft_release_id and status in ('draft', 'ready');
  end if;

  insert into public.content_releases(name, status, created_by, source_release_id)
  values (btrim(draft_name), 'draft', actor, source_row.id)
  returning id into next_release_id;

  insert into public.content_release_snapshots(
    release_id, schema_version, modules, brand_guide_settings, pdf_settings,
    interface_settings, updated_by
  )
  select next_release_id, schema_version, modules, brand_guide_settings,
    pdf_settings, interface_settings, actor
  from public.content_release_snapshots
  where release_id = source_row.id;

  insert into public.feature_configurations(
    release_id, stable_key, enabled, admin_only, rollout_percentage,
    allowed_user_ids, configuration
  )
  select next_release_id, stable_key, enabled, admin_only, rollout_percentage,
    allowed_user_ids, configuration
  from public.feature_configurations
  where release_id = source_row.id;

  update public.application_release_state
  set current_draft_release_id = next_release_id, updated_at = now(), updated_by = actor
  where id = 1;

  insert into public.admin_audit_logs(
    admin_user_id, action_type, entity_type, entity_id, release_id, metadata
  ) values (
    actor, case when source_row.status = 'archived' then 'release_restored' else 'draft_created' end,
    'content_release', next_release_id::text, next_release_id,
    jsonb_build_object('source_release_id', source_row.id, 'replaced_existing_draft', replace_current_draft)
  );
  return next_release_id;
end;
$$;

