
-- Drop admin-only policies for candidate-documents that are too restrictive
DROP POLICY IF EXISTS "Admins can upload candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Create new policies that allow both admins and editors
CREATE POLICY "Admins and editors can upload candidate documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-documents' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can view candidate documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-documents' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins and editors can update candidate documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'candidate-documents' AND has_admin_or_editor_role(auth.uid()));

CREATE POLICY "Admins can delete candidate documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'candidate-documents' AND has_role(auth.uid(), 'admin'::app_role));
