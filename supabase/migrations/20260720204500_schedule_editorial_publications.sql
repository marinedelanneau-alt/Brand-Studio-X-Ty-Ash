create extension if not exists pg_cron with schema pg_catalog;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'brand-studio-publish-scheduled' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule(
    'brand-studio-publish-scheduled',
    '* * * * *',
    'select public.publish_due_module_versions();'
  );
end $$;
