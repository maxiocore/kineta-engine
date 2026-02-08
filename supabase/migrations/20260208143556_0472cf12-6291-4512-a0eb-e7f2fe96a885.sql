-- Add deduplication and provider tracking columns to sms_logs
ALTER TABLE public.sms_logs 
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'msegat',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Create unique index on idempotency_key for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_logs_idempotency_key 
  ON public.sms_logs (idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Create index for faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_sms_logs_reference_type 
  ON public.sms_logs (reference_id, type)
  WHERE reference_id IS NOT NULL;