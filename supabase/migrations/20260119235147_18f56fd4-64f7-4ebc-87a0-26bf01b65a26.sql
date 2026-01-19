-- Create table for WhatsApp verifications
CREATE TABLE IF NOT EXISTS public.whatsapp_verifications (
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

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_phone ON public.whatsapp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_status ON public.whatsapp_verifications(status);

-- Enable RLS
ALTER TABLE public.whatsapp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access" ON public.whatsapp_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_verifications_updated_at
  BEFORE UPDATE ON public.whatsapp_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();