-- Add CRM engagement fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS next_step TEXT,
ADD COLUMN IF NOT EXISTS next_step_date DATE;

-- Create client_interactions table for logging interactions
CREATE TABLE public.client_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for client_interactions
CREATE POLICY "Admins can view all interactions" 
ON public.client_interactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert interactions" 
ON public.client_interactions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update interactions" 
ON public.client_interactions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete interactions" 
ON public.client_interactions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update last_interaction_at when new interaction is logged
CREATE OR REPLACE FUNCTION public.update_client_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients 
  SET last_interaction_at = NEW.created_at
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_client_interaction_trigger
AFTER INSERT ON public.client_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_client_last_interaction();