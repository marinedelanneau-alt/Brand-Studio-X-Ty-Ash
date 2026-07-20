do $$
declare issues integer;
begin
  select count(*) into issues from public.editorial_modules where module_key is null or btrim(module_key) = '';
  if issues > 0 then raise exception '% module keys missing', issues; end if;

  select count(*) into issues from public.editorial_modules em
    where not exists (select 1 from public.module_versions mv where mv.module_id = em.id and mv.status = 'published');
  if issues > 0 then raise exception '% modules lack a published version', issues; end if;

  select count(*) into issues from public.project_exercise_answers pea
    left join public.module_exercises me on me.id = pea.exercise_id where me.id is null;
  if issues > 0 then raise exception '% orphan legacy answers', issues; end if;

  select count(*) into issues from public.project_exercise_answers pea
  join public.brand_projects bp on bp.id = pea.project_id
  where not exists (select 1 from public.user_answers ua where ua.user_id = bp.account_id
    and ua.project_id = pea.project_id and ua.question_key = 'question_' || pea.exercise_id and ua.field_key = 'answer');
  if issues > 0 then raise exception '% answers were not migrated', issues; end if;

  select count(*) into issues from public.user_answers ua
    join public.brand_projects bp on bp.id = ua.project_id where bp.account_id <> ua.user_id;
  if issues > 0 then raise exception '% answers have a foreign owner', issues; end if;
end $$;
