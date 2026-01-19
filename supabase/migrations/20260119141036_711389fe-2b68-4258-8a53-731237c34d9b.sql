-- Helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.has_admin_or_editor_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Update SELECT policies to include editor role
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
CREATE POLICY "Admins and editors can view all clients" ON public.clients
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all services" ON public.client_services;
CREATE POLICY "Admins and editors can view all services" ON public.client_services
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all service dates" ON public.service_dates;
CREATE POLICY "Admins and editors can view all service dates" ON public.service_dates
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all documents" ON public.client_documents;
CREATE POLICY "Admins and editors can view all documents" ON public.client_documents
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all interactions" ON public.client_interactions;
CREATE POLICY "Admins and editors can view all interactions" ON public.client_interactions
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view submissions" ON public.public_submissions;
CREATE POLICY "Admins and editors can view submissions" ON public.public_submissions
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all logs" ON public.audit_logs;
CREATE POLICY "Admins and editors can view all logs" ON public.audit_logs
FOR SELECT USING (has_admin_or_editor_role(auth.uid()));

-- Update INSERT policies to include editor role
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
CREATE POLICY "Admins and editors can insert clients" ON public.clients
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert services" ON public.client_services;
CREATE POLICY "Admins and editors can insert services" ON public.client_services
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert service dates" ON public.service_dates;
CREATE POLICY "Admins and editors can insert service dates" ON public.service_dates
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert documents" ON public.client_documents;
CREATE POLICY "Admins and editors can insert documents" ON public.client_documents
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert interactions" ON public.client_interactions;
CREATE POLICY "Admins and editors can insert interactions" ON public.client_interactions
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert logs" ON public.audit_logs;
CREATE POLICY "Admins and editors can insert logs" ON public.audit_logs
FOR INSERT WITH CHECK (has_admin_or_editor_role(auth.uid()));

-- Update UPDATE policies to include editor role
DROP POLICY IF EXISTS "Admins can update all clients" ON public.clients;
CREATE POLICY "Admins and editors can update all clients" ON public.clients
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update services" ON public.client_services;
CREATE POLICY "Admins and editors can update services" ON public.client_services
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update service dates" ON public.service_dates;
CREATE POLICY "Admins and editors can update service dates" ON public.service_dates
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update documents" ON public.client_documents;
CREATE POLICY "Admins and editors can update documents" ON public.client_documents
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update interactions" ON public.client_interactions;
CREATE POLICY "Admins and editors can update interactions" ON public.client_interactions
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update submissions" ON public.public_submissions;
CREATE POLICY "Admins and editors can update submissions" ON public.public_submissions
FOR UPDATE USING (has_admin_or_editor_role(auth.uid()));

-- DELETE policies remain admin-only (no changes needed)