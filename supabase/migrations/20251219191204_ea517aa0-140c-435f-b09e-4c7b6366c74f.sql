-- Create user_cashback table to store cashback balances
CREATE TABLE public.user_cashback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cashback_balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashback_transactions table for transaction history
CREATE TABLE public.cashback_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'earned', -- earned, withdrawn
  description TEXT,
  description_ar TEXT,
  reference_id UUID, -- deposit_id or withdrawal reference
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashback_settings table for admin configuration
CREATE TABLE public.cashback_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cashback_percentage NUMERIC NOT NULL DEFAULT 5,
  min_deposit_amount NUMERIC NOT NULL DEFAULT 0,
  max_cashback_amount NUMERIC, -- NULL means no limit
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default cashback settings
INSERT INTO public.cashback_settings (cashback_percentage, min_deposit_amount, is_active)
VALUES (5, 0, true);

-- Enable RLS
ALTER TABLE public.user_cashback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_cashback
CREATE POLICY "Users can view their own cashback"
ON public.user_cashback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cashback"
ON public.user_cashback FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for cashback_transactions
CREATE POLICY "Users can view their own cashback transactions"
ON public.cashback_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cashback transactions"
ON public.cashback_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for cashback_settings
CREATE POLICY "Anyone can view active cashback settings"
ON public.cashback_settings FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage cashback settings"
ON public.cashback_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to initialize user cashback on user creation
CREATE OR REPLACE FUNCTION public.init_user_cashback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_cashback (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to initialize cashback for new users
CREATE TRIGGER on_user_created_init_cashback
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.init_user_cashback();

-- Function to award cashback on deposit completion
CREATE OR REPLACE FUNCTION public.award_cashback_on_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_record RECORD;
  cashback_amount NUMERIC;
BEGIN
  -- Only process when deposit is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get cashback settings
    SELECT * INTO settings_record FROM public.cashback_settings WHERE is_active = true LIMIT 1;
    
    IF FOUND AND settings_record.cashback_percentage > 0 THEN
      -- Check minimum deposit amount
      IF NEW.amount >= settings_record.min_deposit_amount THEN
        -- Calculate cashback
        cashback_amount := NEW.amount * (settings_record.cashback_percentage / 100);
        
        -- Apply max cashback limit if set
        IF settings_record.max_cashback_amount IS NOT NULL AND cashback_amount > settings_record.max_cashback_amount THEN
          cashback_amount := settings_record.max_cashback_amount;
        END IF;
        
        -- Insert or update user cashback
        INSERT INTO public.user_cashback (user_id, cashback_balance, total_earned)
        VALUES (NEW.user_id, cashback_amount, cashback_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
          cashback_balance = user_cashback.cashback_balance + cashback_amount,
          total_earned = user_cashback.total_earned + cashback_amount,
          updated_at = now();
        
        -- Record transaction
        INSERT INTO public.cashback_transactions (user_id, amount, type, description, description_ar, reference_id)
        VALUES (
          NEW.user_id,
          cashback_amount,
          'earned',
          'Cashback from deposit of $' || NEW.amount,
          'كاش باك من شحن رصيد بقيمة $' || NEW.amount,
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for automatic cashback on deposit
CREATE TRIGGER on_deposit_award_cashback
AFTER UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.award_cashback_on_deposit();

-- Function to withdraw cashback to main balance
CREATE OR REPLACE FUNCTION public.withdraw_cashback(p_user_id UUID, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_cashback NUMERIC;
  result JSONB;
BEGIN
  -- Get current cashback balance
  SELECT cashback_balance INTO current_cashback
  FROM public.user_cashback
  WHERE user_id = p_user_id;
  
  IF current_cashback IS NULL OR current_cashback < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient cashback balance');
  END IF;
  
  -- Deduct from cashback
  UPDATE public.user_cashback
  SET 
    cashback_balance = cashback_balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Add to main balance
  UPDATE public.user_balances
  SET 
    balance = balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.cashback_transactions (user_id, amount, type, description, description_ar)
  VALUES (
    p_user_id,
    -p_amount,
    'withdrawn',
    'Cashback withdrawn to main balance',
    'سحب كاش باك إلى الرصيد الرئيسي'
  );
  
  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;