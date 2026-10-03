-- Rollback for migration "wallet payment engine" (2026-10-03).
-- Restores the previous browser-side wallet permissions and legacy triggers.
-- WARNING: running this re-opens the CRITICAL wallet self-edit vulnerability.
-- Ledger rows written by the new engine are NOT deleted (financial audit trail).

DROP TRIGGER IF EXISTS balance_logs_immutable ON public.balance_logs;
DROP FUNCTION IF EXISTS public.balance_logs_guard();
DROP FUNCTION IF EXISTS public.pay_service_order(uuid, integer, text, text, text, text);
DROP FUNCTION IF EXISTS public.pay_design_order(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.pay_dev_invoice(uuid, text);
DROP FUNCTION IF EXISTS public.redeem_points_to_wallet(integer, text);
DROP FUNCTION IF EXISTS public.admin_adjust_wallet(uuid, text, numeric, text, text);
DROP FUNCTION IF EXISTS public.admin_refund_wallet_transaction(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public._wallet_post(uuid, numeric, text, text, uuid, text, text, uuid, uuid, boolean);

GRANT INSERT, UPDATE, DELETE ON public.user_balances TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.balance_logs TO authenticated;

DROP POLICY IF EXISTS "Admins can view all balances" ON public.user_balances;
CREATE POLICY "Admins can manage all balances" ON public.user_balances FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own balance" ON public.user_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own balance" ON public.user_balances FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view balance logs" ON public.balance_logs;
CREATE POLICY "Admins can manage balance logs" ON public.balance_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own order invoices for payment" ON public.dev_order_invoices FOR UPDATE
  USING (EXISTS (SELECT 1 FROM dev_orders WHERE dev_orders.id = dev_order_invoices.order_id AND dev_orders.user_id = auth.uid()));
CREATE POLICY "Users can update their own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own redemption transactions" ON public.points_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND type = 'redeemed');
CREATE POLICY "Users can create usages" ON public.coupon_usages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Legacy log_balance_change (no ledger flag)
CREATE OR REPLACE FUNCTION public.log_balance_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE action text; change_amount numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.balance_logs (user_id, action_type, amount, balance_before, balance_after, notes)
    VALUES (NEW.user_id, 'initial', NEW.balance, 0, NEW.balance, 'إنشاء رصيد جديد');
  ELSIF TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance THEN
    change_amount := NEW.balance - OLD.balance;
    IF NEW.total_deposited > OLD.total_deposited THEN action := 'deposit';
    ELSIF NEW.total_spent > OLD.total_spent THEN RETURN NEW;
    ELSIF change_amount > 0 THEN action := 'credit';
    ELSE action := 'debit'; END IF;
    INSERT INTO public.balance_logs (user_id, action_type, amount, balance_before, balance_after)
    VALUES (NEW.user_id, action, change_amount, OLD.balance, NEW.balance);
  END IF;
  RETURN NEW;
END; $$;

-- Legacy refund_balance_on_cancel (refunds total_price, deletes original log)
CREATE OR REPLACE FUNCTION public.refund_balance_on_cancel() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.status IN ('cancelled', 'refunded')) AND (OLD.status NOT IN ('cancelled', 'refunded')) THEN
    UPDATE public.user_balances SET balance = balance + NEW.total_price,
      total_spent = GREATEST(0, total_spent - NEW.total_price), updated_at = now() WHERE user_id = NEW.user_id;
    DELETE FROM public.balance_logs WHERE reference_id = NEW.id AND reference_type = 'order' AND action_type = 'order';
    INSERT INTO public.balance_logs (user_id, action_type, amount, balance_before, balance_after, reference_type, reference_id, notes)
    SELECT NEW.user_id, 'refund', NEW.total_price, ub.balance - NEW.total_price, ub.balance, 'order', NEW.id,
      CASE WHEN NEW.status = 'cancelled' THEN 'استرداد الرصيد - إلغاء الطلب رقم ' || NEW.order_number
           ELSE 'استرداد الرصيد - استرجاع الطلب رقم ' || NEW.order_number END
    FROM public.user_balances ub WHERE ub.user_id = NEW.user_id;
    INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
    VALUES (NEW.user_id, 'تم استرداد الرصيد', 'تم استرداد مبلغ $' || NEW.total_price || ' إلى رصيدك بعد ' ||
      CASE WHEN NEW.status = 'cancelled' THEN 'إلغاء' ELSE 'استرجاع' END || ' الطلب رقم ' || NEW.order_number, 'success', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

-- New ledger columns are kept (harmless, preserve audit data):
-- balance_logs.idempotency_key, currency, status, original_log_id
