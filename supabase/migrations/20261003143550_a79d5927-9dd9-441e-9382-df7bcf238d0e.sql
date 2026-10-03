
ALTER TABLE public.cashback_transactions ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS cashback_tx_user_idem ON public.cashback_transactions(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public._cashback_debit(p_uid uuid, p_amount numeric, p_key text, p_kind text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cb record; v_tx uuid;
BEGIN
  IF p_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF p_amount <> round(p_amount, 2) THEN RAISE EXCEPTION 'INVALID_AMOUNT_PRECISION'; END IF;
  IF p_amount > 1000000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF p_key IS NULL OR length(p_key) < 8 OR length(p_key) > 100 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  SELECT * INTO v_cb FROM public.user_cashback WHERE user_id = p_uid FOR UPDATE;
  IF NOT FOUND OR v_cb.cashback_balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_CASHBACK'; END IF;
  UPDATE public.user_cashback SET cashback_balance = cashback_balance - p_amount,
    total_withdrawn = coalesce(total_withdrawn,0) + p_amount, updated_at = now() WHERE user_id = p_uid;
  INSERT INTO public.cashback_transactions(user_id, amount, type, description, description_ar, idempotency_key)
  VALUES (p_uid, -p_amount, 'withdrawn',
    CASE WHEN p_kind = 'bank' THEN 'Cashback bank withdrawal request' ELSE 'Cashback withdrawn to main balance' END,
    CASE WHEN p_kind = 'bank' THEN 'طلب سحب كاش باك إلى الحساب البنكي' ELSE 'سحب كاش باك إلى الرصيد الرئيسي' END, p_kind || ':' || p_key)
  RETURNING id INTO v_tx;
  RETURN v_tx;
END; $$;

CREATE OR REPLACE FUNCTION public.cashback_withdraw_to_wallet(p_amount numeric, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_ex record; v_tx uuid; v_res jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  PERFORM 1 FROM public.user_cashback WHERE user_id = uid FOR UPDATE;
  SELECT id INTO v_ex FROM public.cashback_transactions WHERE user_id = uid AND idempotency_key = 'wallet:' || p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'cashback_tx_id', v_ex.id);
  END IF;
  v_tx := public._cashback_debit(uid, p_amount, p_idempotency_key, 'wallet');
  v_res := public._wallet_post(uid, p_amount, 'credit', 'cashback_withdrawal', v_tx, 'cbw:' || p_idempotency_key,
    'تحويل كاش باك إلى الرصيد', uid, NULL, false);
  UPDATE public.cashback_transactions SET reference_id = (v_res->>'log_id')::uuid WHERE id = v_tx;
  INSERT INTO public.audit_logs(table_name, record_id, action, user_id, new_value, metadata)
  VALUES ('cashback_transactions', v_tx, 'CASHBACK_TO_WALLET', uid, jsonb_build_object('amount', p_amount),
    jsonb_build_object('ledger_id', v_res->'log_id', 'idempotency_key', p_idempotency_key));
  RETURN jsonb_build_object('success', true, 'duplicate', false, 'amount', p_amount, 'cashback_tx_id', v_tx, 'ledger_id', v_res->'log_id');
END; $$;

CREATE OR REPLACE FUNCTION public.cashback_request_bank_withdrawal(p_amount numeric, p_bank_name text, p_account_holder text, p_iban text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_ex record; v_tx uuid; v_req uuid; v_iban text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_amount IS NULL OR p_amount < 100 THEN RAISE EXCEPTION 'BELOW_MINIMUM'; END IF;
  v_iban := upper(regexp_replace(coalesce(p_iban,''), '\s', '', 'g'));
  IF v_iban !~ '^SA\d{22}$' THEN RAISE EXCEPTION 'INVALID_IBAN'; END IF;
  IF length(btrim(coalesce(p_bank_name,''))) < 2 OR length(p_bank_name) > 100 OR length(btrim(coalesce(p_account_holder,''))) < 3 OR length(p_account_holder) > 150 THEN
    RAISE EXCEPTION 'INVALID_BANK_DETAILS'; END IF;
  PERFORM 1 FROM public.user_cashback WHERE user_id = uid FOR UPDATE;
  SELECT id, reference_id INTO v_ex FROM public.cashback_transactions WHERE user_id = uid AND idempotency_key = 'bank:' || p_idempotency_key;
  IF FOUND THEN RETURN jsonb_build_object('success', true, 'duplicate', true, 'request_id', v_ex.reference_id); END IF;
  v_tx := public._cashback_debit(uid, p_amount, p_idempotency_key, 'bank');
  INSERT INTO public.bank_withdrawal_requests(user_id, amount, bank_name, account_holder_name, iban)
  VALUES (uid, p_amount, btrim(p_bank_name), btrim(p_account_holder), v_iban) RETURNING id INTO v_req;
  UPDATE public.cashback_transactions SET reference_id = v_req WHERE id = v_tx;
  INSERT INTO public.audit_logs(table_name, record_id, action, user_id, new_value, metadata)
  VALUES ('bank_withdrawal_requests', v_req, 'CASHBACK_BANK_REQUEST', uid, jsonb_build_object('amount', p_amount), jsonb_build_object('cashback_tx_id', v_tx));
  RETURN jsonb_build_object('success', true, 'duplicate', false, 'amount', p_amount, 'request_id', v_req);
END; $$;

-- Legacy paths: disabled and not callable by customers.
CREATE OR REPLACE FUNCTION public.withdraw_cashback(p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'DEPRECATED_USE_CASHBACK_WITHDRAW_TO_WALLET'; END; $$;
CREATE OR REPLACE FUNCTION public.withdraw_cashback(p_user_id uuid, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'DEPRECATED_USE_CASHBACK_WITHDRAW_TO_WALLET'; END; $$;
REVOKE ALL ON FUNCTION public.withdraw_cashback(numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdraw_cashback(uuid, numeric) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public._cashback_debit(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._cashback_debit(uuid, numeric, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.cashback_withdraw_to_wallet(numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cashback_request_bank_withdrawal(numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cashback_withdraw_to_wallet(numeric, text), public.cashback_request_bank_withdrawal(numeric, text, text, text, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can create bank withdrawal requests" ON public.bank_withdrawal_requests;
