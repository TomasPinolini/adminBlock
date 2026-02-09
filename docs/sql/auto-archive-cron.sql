-- =============================================================================
-- AUTO-ARCHIVE: pg_cron setup for AdminBlock
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================

-- Step 1: Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Schedule the auto-archive Edge Function
-- Runs daily at 3:00 AM UTC (midnight ART / Argentina Time)
SELECT cron.schedule(
  'auto-archive-orders',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gfezwpmsnnnkboxvdaes.supabase.co/functions/v1/auto-archive',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- =============================================================================
-- NOTES:
-- 
-- If current_setting('app.settings.anon_key') doesn't work, replace it with
-- your actual anon key string:
--
--   'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
--
-- To check scheduled jobs:
--   SELECT * FROM cron.job;
--
-- To check job run history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- To unschedule:
--   SELECT cron.unschedule('auto-archive-orders');
-- =============================================================================
