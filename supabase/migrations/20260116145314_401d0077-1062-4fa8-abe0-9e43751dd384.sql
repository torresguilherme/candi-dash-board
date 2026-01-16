-- 1. Fix: Update handle_new_user to assign 'user' role by default (not admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Assign 'user' role by default instead of 'admin'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix: Make candidate-documents bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'candidate-documents';

-- 3. Fix: Remove public insert policy on clients table
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;

-- Create admin-only insert policy for clients
CREATE POLICY "Admins can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));