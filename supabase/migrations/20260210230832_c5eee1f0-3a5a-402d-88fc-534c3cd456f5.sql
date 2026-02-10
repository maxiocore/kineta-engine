
-- Create finance webhook events log table
CREATE TABLE public.finance_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finance_request_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB,
  signature_valid BOOLEAN DEFAULT true,
  ip_address TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_webhook_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read access using existing has_role function
CREATE POLICY "Admins can view finance webhook events"
  ON public.finance_webhook_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_finance_webhook_finance_request_id ON public.finance_webhook_events(finance_request_id);
CREATE INDEX idx_finance_webhook_created_at ON public.finance_webhook_events(created_at DESC);
