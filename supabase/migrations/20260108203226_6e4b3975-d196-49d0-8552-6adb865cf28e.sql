-- Drop existing tables to rebuild with new structure
DROP TABLE IF EXISTS public.candidate_meetings CASCADE;
DROP TABLE IF EXISTS public.candidate_documents CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;

-- Create clients table with all personal and contract info
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  address TEXT,
  email TEXT NOT NULL,
  rg TEXT,
  cpf TEXT,
  photo_url TEXT,
  education TEXT,
  area_of_interest TEXT,
  region TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  phone TEXT,
  
  -- Contract Info
  contract_number TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value DECIMAL(10, 2),
  payment_method TEXT, -- 'cash', 'installments'
  installments_count INTEGER,
  installments_due_date DATE,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'Novo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracted services table
CREATE TABLE public.client_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service dates table (for multiple dates per service)
CREATE TABLE public.service_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.client_services(id) ON DELETE CASCADE,
  date_type TEXT NOT NULL, -- 'scheduled', 'rescheduled', 'delivered', 'meeting'
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client documents table
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Anyone can insert clients" ON public.clients
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all clients" ON public.clients
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all clients" ON public.clients
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all clients" ON public.clients
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Client services policies
CREATE POLICY "Admins can view all services" ON public.client_services
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert services" ON public.client_services
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update services" ON public.client_services
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete services" ON public.client_services
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Service dates policies
CREATE POLICY "Admins can view all service dates" ON public.service_dates
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert service dates" ON public.service_dates
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service dates" ON public.service_dates
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service dates" ON public.service_dates
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Client documents policies
CREATE POLICY "Admins can view all documents" ON public.client_documents
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert documents" ON public.client_documents
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents" ON public.client_documents
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documents" ON public.client_documents
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client photos
CREATE POLICY "Anyone can upload client photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'client-photos');

CREATE POLICY "Anyone can view client photos" ON storage.objects
FOR SELECT USING (bucket_id = 'client-photos');