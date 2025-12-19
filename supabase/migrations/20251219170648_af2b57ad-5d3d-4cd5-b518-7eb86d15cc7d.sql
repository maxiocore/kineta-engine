-- إنشاء جدول سجل تغييرات الرصيد
CREATE TABLE public.balance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'deposit', 'order', 'refund', 'commission', 'manual_adjustment'
  amount numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  reference_id uuid, -- معرف الإيداع أو الطلب
  reference_type text, -- 'deposit', 'order', 'refund', etc
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid -- من قام بالتغيير (للتعديلات اليدوية)
);

-- تفعيل RLS
ALTER TABLE public.balance_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Admins can manage balance logs"
ON public.balance_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own balance logs"
ON public.balance_logs
FOR SELECT
USING (auth.uid() = user_id);

-- فهرس للبحث السريع
CREATE INDEX idx_balance_logs_user_id ON public.balance_logs(user_id);
CREATE INDEX idx_balance_logs_created_at ON public.balance_logs(created_at DESC);

-- دالة تسجيل تغييرات الرصيد
CREATE OR REPLACE FUNCTION public.log_balance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      action := 'order';
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
$$;

-- إنشاء الـ trigger
CREATE TRIGGER on_balance_change
  AFTER INSERT OR UPDATE ON public.user_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_balance_change();