-- Create new private bucket for admin-managed client resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-resumes', 'client-resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Admin/editor-only policies for private bucket
CREATE POLICY "Admins and editors can upload client resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-resumes' 
  AND public.has_admin_or_editor_role(auth.uid())
);

CREATE POLICY "Admins and editors can view client resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-resumes' 
  AND public.has_admin_or_editor_role(auth.uid())
);

CREATE POLICY "Admins and editors can update client resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-resumes' 
  AND public.has_admin_or_editor_role(auth.uid())
);

CREATE POLICY "Admins can delete client resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-resumes' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);