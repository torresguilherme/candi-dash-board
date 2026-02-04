-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the attention alerts webhook to run every 2 days at 9:00 AM
SELECT cron.schedule(
  'send-attention-alerts-every-2-days',
  '0 9 */2 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ajkajxvyrqjmybpxgqub.supabase.co/functions/v1/send-attention-alerts',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2FqeHZ5cnFqbXlicHhncXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDE4NjksImV4cCI6MjA3OTU3Nzg2OX0.vMgqP210GJAN61WrJ8lI5m2UOrx2_3gnAGlBedZx1s"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);