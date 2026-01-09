-- Email Queue and Idempotency System for Financing Notifications
-- حذف الجداول القديمة إذا وجدت (من محاولة سابقة)
DROP TABLE IF EXISTS public.financing_email_logs CASCADE;
DROP TABLE IF EXISTS public.email_rate_limits CASCADE;
DROP TABLE IF EXISTS public.financing_email_queue CASCADE;

-- جدول قائمة انتظار الإيميلات مع Idempotency
CREATE TABLE public.financing_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Idempotency key: applicationId + status combination
  idempotency_key TEXT NOT NULL UNIQUE,
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  application_number TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_amount NUMERIC,
  
  -- Queue status
  queue_status TEXT NOT NULL DEFAULT 'pending' CHECK (queue_status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  
  -- Retry handling
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  
  -- Rate limiting
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Logging
  resend_id TEXT,
  response_data JSONB
);

-- Index for efficient queue processing
CREATE INDEX idx_financing_email_queue_status ON public.financing_email_queue(queue_status, next_retry_at, priority);
CREATE INDEX idx_financing_email_queue_application ON public.financing_email_queue(application_id, status);
CREATE INDEX idx_financing_email_queue_idempotency ON public.financing_email_queue(idempotency_key);

-- Rate limiting table
CREATE TABLE public.email_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_count INTEGER NOT NULL DEFAULT 0,
  last_email_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_email_window UNIQUE (email_address, window_start)
);

CREATE INDEX idx_email_rate_limits_email ON public.email_rate_limits(email_address, window_start);

-- Email sending logs for detailed tracking
CREATE TABLE public.financing_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID REFERENCES public.financing_email_queue(id) ON DELETE SET NULL,
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  
  -- Email details
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- financing status
  
  -- Result
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'skipped', 'rate_limited')),
  error_message TEXT,
  error_code TEXT,
  
  -- Metadata
  resend_id TEXT,
  response_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_financing_email_logs_application ON public.financing_email_logs(application_id);
CREATE INDEX idx_financing_email_logs_result ON public.financing_email_logs(result, created_at);

-- Enable RLS
ALTER TABLE public.financing_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access (using user_roles table)
CREATE POLICY "Admins can view email queue"
  ON public.financing_email_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage email queue"
  ON public.financing_email_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view rate limits"
  ON public.email_rate_limits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view email logs"
  ON public.financing_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON public.financing_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_applications fa
      WHERE fa.id = financing_email_logs.application_id
      AND fa.user_id = auth.uid()
    )
  );

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_email_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_email TEXT,
  p_max_per_hour INTEGER DEFAULT 5,
  p_max_per_day INTEGER DEFAULT 20
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
BEGIN
  -- Count emails in last hour
  SELECT COALESCE(SUM(email_count), 0) INTO v_hourly_count
  FROM public.email_rate_limits
  WHERE email_address = p_email
  AND window_start >= now() - interval '1 hour';
  
  -- Count emails in last 24 hours
  SELECT COALESCE(SUM(email_count), 0) INTO v_daily_count
  FROM public.email_rate_limits
  WHERE email_address = p_email
  AND window_start >= now() - interval '24 hours';
  
  -- Check limits
  IF v_hourly_count >= p_max_per_hour OR v_daily_count >= p_max_per_day THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to increment rate limit counter
CREATE OR REPLACE FUNCTION public.increment_email_rate_limit(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Use hourly windows
  v_window_start := date_trunc('hour', now());
  
  INSERT INTO public.email_rate_limits (email_address, window_start, email_count, last_email_at)
  VALUES (p_email, v_window_start, 1, now())
  ON CONFLICT (email_address, window_start)
  DO UPDATE SET 
    email_count = email_rate_limits.email_count + 1,
    last_email_at = now();
END;
$$;