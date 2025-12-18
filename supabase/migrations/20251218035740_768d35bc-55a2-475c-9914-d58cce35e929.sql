-- Create API keys table for User API
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default API Key',
  prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(prefix)
);

-- API usage logs
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  type TEXT NOT NULL, -- 'manual', 'automatic'
  provider TEXT, -- 'stripe', 'paypal', etc.
  instructions TEXT,
  instructions_ar TEXT,
  extra_fee_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed'
  extra_fee_value NUMERIC DEFAULT 0,
  min_amount NUMERIC DEFAULT 0,
  max_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment bonuses table
CREATE TABLE public.payment_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC,
  bonus_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  bonus_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deposits/Payments table
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  bonus_amount NUMERIC DEFAULT 0,
  total_credited NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User balance table
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_deposited NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Refill requests table
CREATE TABLE public.refill_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_quantity INTEGER NOT NULL,
  current_quantity INTEGER,
  refill_quantity INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  auto_created BOOLEAN DEFAULT false,
  external_refill_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Add refill settings to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS refill_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refill_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS auto_refill_enabled BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON public.api_keys
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all API keys" ON public.api_keys
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for api_usage_logs
CREATE POLICY "Users can view their own API logs" ON public.api_usage_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.id = api_usage_logs.api_key_id 
    AND api_keys.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all API logs" ON public.api_usage_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_methods
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_bonuses
CREATE POLICY "Anyone can view active payment bonuses" ON public.payment_bonuses
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment bonuses" ON public.payment_bonuses
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for deposits
CREATE POLICY "Users can view their own deposits" ON public.deposits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.deposits
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits" ON public.deposits
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_balances
CREATE POLICY "Users can view their own balance" ON public.user_balances
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all balances" ON public.user_balances
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for refill_requests
CREATE POLICY "Users can view their own refill requests" ON public.refill_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create refill requests" ON public.refill_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all refill requests" ON public.refill_requests
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create function to initialize user balance
CREATE OR REPLACE FUNCTION public.init_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create balance on user creation
CREATE TRIGGER on_auth_user_created_init_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.init_user_balance();

-- Function to update user balance after deposit completion
CREATE OR REPLACE FUNCTION public.update_balance_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.user_balances (user_id, balance, total_deposited)
    VALUES (NEW.user_id, NEW.total_credited, NEW.total_credited)
    ON CONFLICT (user_id) DO UPDATE 
    SET 
      balance = user_balances.balance + NEW.total_credited,
      total_deposited = user_balances.total_deposited + NEW.total_credited,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_deposit_completed
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_balance_on_deposit();