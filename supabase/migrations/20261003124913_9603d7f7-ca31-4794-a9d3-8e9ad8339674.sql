CREATE OR REPLACE FUNCTION public.pay_dev_invoice(p_invoice_id uuid, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_inv record; v_existing record; v_res jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 100 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  INSERT INTO public.user_balances(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balances WHERE user_id = uid FOR UPDATE;
  SELECT balance_after INTO v_existing FROM public.balance_logs WHERE user_id = uid AND idempotency_key = 'inv:' || p_idempotency_key;
  IF FOUND THEN RETURN jsonb_build_object('duplicate', true, 'invoice_id', p_invoice_id, 'balance_after', v_existing.balance_after); END IF;

  SELECT i.*, d.user_id AS owner_id, d.status AS order_status INTO v_inv
    FROM public.dev_order_invoices i JOIN public.dev_orders d ON d.id = i.order_id
    WHERE i.id = p_invoice_id FOR UPDATE OF i;
  IF NOT FOUND OR v_inv.owner_id <> uid THEN RAISE EXCEPTION 'INVOICE_NOT_FOUND'; END IF;
  IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'INVOICE_NOT_PAYABLE'; END IF;
  IF v_inv.amount IS NULL OR v_inv.amount <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;

  v_res := public._wallet_post(uid, -round(v_inv.amount,2), 'order', 'invoice', v_inv.id, 'inv:' || p_idempotency_key,
    'دفع فاتورة رقم ' || coalesce(v_inv.invoice_number,''), uid, NULL, true);

  UPDATE public.dev_order_invoices SET status = 'paid', paid_at = now(), payment_method = 'balance', updated_at = now() WHERE id = v_inv.id;
  UPDATE public.dev_orders SET status = 'in_progress', updated_at = now()
    WHERE id = v_inv.order_id AND status NOT IN ('completed', 'cancelled');
  INSERT INTO public.dev_order_events(order_id, event_type, actor_role, actor_id, message_text, payload)
  VALUES (v_inv.order_id, 'status_changed', 'system', uid,
    'تم دفع الفاتورة رقم ' || coalesce(v_inv.invoice_number,'') || ' بمبلغ ' || to_char(v_inv.amount, 'FM999999990.00') || ' ر.س',
    jsonb_build_object('kind', 'payment_received', 'invoice_id', v_inv.id, 'amount', v_inv.amount, 'ledger_id', v_res->'log_id'));
  INSERT INTO public.admin_notifications(title, message, type, metadata)
  VALUES ('تم دفع فاتورة', 'تم دفع فاتورة ' || coalesce(v_inv.invoice_number,'') || ' بمبلغ ' || to_char(v_inv.amount, 'FM999999990.00') || ' ر.س', 'success',
    jsonb_build_object('order_id', v_inv.order_id, 'invoice_id', v_inv.id, 'user_id', uid));

  RETURN jsonb_build_object('duplicate', false, 'invoice_id', v_inv.id, 'amount', v_inv.amount, 'balance_after', v_res->'balance_after');
END; $$;