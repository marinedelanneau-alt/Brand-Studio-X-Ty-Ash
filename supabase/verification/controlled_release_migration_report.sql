-- Run before and after the controlled release migration. Every result must be
-- zero except the explicit inventory rows.
select 'legacy_modules' as check_name, count(*)::bigint as value
from public.brand_modules;

select 'legacy_exercises' as check_name, count(*)::bigint as value
from public.module_exercises;

select 'legacy_answers' as check_name, count(*)::bigint as value
from public.project_exercise_answers;

select 'stable_answers' as check_name, count(*)::bigint as value
from public.user_answers;

select 'published_release_count_must_equal_one' as check_name,
  abs(count(*) - 1)::bigint as value
from public.content_releases
where status = 'published';

select 'release_state_count_must_equal_one' as check_name,
  abs(count(*) - 1)::bigint as value
from public.application_release_state
where id = 1;

select 'state_without_published_release' as check_name, count(*)::bigint as value
from public.application_release_state state
left join public.content_releases release
  on release.id = state.published_release_id and release.status = 'published'
where state.id = 1 and release.id is null;

select 'snapshot_without_release' as check_name, count(*)::bigint as value
from public.content_release_snapshots snapshot
left join public.content_releases release on release.id = snapshot.release_id
where release.id is null;

select 'answers_with_changed_owner' as check_name, count(*)::bigint as value
from public.user_answers answer
join public.brand_projects project on project.id = answer.project_id
where project.account_id <> answer.user_id;
