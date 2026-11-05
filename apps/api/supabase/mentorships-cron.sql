-- Daily mentorships sweep (notifications + emails), scheduled with Supabase pg_cron.
-- Applied manually on the production project (VEO Services DB). Not a Prisma migration:
-- staging has no deployed API, so it must not get this job.
-- Runs at 13:00 UTC = 07:00 El Salvador.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
create extension if not exists pg_net with schema extensions;

-- Same value as CRON_SECRET in the API environment on Vercel.
select vault.create_secret('<CRON_SECRET>', 'veo_cron_secret', 'CRON_SECRET of the VEO API, sent as Bearer token by scheduled jobs');
select vault.create_secret('https://veo-services2-0-api.vercel.app/api/v1', 'veo_api_base_url', 'Production VEO API base URL used by scheduled jobs');

select cron.schedule(
  'veo-mentorships-sweep',
  '0 13 * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'veo_api_base_url') || '/mentorships/cron/sweep',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'veo_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Rotate the secret:   select vault.update_secret((select id from vault.secrets where name = 'veo_cron_secret'), '<NEW_SECRET>');
-- Last responses:      select id, status_code, content, created from net._http_response order by id desc limit 10;
-- Run history:         select * from cron.job_run_details order by start_time desc limit 10;
-- Remove the job:      select cron.unschedule('veo-mentorships-sweep');
