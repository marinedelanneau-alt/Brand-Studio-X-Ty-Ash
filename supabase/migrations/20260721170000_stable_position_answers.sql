-- Copy every currently recoverable legacy answer to an identity that survives
-- module deployments. This is additive: historical rows are never deleted.
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
  client_revision,
  created_at,
  updated_at
)
select
  bp.account_id,
  pea.project_id,
  'module_position_' || bm.position,
  'stable_position',
  'module_position_' || bm.position || '_exercise_position_' || me.position,
  'module_position_' || bm.position || '_exercise_position_' || me.position,
  'answer',
  case
    when pea.answer_text is not null then to_jsonb(pea.answer_text)
    else coalesce(pea.selected_options, '[]'::jsonb)
  end,
  null,
  coalesce(pea.updated_at, now()),
  0,
  coalesce(pea.created_at, now()),
  now()
from public.project_exercise_answers pea
join public.brand_projects bp on bp.id = pea.project_id
join public.brand_modules bm on bm.id = pea.module_id
join public.module_exercises me on me.id = pea.exercise_id
on conflict (user_id, project_id, question_key, field_key)
do update set
  answer_value = case
    when public.user_answers.client_updated_at <= excluded.client_updated_at
      then excluded.answer_value
    else public.user_answers.answer_value
  end,
  client_updated_at = greatest(
    public.user_answers.client_updated_at,
    excluded.client_updated_at
  ),
  updated_at = now();

