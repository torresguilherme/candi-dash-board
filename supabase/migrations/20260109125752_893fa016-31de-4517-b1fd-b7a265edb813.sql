-- Complete remaining storage policy fixes
-- Drop and recreate storage policies if they already exist with different conditions

-- For client-photos bucket - check if policies exist and create only if needed
DO $$
BEGIN
    -- Try to create client-photos policies (may fail if they exist)
    BEGIN
        CREATE POLICY "Admins can view all client photos"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'client-photos' AND has_role(auth.uid(), 'admin'::app_role));
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        CREATE POLICY "Admins can upload client photos"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'client-photos' AND has_role(auth.uid(), 'admin'::app_role));
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        CREATE POLICY "Admins can update client photos"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'client-photos' AND has_role(auth.uid(), 'admin'::app_role));
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        CREATE POLICY "Admins can delete client photos"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'client-photos' AND has_role(auth.uid(), 'admin'::app_role));
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END;
$$;

-- Ensure client-photos bucket exists (create if missing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;