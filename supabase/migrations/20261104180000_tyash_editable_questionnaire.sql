-- Stable TYASH identities support moves and reordering. Historical definitions
-- remain mandatory (archived on removal/type change). Legacy guards unchanged.
create or replace function public.assert_pathway_answer_slots(previous_modules jsonb, next_modules jsonb)
returns void language plpgsql set search_path = public as $$
declare stable_identity boolean;
begin
  stable_identity := jsonb_array_length(previous_modules) > 0 and not exists (
    select 1 from public.content_release_answer_slots(previous_modules) slot
    where slot.stable_key is null or not starts_with(slot.stable_key, 'tyash_v1_')
  );
  if exists (
    select 1 from public.content_release_answer_slots(previous_modules) previous
    left join public.content_release_answer_slots(next_modules) candidate
      on candidate.kind = previous.kind and candidate.stable_key = previous.stable_key
    where candidate.stable_key is null or (not stable_identity and (candidate.parent_key is distinct from previous.parent_key
      or candidate.position_value is distinct from previous.position_value))
      or (previous.numeric_id is not null and candidate.numeric_id is distinct from previous.numeric_id)
      or candidate.exercise_type is distinct from previous.exercise_type
  ) then raise exception 'Identifiants ou positions incompatibles : protection des reponses'; end if;
end;
$$;
revoke all on function public.assert_pathway_answer_slots(jsonb,jsonb) from public, anon, authenticated;

