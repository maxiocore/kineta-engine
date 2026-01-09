-- Create KYC Verifications table for identity verification records
CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  national_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASSED', 'FAILED', 'EXPIRED', 'DUPLICATE')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_data JSONB,
  failure_reasons TEXT[],
  ocr_confidence NUMERIC(4,3),
  liveness_score NUMERIC(4,3),
  face_match_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can create own KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending verifications
CREATE POLICY "Users can update own pending KYC"
  ON public.kyc_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'PENDING');

-- Create index for duplicate checking
CREATE INDEX idx_kyc_national_id ON public.kyc_verifications(national_id);
CREATE INDEX idx_kyc_user_status ON public.kyc_verifications(user_id, status);

-- Update timestamp trigger
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();