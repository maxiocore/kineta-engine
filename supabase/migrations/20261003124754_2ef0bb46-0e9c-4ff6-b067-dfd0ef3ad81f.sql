CREATE OR REPLACE FUNCTION public.pay_service_order(
  p_service_id uuid, p_quantity integer, p_link text, p_notes text, p_coupon_code text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_svc record; v_cp record; v_coupon_id uuid; v_existing record; v_order record;
  v_min int := 1; v_max int := 100000; v_base numeric; v_disc numeric := 0; v_total numeric; v_res jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 100 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  IF p_link IS NOT NULL AND length(p_link) > 2000 THEN RAISE EXCEPTION 'INVALID_LINK'; END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 10000 THEN RAISE EXCEPTION 'INVALID_NOTES'; END IF;

  INSERT INTO public.user_balances(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balances WHERE user_id = uid FOR UPDATE;
  SELECT reference_id, amount, balance_after INTO v_existing FROM public.balance_logs
    WHERE user_id = uid AND idempotency_key = 'pay:' || p_idempotency_key;
  IF FOUND THEN
    SELECT id, order_number, total_price INTO v_order FROM public.orders WHERE id = v_existing.reference_id;
    RETURN jsonb_build_object('duplicate', true, 'order_id', v_order.id, 'order_number', v_order.order_number,
      'total', v_order.total_price, 'balance_after', v_existing.balance_after);
  END IF;

  SELECT * INTO v_svc FROM public.services WHERE id = p_service_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'SERVICE_NOT_AVAILABLE'; END IF;
  IF v_svc.price IS NULL OR v_svc.price <= 0 THEN RAISE EXCEPTION 'SERVICE_REQUIRES_QUOTE'; END IF;
  IF jsonb_typeof(v_svc.features) = 'object' THEN
    IF (v_svc.features->>'min') ~ '^\d+$' THEN v_min := (v_svc.features->>'min')::int; END IF;
    IF (v_svc.features->>'max') ~ '^\d+$' THEN v_max := least((v_svc.features->>'max')::int, 1000000); END IF;
  END IF;
  IF p_quantity IS NULL OR p_quantity < greatest(v_min,1) OR p_quantity > v_max THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;

  v_base := round(v_svc.price * p_quantity, 2);
  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT * INTO v_cp FROM public.coupons WHERE upper(code) = upper(btrim(p_coupon_code)) AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_INVALID'; END IF;
    IF v_cp.expires_at IS NOT NULL AND v_cp.expires_at < now() THEN RAISE EXCEPTION 'COUPON_EXPIRED'; END IF;
    IF v_cp.max_uses IS NOT NULL AND v_cp.used_count >= v_cp.max_uses THEN RAISE EXCEPTION 'COUPON_EXHAUSTED'; END IF;
    IF coalesce(v_cp.min_order_amount,0) > v_base THEN RAISE EXCEPTION 'COUPON_MIN_ORDER'; END IF;
    IF v_cp.discount_type = 'percentage' THEN v_disc := round(v_base * least(greatest(v_cp.discount_value,0),100) / 100, 2);
    ELSE v_disc := least(greatest(v_cp.discount_value,0), v_base); END IF;
    v_coupon_id := v_cp.id;
  END IF;
  v_total := round(greatest(0, v_base - v_disc), 2);
  IF v_total <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;

  INSERT INTO public.orders(user_id, service_id, order_number, quantity, link, notes, total_price, coupon_id, discount_amount, status, payment_method)
  VALUES (uid, v_svc.id, '', p_quantity, nullif(btrim(coalesce(p_link,'')),''), p_notes, v_total, v_coupon_id, v_disc, 'pending', 'balance')
  RETURNING id, order_number INTO v_order;

  v_res := public._wallet_post(uid, -v_total, 'order', 'order', v_order.id, 'pay:' || p_idempotency_key,
    'خصم للطلب رقم ' || v_order.order_number, uid, NULL, true);

  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id, discount_applied) VALUES (v_coupon_id, uid, v_order.id, v_disc);
  END IF;

  RETURN jsonb_build_object('duplicate', false, 'order_id', v_order.id, 'order_number', v_order.order_number,
    'subtotal', v_base, 'discount', v_disc, 'vat', 0, 'total', v_total, 'balance_after', v_res->'balance_after');
END; $$;