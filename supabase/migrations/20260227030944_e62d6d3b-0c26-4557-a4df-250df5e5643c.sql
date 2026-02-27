
-- Fix 1: withdraw_cashback RPC - use auth.uid() instead of p_user_id parameter
CREATE OR REPLACE FUNCTION public.withdraw_cashback(p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  current_cashback NUMERIC;
  result JSONB;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get current cashback balance
  SELECT cashback_balance INTO current_cashback
  FROM public.user_cashback
  WHERE user_id = v_user_id;
  
  IF current_cashback IS NULL OR current_cashback < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient cashback balance');
  END IF;
  
  -- Deduct from cashback
  UPDATE public.user_cashback
  SET 
    cashback_balance = cashback_balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  -- Add to main balance
  UPDATE public.user_balances
  SET 
    balance = balance + p_amount,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  -- Record transaction
  INSERT INTO public.cashback_transactions (user_id, amount, type, description, description_ar)
  VALUES (
    v_user_id,
    -p_amount,
    'withdrawn',
    'Cashback withdrawn to main balance',
    'سحب كاش باك إلى الرصيد الرئيسي'
  );
  
  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$function$;

-- Fix 2: Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 3: Make sensitive storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('ticket-attachments', 'financing-documents', 'payment-receipts');
