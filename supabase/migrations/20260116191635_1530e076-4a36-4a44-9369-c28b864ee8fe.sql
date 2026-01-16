-- Add policy to allow anyone to view resumes in the public bucket
-- Since the bucket is public, this enables access via public URLs

DROP POLICY IF EXISTS "Anyone can view resumes in public bucket" ON storage.objects;

CREATE POLICY "Anyone can view resumes in public bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resumes');