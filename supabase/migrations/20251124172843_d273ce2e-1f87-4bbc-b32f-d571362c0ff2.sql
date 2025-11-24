-- Allow public inserts for candidates (for public candidate registration)
CREATE POLICY "Anyone can insert candidates"
  ON public.candidates FOR INSERT
  WITH CHECK (true);

-- Update storage policy to allow public uploads
CREATE POLICY "Anyone can upload resumes to public folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = 'public'
  );