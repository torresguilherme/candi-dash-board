-- Adicionar campos de data de entrega na tabela client_services
ALTER TABLE public.client_services 
ADD COLUMN IF NOT EXISTS scheduled_date date,
ADD COLUMN IF NOT EXISTS delivered_date date;

-- Comentários para documentação
COMMENT ON COLUMN public.client_services.scheduled_date IS 'Data prevista para entrega do serviço';
COMMENT ON COLUMN public.client_services.delivered_date IS 'Data em que o serviço foi entregue';

-- Criar índice para buscar serviços pendentes por data
CREATE INDEX IF NOT EXISTS idx_client_services_scheduled_date 
ON public.client_services(scheduled_date) 
WHERE delivered_date IS NULL;