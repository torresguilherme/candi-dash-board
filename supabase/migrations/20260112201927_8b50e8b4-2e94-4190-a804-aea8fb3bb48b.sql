-- Allow replacing (upsert) and managing resume files in the 'resumes' bucket
-- Upsert requires UPDATE permission when the object already exists.

-- UPDATE policies
DROP POLICY IF EXISTS "Users can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all resumes" ON storage.objects;

CREATE POLICY "Users can update own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can update all resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'resumes'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE policies (optional but useful for cleanup)
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete all resumes" ON storage.objects;

CREATE POLICY "Users can delete own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete all resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);