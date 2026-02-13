
-- Add attachment columns to client_interactions
ALTER TABLE public.client_interactions
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT;
