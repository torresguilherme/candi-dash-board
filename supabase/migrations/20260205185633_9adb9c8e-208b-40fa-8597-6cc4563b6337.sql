-- Create candidate_meetings table for scheduling meetings with candidates/clients
CREATE TABLE public.candidate_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidate_meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins and editors can view all meetings"
  ON public.candidate_meetings FOR SELECT
  USING (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can insert meetings"
  ON public.candidate_meetings FOR INSERT
  WITH CHECK (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can update meetings"
  ON public.candidate_meetings FOR UPDATE
  USING (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins can delete meetings"
  ON public.candidate_meetings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups by candidate
CREATE INDEX idx_candidate_meetings_candidate_id ON public.candidate_meetings(candidate_id);