-- Create fraud detection tables

-- Device fingerprints table
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  fingerprint_hash TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  geo_country TEXT,
  geo_city TEXT,
  is_vpn BOOLEAN DEFAULT false,
  is_proxy BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applications_count INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Identity verification attempts (to detect duplicates)
CREATE TABLE public.identity_verification_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  national_id_hash TEXT NOT NULL,
  face_embedding_hash TEXT,
  id_document_hash TEXT,
  device_fingerprint_id UUID REFERENCES public.device_fingerprints(id),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  match_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fraud signals table
CREATE TABLE public.fraud_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  signal_type TEXT NOT NULL,
  signal_category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  description TEXT,
  description_ar TEXT,
  metadata JSONB DEFAULT '{}',
  is_confirmed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate limiting table
CREATE TABLE public.rate_limit_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blacklists table
CREATE TABLE public.fraud_blacklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_type TEXT NOT NULL,
  value_hash TEXT NOT NULL,
  reason TEXT,
  reason_ar TEXT,
  added_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_type, value_hash)
);

-- Create indexes for performance
CREATE INDEX idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_ip ON public.device_fingerprints(ip_address);
CREATE INDEX idx_device_fingerprints_user ON public.device_fingerprints(user_id);

CREATE INDEX idx_identity_records_national_id ON public.identity_verification_records(national_id_hash);
CREATE INDEX idx_identity_records_face ON public.identity_verification_records(face_embedding_hash);
CREATE INDEX idx_identity_records_user ON public.identity_verification_records(user_id);

CREATE INDEX idx_fraud_signals_user ON public.fraud_signals(user_id);
CREATE INDEX idx_fraud_signals_type ON public.fraud_signals(signal_type);
CREATE INDEX idx_fraud_signals_created ON public.fraud_signals(created_at DESC);

CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_records(identifier, identifier_type, action_type);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_records(window_start);

CREATE INDEX idx_blacklist_type_value ON public.fraud_blacklists(list_type, value_hash) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_blacklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only view their own data
CREATE POLICY "Users can view own fingerprints"
  ON public.device_fingerprints
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert fingerprints"
  ON public.device_fingerprints
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own identity records"
  ON public.identity_verification_records
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert identity records"
  ON public.identity_verification_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own fraud signals"
  ON public.fraud_signals
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert fraud signals"
  ON public.fraud_signals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can manage rate limits"
  ON public.rate_limit_records
  FOR ALL
  USING (true);

CREATE POLICY "System can read blacklists"
  ON public.fraud_blacklists
  FOR SELECT
  USING (true);