-- =============================================================================
-- OVERDUE REMINDERS: pg_cron setup for AdminBlock
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================

-- Step 1: Add last_reminder_sent column to orders (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_reminder_sent date;

-- Step 2: Schedule the overdue-reminders Edge Function
-- Runs daily at 12:00 PM UTC (9:00 AM ART / Argentina Time)
SELECT cron.schedule(
  'overdue-reminders',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gfezwpmsnnnkboxvdaes.supabase.co/functions/v1/overdue-reminders',
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
-- Este job envía UN recordatorio por día a cada cliente con pedido vencido.
-- No repite el email el mismo día gracias al campo last_reminder_sent.
--
-- Si current_setting('app.settings.anon_key') no funciona, reemplazar con
-- tu anon key real:
--
--   'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
--
-- Para verificar todos los jobs:
--   SELECT * FROM cron.job;
--
-- Para desactivar:
--   SELECT cron.unschedule('overdue-reminders');
-- =============================================================================
