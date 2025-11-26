-- Create candidate_meetings table
CREATE TABLE IF NOT EXISTS public.candidate_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create candidate_documents table
CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_meetings
CREATE POLICY "Admins can view all meetings"
  ON public.candidate_meetings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert meetings"
  ON public.candidate_meetings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update meetings"
  ON public.candidate_meetings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete meetings"
  ON public.candidate_meetings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for candidate_documents
CREATE POLICY "Admins can view all documents"
  ON public.candidate_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert documents"
  ON public.candidate_documents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
  ON public.candidate_documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documents"
  ON public.candidate_documents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidate_meetings_candidate_id 
  ON public.candidate_meetings(candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_meetings_date 
  ON public.candidate_meetings(meeting_date DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id 
  ON public.candidate_documents(candidate_id);

-- Create storage bucket for candidate documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for candidate-documents bucket
CREATE POLICY "Admins can view all candidate documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload candidate documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update candidate documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'candidate-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete candidate documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'candidate-documents' AND public.has_role(auth.uid(), 'admin'::app_role));