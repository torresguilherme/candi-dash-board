
-- Create storage bucket for service deliverables
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-deliverables', 'service-deliverables', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service-deliverables bucket
CREATE POLICY "Admins and editors can upload service deliverables"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-deliverables' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can view service deliverables"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-deliverables' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can update service deliverables"
ON storage.objects FOR UPDATE
USING (bucket_id = 'service-deliverables' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins can delete service deliverables"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-deliverables' AND has_role(auth.uid(), 'admin'::app_role));

-- Create service_attachments table
CREATE TABLE public.service_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.client_services(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins and editors can view service attachments"
ON public.service_attachments FOR SELECT
USING (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can insert service attachments"
ON public.service_attachments FOR INSERT
WITH CHECK (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can update service attachments"
ON public.service_attachments FOR UPDATE
USING (has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins can delete service attachments"
ON public.service_attachments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
