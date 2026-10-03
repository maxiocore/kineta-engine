
ALTER TABLE public.balance_logs
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'succeeded',
  ADD COLUMN IF NOT EXISTS original_log_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS balance_logs_user_idem_uniq ON public.balance_logs(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS balance_logs_ref_idx ON public.balance_logs(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS balance_logs_original_idx ON public.balance_logs(original_log_id);

-- Immutable ledger: no edits/deletes from client sessions (service_role cleanup on user deletion still allowed)
CREATE OR REPLACE FUNCTION public.balance_logs_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'LEDGER_IMMUTABLE: wallet ledger entries cannot be modified or deleted';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS balance_logs_immutable ON public.balance_logs;
CREATE TRIGGER balance_logs_immutable BEFORE UPDATE OR DELETE ON public.balance_logs
  FOR EACH ROW EXECUTE FUNCTION public.balance_logs_guard();

-- Skip auto-logging when the ledger engine writes its own entry
CREATE OR REPLACE FUNCTION public.log_balance_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE action text; change_amount numeric;
BEGIN
  IF coalesce(current_setting('app.wallet_ledger', true), 'off') = 'on' THEN RETURN NEW; END IF;
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

-- Core primitive: atomic, locked, idempotent wallet posting (internal only)
CREATE OR REPLACE FUNCTION public._wallet_post(
  p_user uuid, p_amount numeric, p_action text, p_ref_type text, p_ref_id uuid,
  p_key text, p_notes text, p_actor uuid, p_original uuid DEFAULT NULL, p_spend boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bal record; v_existing record; v_log uuid; v_after numeric;
BEGIN
  IF p_user IS NULL OR p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  INSERT INTO public.user_balances(user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_bal FROM public.user_balances WHERE user_id = p_user FOR UPDATE;
  IF p_key IS NOT NULL THEN
    SELECT id, amount, balance_after INTO v_existing FROM public.balance_logs WHERE user_id = p_user AND idempotency_key = p_key;
    IF FOUND THEN
      RETURN jsonb_build_object('duplicate', true, 'log_id', v_existing.id, 'amount', v_existing.amount, 'balance_after', v_existing.balance_after);
    END IF;
  END IF;
  v_after := round(v_bal.balance + p_amount, 2);
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
END; $$;
REVOKE ALL ON FUNCTION public._wallet_post(uuid, numeric, text, text, uuid, text, text, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._wallet_post(uuid, numeric, text, text, uuid, text, text, uuid, uuid, boolean) TO service_role;

-- Service / design order payment (trusted price from DB)
CREATE OR REPLACE FUNCTION public.pay_service_order(
  p_service_id uuid, p_quantity integer, p_link text, p_notes text, p_coupon_code text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_svc record; v_cp record; v_existing record; v_order record;
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
  END IF;
  v_total := round(greatest(0, v_base - v_disc), 2);
  IF v_total <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;

  INSERT INTO public.orders(user_id, service_id, order_number, quantity, link, notes, total_price, coupon_id, discount_amount, status, payment_method)
  VALUES (uid, v_svc.id, '', p_quantity, nullif(btrim(coalesce(p_link,'')),''), p_notes, v_total, v_cp.id, v_disc, 'pending', 'balance')
  RETURNING id, order_number INTO v_order;

  v_res := public._wallet_post(uid, -v_total, 'order', 'order', v_order.id, 'pay:' || p_idempotency_key,
    'خصم للطلب رقم ' || v_order.order_number, uid, NULL, true);

  IF v_cp.id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id, discount_applied) VALUES (v_cp.id, uid, v_order.id, v_disc);
  END IF;

  RETURN jsonb_build_object('duplicate', false, 'order_id', v_order.id, 'order_number', v_order.order_number,
    'subtotal', v_base, 'discount', v_disc, 'vat', 0, 'total', v_total, 'balance_after', v_res->'balance_after');
END; $$;

CREATE OR REPLACE FUNCTION public.pay_design_order(p_service_id uuid, p_link text, p_notes text, p_idempotency_key text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.pay_service_order(p_service_id, 1, p_link, p_notes, NULL, p_idempotency_key);
$$;

-- Development invoice payment
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
  VALUES (v_inv.order_id, 'payment_received', 'user', uid,
    'تم دفع الفاتورة رقم ' || coalesce(v_inv.invoice_number,'') || ' بمبلغ ' || to_char(v_inv.amount, 'FM999999990.00') || ' ر.س',
    jsonb_build_object('invoice_id', v_inv.id, 'amount', v_inv.amount, 'ledger_id', v_res->'log_id'));
  INSERT INTO public.admin_notifications(title, message, type, metadata)
  VALUES ('تم دفع فاتورة', 'تم دفع فاتورة ' || coalesce(v_inv.invoice_number,'') || ' بمبلغ ' || to_char(v_inv.amount, 'FM999999990.00') || ' ر.س', 'success',
    jsonb_build_object('order_id', v_inv.order_id, 'invoice_id', v_inv.id, 'user_id', uid));

  RETURN jsonb_build_object('duplicate', false, 'invoice_id', v_inv.id, 'amount', v_inv.amount, 'balance_after', v_res->'balance_after');
END; $$;

-- Points redemption (100 points = 1 SAR)
CREATE OR REPLACE FUNCTION public.redeem_points_to_wallet(p_points integer, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_pts record; v_existing record; v_credit numeric; v_res jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 100 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  IF p_points IS NULL OR p_points < 100 OR p_points > 10000000 THEN RAISE EXCEPTION 'INVALID_POINTS'; END IF;
  INSERT INTO public.user_balances(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balances WHERE user_id = uid FOR UPDATE;
  SELECT balance_after INTO v_existing FROM public.balance_logs WHERE user_id = uid AND idempotency_key = 'pts:' || p_idempotency_key;
  IF FOUND THEN RETURN jsonb_build_object('duplicate', true, 'balance_after', v_existing.balance_after); END IF;
  SELECT * INTO v_pts FROM public.user_points WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND OR v_pts.available_points < p_points THEN RAISE EXCEPTION 'INSUFFICIENT_POINTS'; END IF;
  v_credit := round(p_points / 100.0, 2);
  UPDATE public.user_points SET available_points = available_points - p_points,
    redeemed_points = redeemed_points + p_points, updated_at = now() WHERE user_id = uid;
  INSERT INTO public.points_transactions(user_id, points, type, description, description_ar)
  VALUES (uid, -p_points, 'redeemed', 'Redeemed ' || p_points || ' points for ' || v_credit || ' SAR',
    'تم استبدال ' || p_points || ' نقطة مقابل ' || v_credit || ' ر.س');
  v_res := public._wallet_post(uid, v_credit, 'points_redeem', 'points', NULL, 'pts:' || p_idempotency_key,
    'استبدال ' || p_points || ' نقطة', uid, NULL, false);
  RETURN jsonb_build_object('duplicate', false, 'points', p_points, 'credit', v_credit, 'balance_after', v_res->'balance_after');
END; $$;

-- Admin credit / debit (reason required, audited)
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user_id uuid, p_action text, p_amount numeric, p_reason text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_res jsonb; v_amt numeric;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_action NOT IN ('credit','debit') THEN RAISE EXCEPTION 'INVALID_ACTION'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 OR length(p_reason) > 1000 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  v_amt := round(CASE WHEN p_action = 'credit' THEN p_amount ELSE -p_amount END, 2);
  v_res := public._wallet_post(p_user_id, v_amt, 'admin_' || p_action, 'admin_adjustment', NULL,
    'adm:' || p_idempotency_key, btrim(p_reason), uid, NULL, false);
  IF NOT (v_res->>'duplicate')::boolean THEN
    INSERT INTO public.audit_logs(table_name, action, old_value, new_value, user_id, metadata)
    VALUES ('user_balances', CASE WHEN p_action='credit' THEN 'BALANCE_ADD' ELSE 'BALANCE_DEDUCT' END,
      jsonb_build_object('balance', v_res->'balance_before'),
      jsonb_build_object('balance', v_res->'balance_after', 'change', v_amt, 'reason', btrim(p_reason)),
      uid, jsonb_build_object('target_user_id', p_user_id, 'ledger_id', v_res->'log_id'));
  END IF;
  RETURN v_res;
END; $$;

-- Admin refund of a specific wallet charge (cumulative refunds <= original charge)
CREATE OR REPLACE FUNCTION public.admin_refund_wallet_transaction(p_log_id uuid, p_amount numeric, p_reason text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_orig record; v_refunded numeric; v_res jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  SELECT * INTO v_orig FROM public.balance_logs WHERE id = p_log_id;
  IF NOT FOUND OR v_orig.amount >= 0 OR v_orig.status <> 'succeeded' OR v_orig.action_type NOT IN ('order','admin_debit') THEN
    RAISE EXCEPTION 'ORIGINAL_NOT_REFUNDABLE'; END IF;
  -- lock wallet first to serialize refunds
  PERFORM 1 FROM public.user_balances WHERE user_id = v_orig.user_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.balance_logs WHERE user_id = v_orig.user_id AND idempotency_key = 'rfd:' || p_idempotency_key) THEN
    RETURN public._wallet_post(v_orig.user_id, 1, 'refund', NULL, NULL, 'rfd:' || p_idempotency_key, NULL, uid); -- returns duplicate
  END IF;
  SELECT coalesce(sum(amount),0) INTO v_refunded FROM public.balance_logs
    WHERE action_type = 'refund' AND (original_log_id = p_log_id
      OR (original_log_id IS NULL AND v_orig.reference_id IS NOT NULL AND reference_id = v_orig.reference_id AND reference_type = v_orig.reference_type));
  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount,2) > round(-v_orig.amount - v_refunded, 2) THEN
    RAISE EXCEPTION 'REFUND_EXCEEDS_REFUNDABLE'; END IF;
  v_res := public._wallet_post(v_orig.user_id, round(p_amount,2), 'refund', v_orig.reference_type, v_orig.reference_id,
    'rfd:' || p_idempotency_key, btrim(p_reason), uid, p_log_id, v_orig.action_type = 'order');
  INSERT INTO public.audit_logs(table_name, action, new_value, user_id, metadata)
  VALUES ('balance_logs', 'WALLET_REFUND', jsonb_build_object('amount', p_amount, 'reason', btrim(p_reason)), uid,
    jsonb_build_object('original_log_id', p_log_id, 'refund_log_id', v_res->'log_id', 'target_user_id', v_orig.user_id));
  RETURN v_res;
END; $$;

-- Order cancellation: refund only what was actually charged from the wallet, never twice, never delete ledger
CREATE OR REPLACE FUNCTION public.refund_balance_on_cancel() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_charged numeric; v_refunded numeric; v_refundable numeric; v_orig uuid;
BEGIN
  IF (NEW.status IN ('cancelled', 'refunded')) AND (OLD.status NOT IN ('cancelled', 'refunded')) THEN
    PERFORM 1 FROM public.user_balances WHERE user_id = NEW.user_id FOR UPDATE;
    SELECT coalesce(-sum(amount),0), (array_agg(id ORDER BY created_at))[1] INTO v_charged, v_orig
      FROM public.balance_logs WHERE reference_type = 'order' AND reference_id = NEW.id AND action_type = 'order' AND amount < 0;
    SELECT coalesce(sum(amount),0) INTO v_refunded
      FROM public.balance_logs WHERE reference_type = 'order' AND reference_id = NEW.id AND action_type = 'refund';
    v_refundable := round(v_charged - v_refunded, 2);
    IF v_refundable > 0 THEN
      PERFORM public._wallet_post(NEW.user_id, v_refundable, 'refund', 'order', NEW.id,
        'auto-refund:' || NEW.id || ':' || v_refunded,
        CASE WHEN NEW.status = 'cancelled' THEN 'استرداد الرصيد - إلغاء الطلب رقم ' ELSE 'استرداد الرصيد - استرجاع الطلب رقم ' END || NEW.order_number,
        auth.uid(), v_orig, true);
      INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
      VALUES (NEW.user_id, 'تم استرداد الرصيد', 'تم استرداد مبلغ ' || v_refundable || ' ر.س إلى رصيدك بعد ' ||
        CASE WHEN NEW.status = 'cancelled' THEN 'إلغاء' ELSE 'استرجاع' END || ' الطلب رقم ' || NEW.order_number, 'success', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.pay_service_order(uuid, integer, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pay_design_order(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pay_dev_invoice(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_points_to_wallet(integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_refund_wallet_transaction(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.balance_logs_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_service_order(uuid, integer, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pay_design_order(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pay_dev_invoice(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_points_to_wallet(integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_refund_wallet_transaction(uuid, numeric, text, text) TO authenticated, service_role;

-- Remove browser-side financial mutation
DROP POLICY IF EXISTS "Users can insert their own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Users can update their own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Admins can manage all balances" ON public.user_balances;
CREATE POLICY "Admins can view all balances" ON public.user_balances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage balance logs" ON public.balance_logs;
CREATE POLICY "Admins can view balance logs" ON public.balance_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
REVOKE INSERT, UPDATE, DELETE ON public.user_balances FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.balance_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can update their own order invoices for payment" ON public.dev_order_invoices;
DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can insert their own redemption transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Users can create usages" ON public.coupon_usages;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
