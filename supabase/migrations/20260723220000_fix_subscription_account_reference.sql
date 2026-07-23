alter table public.subscriptions
  drop constraint if exists subscriptions_user_id_fkey;

drop policy if exists subscriptions_select_own
  on public.subscriptions;

alter table public.subscriptions
  alter column user_id type bigint
  using null::bigint;

alter table public.subscriptions
  alter column user_id set not null;

alter table public.subscriptions
  add constraint subscriptions_user_id_fkey
  foreign key (user_id)
  references public.client_access_codes(id)
  on delete cascade;

create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.client_access_codes accounts
      where accounts.id = subscriptions.user_id
        and accounts.auth_user_id = auth.uid()
    )
  );
