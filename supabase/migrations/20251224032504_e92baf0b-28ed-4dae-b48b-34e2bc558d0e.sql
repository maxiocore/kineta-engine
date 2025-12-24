-- Update log_balance_change trigger to skip order-related changes since we now log them manually with reference_id
CREATE OR REPLACE FUNCTION public.log_balance_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  action text;
  change_amount numeric;
BEGIN
  -- تحديد نوع العملية والمبلغ
  IF TG_OP = 'INSERT' THEN
    action := 'initial';
    change_amount := NEW.balance;
    
    INSERT INTO public.balance_logs (user_id, action_type, amount, balance_before, balance_after, notes)
    VALUES (NEW.user_id, action, change_amount, 0, NEW.balance, 'إنشاء رصيد جديد');
    
  ELSIF TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance THEN
    change_amount := NEW.balance - OLD.balance;
    
    -- تحديد نوع العملية بناءً على التغيير
    IF NEW.total_deposited > OLD.total_deposited THEN
      action := 'deposit';
    ELSIF NEW.total_spent > OLD.total_spent THEN
      -- Skip logging order-related changes here since we log them manually with reference_id
      -- This prevents duplicate entries
      RETURN NEW;
    ELSIF change_amount > 0 THEN
      action := 'credit';
    ELSE
      action := 'debit';
    END IF;
    
    INSERT INTO public.balance_logs (user_id, action_type, amount, balance_before, balance_after)
    VALUES (NEW.user_id, action, change_amount, OLD.balance, NEW.balance);
  END IF;
  
  RETURN NEW;
END;
$function$;