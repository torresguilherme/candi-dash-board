-- Add contract duration field (in months: 6, 9, or 12)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contract_duration_months integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.clients.contract_duration_months IS 'Contract duration in months (6, 9, or 12)';