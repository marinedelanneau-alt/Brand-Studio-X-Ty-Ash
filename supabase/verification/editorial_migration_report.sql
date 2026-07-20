-- Read-only report. Run after the migration and before switching production reads.
select 'missing_module_keys' as check_name, count(*) as issue_count
from public.editorial_modules where module_key is null or btrim(module_key) = ''
union all
select 'modules_without_published_version', count(*)
from public.editorial_modules em
where not exists (select 1 from public.module_versions mv where mv.module_id = em.id and mv.status = 'published')
union all
select 'duplicate_question_keys', count(*)
from (
  select module_version_id, question_key, field_key
  from public.question_versions group by 1,2,3 having count(*) > 1
) duplicates
union all
select 'orphan_legacy_answers', count(*)
from public.project_exercise_answers pea
left join public.module_exercises me on me.id = pea.exercise_id
where me.id is null
union all
select 'answers_not_migrated', count(*)
from public.project_exercise_answers pea
join public.brand_projects bp on bp.id = pea.project_id
where not exists (
  select 1 from public.user_answers ua
  where ua.user_id = bp.account_id and ua.project_id = pea.project_id
    and ua.question_key = 'question_' || pea.exercise_id and ua.field_key = 'answer'
)
union all
select 'projects_with_foreign_answers', count(*)
from public.user_answers ua
join public.brand_projects bp on bp.id = ua.project_id
where bp.account_id <> ua.user_id;
