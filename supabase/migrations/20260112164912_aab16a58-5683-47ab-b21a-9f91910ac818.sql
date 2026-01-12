-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON public.clients;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Anyone can insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));