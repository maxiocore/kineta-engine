-- Add additional columns for financial compliance
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS geo_country TEXT,
ADD COLUMN IF NOT EXISTS geo_city TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS verification_step TEXT,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_verification_step ON public.audit_logs(verification_step);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_suspicious ON public.audit_logs(is_suspicious) WHERE is_suspicious = true;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Create immutable audit log policies (NO DELETE, NO UPDATE allowed)
-- Anyone authenticated can INSERT (for logging purposes)
CREATE POLICY "Anyone can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- NO UPDATE policy - logs are immutable
-- NO DELETE policy - logs cannot be deleted

-- Create eligibility audit table for detailed step tracking
CREATE TABLE IF NOT EXISTS public.eligibility_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.financing_applications(id) ON DELETE SET NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  geo_country TEXT,
  geo_city TEXT,
  risk_signals JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on eligibility audit logs
ALTER TABLE public.eligibility_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for eligibility audit logs (immutable)
CREATE POLICY "Anyone can insert eligibility audit logs"
ON public.eligibility_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view eligibility audit logs"
ON public.eligibility_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own eligibility audit logs"
ON public.eligibility_audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- NO UPDATE or DELETE policies - logs are immutable

-- Create verification attempts audit table
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  verification_target TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  input_hash TEXT,
  result_code TEXT,
  result_message TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  geo_country TEXT,
  geo_city TEXT,
  is_suspicious BOOLEAN DEFAULT false,
  fraud_signals JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on verification audit logs
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for verification audit logs (immutable)
CREATE POLICY "Anyone can insert verification audit logs"
ON public.verification_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view verification audit logs"
ON public.verification_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own verification audit logs"
ON public.verification_audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- NO UPDATE or DELETE policies - logs are immutable

-- Create indexes for verification audit logs
CREATE INDEX idx_verification_audit_user_id ON public.verification_audit_logs(user_id);
CREATE INDEX idx_verification_audit_session_id ON public.verification_audit_logs(session_id);
CREATE INDEX idx_verification_audit_type ON public.verification_audit_logs(verification_type);
CREATE INDEX idx_verification_audit_status ON public.verification_audit_logs(status);
CREATE INDEX idx_verification_audit_created_at ON public.verification_audit_logs(created_at DESC);
CREATE INDEX idx_verification_audit_suspicious ON public.verification_audit_logs(is_suspicious) WHERE is_suspicious = true;

-- Create indexes for eligibility audit logs
CREATE INDEX idx_eligibility_audit_user_id ON public.eligibility_audit_logs(user_id);
CREATE INDEX idx_eligibility_audit_session_id ON public.eligibility_audit_logs(session_id);
CREATE INDEX idx_eligibility_audit_application_id ON public.eligibility_audit_logs(application_id);
CREATE INDEX idx_eligibility_audit_step_name ON public.eligibility_audit_logs(step_name);
CREATE INDEX idx_eligibility_audit_created_at ON public.eligibility_audit_logs(created_at DESC);

-- Enable realtime for audit monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.eligibility_audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_audit_logs;