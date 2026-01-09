-- Create email verification table for OTP-based verification
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'financing_eligibility',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'expired', 'locked')),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create verification attempts log for audit trail
CREATE TABLE public.email_verification_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.email_verifications(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  input_otp_hash TEXT NOT NULL,
  is_success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disposable email domains table
CREATE TABLE public.disposable_email_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert common disposable email domains
INSERT INTO public.disposable_email_domains (domain) VALUES
  ('tempmail.com'),
  ('throwaway.email'),
  ('guerrillamail.com'),
  ('10minutemail.com'),
  ('mailinator.com'),
  ('temp-mail.org'),
  ('fakemailgenerator.com'),
  ('getnada.com'),
  ('trashmail.com'),
  ('yopmail.com'),
  ('mohmal.com'),
  ('maildrop.cc'),
  ('dispostable.com'),
  ('mintemail.com'),
  ('sharklasers.com'),
  ('tempail.com'),
  ('emailondeck.com'),
  ('tempr.email'),
  ('spamgourmet.com'),
  ('mailnesia.com');

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_verifications
CREATE POLICY "Users can view their own verifications"
  ON public.email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
  ON public.email_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications"
  ON public.email_verifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for email_verification_attempts
CREATE POLICY "Users can view their own attempts"
  ON public.email_verification_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_verifications ev
      WHERE ev.id = verification_id AND ev.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attempts for their verifications"
  ON public.email_verification_attempts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_verifications ev
      WHERE ev.id = verification_id AND ev.user_id = auth.uid()
    )
  );

-- Disposable domains are public read-only
CREATE POLICY "Anyone can read disposable domains"
  ON public.disposable_email_domains
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_status ON public.email_verifications(status);
CREATE INDEX idx_email_verifications_purpose ON public.email_verifications(purpose);
CREATE INDEX idx_email_verification_attempts_verification_id ON public.email_verification_attempts(verification_id);
CREATE INDEX idx_disposable_email_domains_domain ON public.disposable_email_domains(domain);

-- Function to update timestamps
CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();