-- Add metadata column to service_credit_transactions table
ALTER TABLE public.service_credit_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.service_credit_transactions.metadata IS 'Additional metadata for the transaction (event type, idempotency key, etc.)';