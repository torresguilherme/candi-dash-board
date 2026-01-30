-- Add column to track who is assigned to handle the next step
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS next_step_assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.clients.next_step_assigned_to IS 'User assigned to handle the next step for this client';