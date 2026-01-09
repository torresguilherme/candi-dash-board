-- Create a public_submissions table for unauthenticated form submissions
-- This captures minimal data from the Cadastro page without admin access
CREATE TABLE public.public_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    area_of_interest TEXT,
    region TEXT,
    linkedin_url TEXT,
    resume_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Add constraints for input validation
ALTER TABLE public.public_submissions 
ADD CONSTRAINT ps_valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.public_submissions 
ADD CONSTRAINT ps_reasonable_name_length 
CHECK (length(full_name) <= 200);

ALTER TABLE public.public_submissions 
ADD CONSTRAINT ps_reasonable_email_length 
CHECK (length(email) <= 255);

ALTER TABLE public.public_submissions 
ADD CONSTRAINT ps_reasonable_phone_length 
CHECK (phone IS NULL OR length(phone) <= 50);

-- Enable RLS
ALTER TABLE public.public_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (this is the intended public endpoint)
CREATE POLICY "Anyone can submit applications"
ON public.public_submissions FOR INSERT
WITH CHECK (true);

-- Admins can view all submissions
CREATE POLICY "Admins can view submissions"
ON public.public_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update submissions (to mark as processed)
CREATE POLICY "Admins can update submissions"
ON public.public_submissions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.public_submissions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add storage policy for public resume uploads (unauthenticated)
-- Allow anyone to upload to the 'public-submissions' folder in resumes bucket
CREATE POLICY "Anyone can upload public submission resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'public-submissions');