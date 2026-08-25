-- Additive, read-only Admin access. No user data is changed by this migration.
drop policy if exists client_accounts_admin_select on public.client_access_codes;
create policy client_accounts_admin_select on public.client_access_codes
  for select using (public.is_current_user_admin());

drop policy if exists brand_projects_admin_select on public.brand_projects;
create policy brand_projects_admin_select on public.brand_projects
  for select using (public.is_current_user_admin());

drop policy if exists user_answers_admin_select on public.user_answers;
create policy user_answers_admin_select on public.user_answers
  for select using (public.is_current_user_admin());

drop policy if exists user_progress_admin_select on public.user_module_progress;
create policy user_progress_admin_select on public.user_module_progress
  for select using (public.is_current_user_admin());

drop policy if exists legacy_answers_admin_select on public.project_exercise_answers;
create policy legacy_answers_admin_select on public.project_exercise_answers
  for select using (public.is_current_user_admin());

drop policy if exists legacy_progress_admin_select on public.project_module_states;
create policy legacy_progress_admin_select on public.project_module_states
  for select using (public.is_current_user_admin());

drop policy if exists brand_exports_admin_select on public.brand_exports;
create policy brand_exports_admin_select on public.brand_exports
  for select using (public.is_current_user_admin());
