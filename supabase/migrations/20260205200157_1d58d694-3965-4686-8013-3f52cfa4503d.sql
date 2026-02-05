-- Make the resumes bucket private to prevent public access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';