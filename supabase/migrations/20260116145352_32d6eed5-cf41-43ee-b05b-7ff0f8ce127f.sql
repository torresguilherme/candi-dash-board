-- Add RLS policies for private candidate-documents bucket
-- Allow admins to upload files
CREATE POLICY "Admins can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to view/download files
CREATE POLICY "Admins can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'candidate-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update files
CREATE POLICY "Admins can update documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'candidate-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'candidate-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);