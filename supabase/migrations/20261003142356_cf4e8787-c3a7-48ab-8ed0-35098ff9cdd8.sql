
CREATE OR REPLACE FUNCTION public._wallet_post(p_user uuid, p_amount numeric, p_action text, p_ref_type text, p_ref_id uuid, p_key text, p_notes text, p_actor uuid, p_original uuid DEFAULT NULL::uuid, p_spend boolean DEFAULT false)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_bal record; v_existing record; v_log uuid; v_after numeric;
BEGIN
  IF p_user IS NULL OR p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  -- SAR amounts must be whole halalas (max 2 decimals). Never round silently.
  IF p_amount <> round(p_amount, 2) THEN RAISE EXCEPTION 'INVALID_AMOUNT_PRECISION'; END IF;
  INSERT INTO public.user_balances(user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_bal FROM public.user_balances WHERE user_id = p_user FOR UPDATE;
  IF p_key IS NOT NULL THEN
    SELECT id, amount, balance_after INTO v_existing FROM public.balance_logs WHERE user_id = p_user AND idempotency_key = p_key;
    IF FOUND THEN
      RETURN jsonb_build_object('duplicate', true, 'log_id', v_existing.id, 'amount', v_existing.amount, 'balance_after', v_existing.balance_after);
    END IF;
  END IF;
  -- Exact decimal arithmetic: the balance moves by exactly p_amount.
  v_after := v_bal.balance + p_amount;
  IF p_amount < 0 AND v_after < 0 THEN RAISE EXCEPTION 'INSUFFICIENT_BALANCE'; END IF;
  PERFORM set_config('app.wallet_ledger', 'on', true);
  UPDATE public.user_balances SET
    balance = v_after,
    total_spent = CASE
      WHEN p_spend AND p_amount < 0 THEN coalesce(total_spent,0) - p_amount
      WHEN p_spend AND p_amount > 0 THEN greatest(0, coalesce(total_spent,0) - p_amount)
      ELSE total_spent END,
    updated_at = now()
  WHERE user_id = p_user;
  PERFORM set_config('app.wallet_ledger', 'off', true);
  INSERT INTO public.balance_logs(user_id, action_type, amount, balance_before, balance_after, reference_type, reference_id,
    notes, created_by, idempotency_key, currency, status, original_log_id)
  VALUES (p_user, p_action, p_amount, v_bal.balance, v_after, p_ref_type, p_ref_id, p_notes, p_actor, p_key, 'SAR', 'succeeded', p_original)
  RETURNING id INTO v_log;
  RETURN jsonb_build_object('duplicate', false, 'log_id', v_log, 'amount', p_amount, 'balance_before', v_bal.balance, 'balance_after', v_after);
END; $function$;

CREATE OR REPLACE FUNCTION public.award_cashback_on_deposit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s record; cb numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    IF EXISTS (SELECT 1 FROM cashback_transactions WHERE reference_id = NEW.id AND type = 'earned') THEN RETURN NEW; END IF;
    SELECT * INTO s FROM cashback_settings WHERE is_active = true LIMIT 1;
    IF FOUND AND s.cashback_percentage > 0 AND NEW.amount >= s.min_deposit_amount THEN
      cb := round(NEW.amount * s.cashback_percentage / 100, 2);
      IF s.max_cashback_amount IS NOT NULL AND cb > s.max_cashback_amount THEN cb := round(s.max_cashback_amount, 2); END IF;
      IF cb <= 0 THEN RETURN NEW; END IF;
      INSERT INTO user_cashback (user_id, cashback_balance, total_earned) VALUES (NEW.user_id, cb, cb)
      ON CONFLICT (user_id) DO UPDATE SET cashback_balance = user_cashback.cashback_balance + cb,
        total_earned = user_cashback.total_earned + cb, updated_at = now();
      INSERT INTO cashback_transactions (user_id, amount, type, description, description_ar, reference_id)
      VALUES (NEW.user_id, cb, 'earned', 'Cashback from deposit of ' || NEW.amount || ' SAR', 'كاش باك من شحن رصيد بقيمة ' || NEW.amount || ' ر.س', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

-- Documented VAT rule: halalas, half-up (Postgres numeric round = half away from zero; amounts are positive).
CREATE OR REPLACE FUNCTION public.vat_halalas(p_subtotal_minor bigint, p_rate numeric)
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT round(p_subtotal_minor * p_rate)::bigint $$;

-- Precision guards for new rows (old immutable ledger rows are not rewritten).
ALTER TABLE public.balance_logs ADD CONSTRAINT balance_logs_amount_halalas CHECK (amount = round(amount, 2)) NOT VALID;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_halalas CHECK (amount = round(amount,2) AND coalesce(total_credited,0) = round(coalesce(total_credited,0),2)
  AND coalesce(fee_amount,0) = round(coalesce(fee_amount,0),2) AND coalesce(bonus_amount,0) = round(coalesce(bonus_amount,0),2));
ALTER TABLE public.dev_order_invoices ADD CONSTRAINT invoices_halalas CHECK (amount IS NULL OR amount = round(amount,2));
ALTER TABLE public.cashback_transactions ADD CONSTRAINT cashback_tx_halalas CHECK (amount = round(amount,2));
ALTER TABLE public.user_cashback ADD CONSTRAINT user_cashback_halalas CHECK (cashback_balance = round(cashback_balance,2) AND total_earned = round(total_earned,2) AND coalesce(total_withdrawn,0) = round(coalesce(total_withdrawn,0),2));
ALTER TABLE public.referral_commissions ADD CONSTRAINT commissions_halalas CHECK (commission_amount = round(commission_amount,2));
ALTER TABLE public.cloud_orders ADD CONSTRAINT cloud_orders_halalas CHECK (subtotal = round(subtotal,2) AND vat_amount = round(vat_amount,2) AND total = round(total,2) AND coalesce(refund_amount,0) = round(coalesce(refund_amount,0),2));
