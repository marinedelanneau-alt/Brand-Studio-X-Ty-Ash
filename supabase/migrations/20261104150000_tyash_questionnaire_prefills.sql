-- TYASH only. Additive migration; no accounts, permissions, answers or releases updated.
begin;
create table if not exists public.tyash_questionnaire_prefills (
  project_id bigint not null references public.brand_projects(id),
  module_key text not null check (module_key like 'tyash_v1_%'),
  question_key text not null check (question_key like 'tyash_v1_%'),
  values jsonb not null default '[]'::jsonb check (jsonb_typeof(values) = 'array'),
  updated_by bigint not null references public.client_access_codes(id),
  updated_at timestamptz not null default now(),
  primary key (project_id, question_key)
);
alter table public.tyash_questionnaire_prefills enable row level security;
revoke all on public.tyash_questionnaire_prefills from public, anon, authenticated;
grant select, insert, update on public.tyash_questionnaire_prefills to service_role;
comment on table public.tyash_questionnaire_prefills is 'Admin-provided baseline only. user_answers remains the authoritative client correction. Access through authenticated, ownership-checked server actions.';
commit;
-- Reversible feature: unpublish/revert the questionnaire release and remove the UI.
-- Preserve this table for historical evidence; do not drop or truncate it on rollback.
