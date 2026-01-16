-- Change installments_due_date from date to integer to store the day of month
-- First, drop the existing column and recreate as integer
ALTER TABLE public.clients 
  DROP COLUMN IF EXISTS installments_due_date,
  ADD COLUMN installments_due_day integer;