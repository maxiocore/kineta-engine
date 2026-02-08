
-- Create SMS verifications table
CREATE TABLE public.sms_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts_count INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- No direct client access - only edge functions with service role key
-- Create index for fast lookups
CREATE INDEX idx_sms_verifications_phone_status ON public.sms_verifications (phone, status);
CREATE INDEX idx_sms_verifications_created_at ON public.sms_verifications (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_sms_verifications_updated_at
  BEFORE UPDATE ON public.sms_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
