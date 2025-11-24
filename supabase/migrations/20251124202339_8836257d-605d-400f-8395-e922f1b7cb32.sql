-- Remove the foreign key constraint from candidates.user_id
-- This allows public candidate submissions without requiring a valid user_id
ALTER TABLE public.candidates 
DROP CONSTRAINT IF EXISTS candidates_user_id_fkey;

-- Make user_id nullable since public submissions don't have authenticated users
ALTER TABLE public.candidates 
ALTER COLUMN user_id DROP NOT NULL;