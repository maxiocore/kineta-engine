-- Create provider balance logs table
CREATE TABLE public.provider_balance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.api_providers(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_cost NUMERIC,
  action_type TEXT NOT NULL DEFAULT 'balance_check', -- balance_check, order_placed, order_refunded
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_balance_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage logs
CREATE POLICY "Admins can manage provider balance logs"
  ON public.provider_balance_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_provider_balance_logs_provider_id ON public.provider_balance_logs(provider_id);
CREATE INDEX idx_provider_balance_logs_created_at ON public.provider_balance_logs(created_at DESC);