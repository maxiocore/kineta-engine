
-- Add unique wallet account number to user_balances
ALTER TABLE public.user_balances 
ADD COLUMN IF NOT EXISTS wallet_account_number TEXT UNIQUE;

-- Create function to generate unique ASH wallet account number
CREATE OR REPLACE FUNCTION public.generate_wallet_account_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    new_number := 'ASH-' || LPAD(FLOOR(RANDOM() * 999999 + 100000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.user_balances WHERE wallet_account_number = new_number;
    EXIT WHEN exists_count = 0;
  END LOOP;
  NEW.wallet_account_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate wallet account number on insert
DROP TRIGGER IF EXISTS set_wallet_account_number ON public.user_balances;
CREATE TRIGGER set_wallet_account_number
BEFORE INSERT ON public.user_balances
FOR EACH ROW
WHEN (NEW.wallet_account_number IS NULL)
EXECUTE FUNCTION public.generate_wallet_account_number();

-- Generate account numbers for existing users that don't have one
DO $$
DECLARE
  rec RECORD;
  new_number TEXT;
  exists_count INTEGER;
BEGIN
  FOR rec IN SELECT id FROM public.user_balances WHERE wallet_account_number IS NULL
  LOOP
    LOOP
      new_number := 'ASH-' || LPAD(FLOOR(RANDOM() * 999999 + 100000)::TEXT, 6, '0');
      SELECT COUNT(*) INTO exists_count FROM public.user_balances WHERE wallet_account_number = new_number;
      EXIT WHEN exists_count = 0;
    END LOOP;
    UPDATE public.user_balances SET wallet_account_number = new_number WHERE id = rec.id;
  END LOOP;
END $$;

-- Create external deposits table for tracking ASH Holdings deposits
CREATE TABLE public.external_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_account_number TEXT NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL DEFAULT 'ash_holdings',
  external_transaction_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own external deposits
CREATE POLICY "Users can view their own external deposits"
ON public.external_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Enable realtime for external_deposits
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_deposits;

-- Create indexes
CREATE INDEX idx_external_deposits_wallet ON public.external_deposits(wallet_account_number);
CREATE INDEX idx_external_deposits_user ON public.external_deposits(user_id);
CREATE INDEX idx_user_balances_wallet_number ON public.user_balances(wallet_account_number);
