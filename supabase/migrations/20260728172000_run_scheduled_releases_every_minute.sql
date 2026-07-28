create or replace function public.publish_due_content_releases()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  schedule_record record;
  published_count integer := 0;
begin
  for schedule_record in
    select id
    from public.content_release_schedules
    where status = 'scheduled' and scheduled_at <= now()
    order by scheduled_at
    limit 10
    for update skip locked
  loop
    update public.content_release_schedules
    set status = 'processing', updated_at = now()
    where id = schedule_record.id and status = 'scheduled';

    if found then
      begin
        perform public.publish_scheduled_content_release(schedule_record.id);
        published_count := published_count + 1;
      exception when others then
        update public.content_release_schedules
        set status = 'failed',
            error_message = sqlerrm,
            updated_at = now()
        where id = schedule_record.id;
      end;
    end if;
  end loop;
  return published_count;
end;
$$;

revoke all on function public.publish_due_content_releases()
  from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'brand-studio-publish-content-releases'
  limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
  perform cron.schedule(
    'brand-studio-publish-content-releases',
    '* * * * *',
    'select public.publish_due_content_releases();'
  );
end;
$$;
