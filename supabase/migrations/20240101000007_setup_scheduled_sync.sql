-- Enable pg_cron extension for scheduled jobs
-- Note: This requires superuser privileges, may need to be done via Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- For now, we'll just document the cron schedule
-- In production, this would be configured via Supabase CLI or dashboard:
-- 
-- SELECT cron.schedule(
--   'syrve-product-sync-nightly',
--   '0 4 * * *',  -- Every day at 4 AM
--   $$ 
--   SELECT
--     net.http_post(
--       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/syrve-product-sync',
--       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--     )
--   $$
-- );

-- Create a function that can be called manually or by cron to trigger sync
CREATE OR REPLACE FUNCTION trigger_syrve_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder that would call the edge function
  -- In practice, we'd use pg_net or similar to make HTTP request
  RAISE NOTICE 'Syrve sync triggered at %', NOW();
END;
$$;

-- Grant execute permission to authenticated users (admins will trigger this)
GRANT EXECUTE ON FUNCTION trigger_syrve_sync() TO authenticated;
