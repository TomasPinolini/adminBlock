-- =============================================================================
-- DAILY DIGEST: pg_cron setup for AdminBlock
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================

-- Step 1: Extensions should already be enabled from auto-archive setup
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Schedule the daily-digest Edge Function
-- Runs daily at 11:00 AM UTC (8:00 AM ART / Argentina Time)
SELECT cron.schedule(
  'daily-digest-email',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gfezwpmsnnnkboxvdaes.supabase.co/functions/v1/daily-digest',
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
-- IMPORTANTE: Antes de activar esto, configurar el email del admin en:
--   Ajustes → Email del administrador
--   (se guarda en app_settings con clave 'admin.email')
--
-- Si current_setting('app.settings.anon_key') no funciona, reemplazar con
-- tu anon key real:
--
--   'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
--
-- Para verificar:
--   SELECT * FROM cron.job;
--
-- Para desactivar:
--   SELECT cron.unschedule('daily-digest-email');
-- =============================================================================
