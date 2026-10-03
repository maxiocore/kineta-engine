
-- ===== Settings =====
CREATE TABLE public.payment_gateway_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  card_enabled boolean NOT NULL DEFAULT true,
  applepay_status text NOT NULL DEFAULT 'configuration_required' CHECK (applepay_status IN ('disabled','configuration_required','enabled')),
  stcpay_status text NOT NULL DEFAULT 'configuration_required' CHECK (stcpay_status IN ('disabled','configuration_required','enabled')),
  paylink_new_payments boolean NOT NULL DEFAULT false CHECK (paylink_new_payments = false),
  min_topup numeric NOT NULL DEFAULT 10,
  max_topup numeric NOT NULL DEFAULT 50000,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT ALL ON public.payment_gateway_settings TO service_role;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.payment_gateway_settings(id) VALUES (true) ON CONFLICT DO NOTHING;

-- ===== Payments =====
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_payment_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('wallet_topup','dev_invoice','service_order')),
  reference_id uuid,
  intent jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'SAR' CHECK (currency = 'SAR'),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','pending','paid','failed','review','refunded','partially_refunded','expired')),
  payment_method text,
  card_last4 text,
  provider text NOT NULL DEFAULT 'moyasar',
  provider_payment_id text UNIQUE,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  idempotency_key text NOT NULL,
  refunded_minor bigint NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0),
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_code text,
  provider_status text,
  processed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key),
  CHECK (refunded_minor <= amount_minor)
);
CREATE INDEX payments_user_idx ON public.payments(user_id, created_at DESC);
GRANT SELECT (id, internal_payment_id, user_id, reference_type, reference_id, description, amount_minor, currency, status,
  payment_method, card_last4, refunded_minor, result, failure_code, paid_at, created_at, updated_at) ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  source text NOT NULL,
  event_type text NOT NULL,
  provider_event_id text UNIQUE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed')),
  admin_id uuid NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  wallet_reversed boolean NOT NULL DEFAULT false,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_refunds TO service_role;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- ===== Shared service-order logic (same rules/prices as before) =====
CREATE OR REPLACE FUNCTION public._quote_service_order(p_service_id uuid, p_quantity integer, p_coupon_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_svc record; v_cp record; v_min int := 1; v_max int := 100000; v_base numeric; v_disc numeric := 0; v_total numeric; v_coupon uuid;
BEGIN
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
    SELECT * INTO v_cp FROM public.coupons WHERE upper(code) = upper(btrim(p_coupon_code)) AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_INVALID'; END IF;
    IF v_cp.expires_at IS NOT NULL AND v_cp.expires_at < now() THEN RAISE EXCEPTION 'COUPON_EXPIRED'; END IF;
    IF v_cp.max_uses IS NOT NULL AND v_cp.used_count >= v_cp.max_uses THEN RAISE EXCEPTION 'COUPON_EXHAUSTED'; END IF;
    IF coalesce(v_cp.min_order_amount,0) > v_base THEN RAISE EXCEPTION 'COUPON_MIN_ORDER'; END IF;
    IF v_cp.discount_type = 'percentage' THEN v_disc := round(v_base * least(greatest(v_cp.discount_value,0),100) / 100, 2);
    ELSE v_disc := least(greatest(v_cp.discount_value,0), v_base); END IF;
    v_coupon := v_cp.id;
  END IF;
  v_total := round(greatest(0, v_base - v_disc), 2);
  IF v_total <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;
  RETURN jsonb_build_object('service_name', v_svc.name, 'subtotal', v_base, 'discount', v_disc, 'vat', 0, 'total', v_total, 'coupon_id', v_coupon);
END; $$;

CREATE OR REPLACE FUNCTION public._pay_service_order_as(p_uid uuid, p_service_id uuid, p_quantity integer, p_link text, p_notes text, p_coupon_code text, p_idempotency_key text, p_method text DEFAULT 'balance')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := p_uid; v_svc record; v_cp record; v_coupon_id uuid; v_existing record; v_order record;
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
  VALUES (uid, v_svc.id, '', p_quantity, nullif(btrim(coalesce(p_link,'')),''), p_notes, v_total, v_coupon_id, v_disc, 'pending', coalesce(p_method,'balance'))
  RETURNING id, order_number INTO v_order;
  v_res := public._wallet_post(uid, -v_total, 'order', 'order', v_order.id, 'pay:' || p_idempotency_key,
    'خصم للطلب رقم ' || v_order.order_number, uid, NULL, true);
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id, discount_applied) VALUES (v_coupon_id, uid, v_order.id, v_disc);
  END IF;
  RETURN jsonb_build_object('duplicate', false, 'order_id', v_order.id, 'order_number', v_order.order_number,
    'subtotal', v_base, 'discount', v_disc, 'vat', 0, 'total', v_total, 'balance_after', v_res->'balance_after');
END; $$;

CREATE OR REPLACE FUNCTION public.pay_service_order(p_service_id uuid, p_quantity integer, p_link text, p_notes text, p_coupon_code text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  RETURN public._pay_service_order_as(auth.uid(), p_service_id, p_quantity, p_link, p_notes, p_coupon_code, p_idempotency_key, 'balance');
END; $$;

-- ===== Create payment (trusted amount) =====
CREATE OR REPLACE FUNCTION public.payment_create(p_user uuid, p_type text, p_reference_id uuid, p_intent jsonb, p_idempotency_key text, p_environment text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_set record; v_existing record; v_amount numeric; v_desc text; v_intent jsonb := '{}'::jsonb; v_inv record; v_q jsonb;
  v_pid text; v_row record; i int := 0;
BEGIN
  IF p_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 100 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  SELECT * INTO v_set FROM public.payment_gateway_settings WHERE id;
  IF p_environment IS DISTINCT FROM v_set.environment THEN RAISE EXCEPTION 'ENVIRONMENT_MISMATCH'; END IF;
  SELECT * INTO v_existing FROM public.payments WHERE user_id = p_user AND idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN to_jsonb(v_existing) || jsonb_build_object('duplicate', true); END IF;

  IF p_type = 'wallet_topup' THEN
    BEGIN v_amount := round((p_intent->>'amount')::numeric, 2); EXCEPTION WHEN others THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END;
    IF v_amount IS NULL OR v_amount < v_set.min_topup OR v_amount > v_set.max_topup THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
    v_desc := 'شحن رصيد المحفظة';
    v_intent := jsonb_build_object('amount', v_amount);
    p_reference_id := NULL;
  ELSIF p_type = 'dev_invoice' THEN
    SELECT i.*, d.user_id AS owner_id INTO v_inv FROM public.dev_order_invoices i JOIN public.dev_orders d ON d.id = i.order_id WHERE i.id = p_reference_id;
    IF NOT FOUND OR v_inv.owner_id <> p_user THEN RAISE EXCEPTION 'INVOICE_NOT_FOUND'; END IF;
    IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'INVOICE_NOT_PAYABLE'; END IF;
    IF v_inv.amount IS NULL OR v_inv.amount <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;
    v_amount := round(v_inv.amount, 2);
    v_desc := 'فاتورة رقم ' || coalesce(v_inv.invoice_number,'');
    v_intent := jsonb_build_object('invoice_number', v_inv.invoice_number, 'order_id', v_inv.order_id);
  ELSIF p_type = 'service_order' THEN
    IF p_intent->>'service_id' IS NULL THEN RAISE EXCEPTION 'SERVICE_NOT_AVAILABLE'; END IF;
    IF length(coalesce(p_intent->>'link','')) > 2000 THEN RAISE EXCEPTION 'INVALID_LINK'; END IF;
    IF length(coalesce(p_intent->>'notes','')) > 10000 THEN RAISE EXCEPTION 'INVALID_NOTES'; END IF;
    v_q := public._quote_service_order((p_intent->>'service_id')::uuid, (p_intent->>'quantity')::int, p_intent->>'coupon_code');
    v_amount := (v_q->>'total')::numeric;
    v_desc := coalesce(v_q->>'service_name', 'طلب خدمة');
    p_reference_id := (p_intent->>'service_id')::uuid;
    v_intent := jsonb_build_object('service_id', p_intent->>'service_id', 'quantity', (p_intent->>'quantity')::int,
      'link', p_intent->>'link', 'notes', p_intent->>'notes', 'coupon_code', nullif(btrim(coalesce(p_intent->>'coupon_code','')),''),
      'subtotal', v_q->'subtotal', 'discount', v_q->'discount', 'vat', 0);
  ELSE
    RAISE EXCEPTION 'INVALID_PAYMENT_TYPE';
  END IF;

  LOOP
    v_pid := 'PAY-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.payments WHERE internal_payment_id = v_pid);
    i := i + 1; IF i > 10 THEN RAISE EXCEPTION 'ID_GENERATION_FAILED'; END IF;
  END LOOP;

  INSERT INTO public.payments(internal_payment_id, user_id, reference_type, reference_id, intent, description, amount_minor, currency, environment, idempotency_key)
  VALUES (v_pid, p_user, p_type, p_reference_id, v_intent, v_desc, (round(v_amount * 100))::bigint, 'SAR', p_environment, p_idempotency_key)
  RETURNING * INTO v_row;
  INSERT INTO public.payment_events(payment_id, source, event_type, details) VALUES (v_row.id, 'customer', 'created', jsonb_build_object('amount_minor', v_row.amount_minor));
  RETURN to_jsonb(v_row) || jsonb_build_object('duplicate', false);
END; $$;

-- ===== Apply a provider-verified result exactly once =====
CREATE OR REPLACE FUNCTION public.payment_apply_verified(p_payment_id uuid, p_provider_payment_id text, p_provider_status text,
  p_amount_minor bigint, p_currency text, p_meta_internal_id text, p_method text, p_last4 text, p_source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; v_amount numeric; v_dep uuid; v_res jsonb; v_inv record; v_out jsonb := '{}'::jsonb; v_err text;
BEGIN
  SELECT * INTO p FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_payment'); END IF;
  IF p.processed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', p.status IN ('paid','refunded','partially_refunded'), 'duplicate', true, 'status', p.status);
  END IF;
  IF p.provider_payment_id IS NOT NULL AND p.provider_payment_id <> p_provider_payment_id THEN
    INSERT INTO public.payment_events(payment_id, source, event_type, details) VALUES (p.id, p_source, 'provider_id_conflict', '{}'::jsonb);
    RETURN jsonb_build_object('ok', false, 'error', 'reference_mismatch', 'status', p.status);
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE provider_payment_id = p_provider_payment_id AND id <> p.id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reference_mismatch', 'status', p.status);
  END IF;
  UPDATE public.payments SET provider_payment_id = p_provider_payment_id, provider_status = p_provider_status,
    payment_method = coalesce(p_method, payment_method), card_last4 = coalesce(p_last4, card_last4) WHERE id = p.id;

  IF p_provider_status IN ('initiated') THEN
    UPDATE public.payments SET status = 'pending' WHERE id = p.id;
    RETURN jsonb_build_object('ok', false, 'pending', true, 'status', 'pending');
  END IF;
  IF p_provider_status NOT IN ('paid','captured') THEN
    UPDATE public.payments SET status = 'failed', failure_code = 'declined', processed_at = now() WHERE id = p.id;
    INSERT INTO public.payment_events(payment_id, source, event_type, details) VALUES (p.id, p_source, 'failed', jsonb_build_object('provider_status', p_provider_status));
    RETURN jsonb_build_object('ok', false, 'status', 'failed');
  END IF;
  IF p_meta_internal_id IS DISTINCT FROM p.internal_payment_id OR upper(coalesce(p_currency,'')) <> p.currency OR p_amount_minor IS DISTINCT FROM p.amount_minor THEN
    UPDATE public.payments SET status = 'review', failure_code = CASE WHEN p_amount_minor IS DISTINCT FROM p.amount_minor THEN 'amount_mismatch'
      WHEN upper(coalesce(p_currency,'')) <> p.currency THEN 'currency_mismatch' ELSE 'reference_mismatch' END, processed_at = now() WHERE id = p.id;
    INSERT INTO public.payment_events(payment_id, source, event_type, details)
    VALUES (p.id, p_source, 'mismatch_review', jsonb_build_object('expected_minor', p.amount_minor, 'got_minor', p_amount_minor, 'currency', p_currency));
    INSERT INTO public.admin_notifications(title, message, type, metadata)
    VALUES ('دفعة تحتاج مراجعة', 'الدفعة ' || p.internal_payment_id || ' لا تطابق القيمة المتوقعة ولم يُضف أي رصيد', 'warning', jsonb_build_object('payment_id', p.id));
    RETURN jsonb_build_object('ok', false, 'status', 'review');
  END IF;

  v_amount := round(p.amount_minor::numeric / 100, 2);
  IF p.reference_type = 'wallet_topup' THEN
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    INSERT INTO public.deposits(user_id, amount, fee_amount, bonus_amount, total_credited, status, transaction_id, notes)
    VALUES (p.user_id, v_amount, 0, 0, v_amount, 'pending', p.internal_payment_id, 'دفع إلكتروني ' || p.internal_payment_id)
    RETURNING id INTO v_dep;
    UPDATE public.deposits SET status = 'completed', completed_at = now() WHERE id = v_dep;
    v_out := jsonb_build_object('deposit_id', v_dep, 'credited', v_amount);
  ELSE
    v_res := public._wallet_post(p.user_id, v_amount, 'deposit', 'payment', p.id, 'pmt:' || p.id,
      'دفع إلكتروني ' || p.internal_payment_id, NULL, NULL, false);
    IF p.reference_type = 'dev_invoice' THEN
      SELECT i.*, d.user_id AS owner_id INTO v_inv FROM public.dev_order_invoices i JOIN public.dev_orders d ON d.id = i.order_id
        WHERE i.id = p.reference_id FOR UPDATE OF i;
      IF FOUND AND v_inv.owner_id = p.user_id AND v_inv.status = 'pending' AND round(v_inv.amount,2) = v_amount THEN
        v_res := public._wallet_post(p.user_id, -v_amount, 'order', 'invoice', v_inv.id, 'inv:pmt:' || p.id,
          'دفع فاتورة رقم ' || coalesce(v_inv.invoice_number,''), p.user_id, NULL, true);
        UPDATE public.dev_order_invoices SET status = 'paid', paid_at = now(), payment_method = 'electronic', updated_at = now() WHERE id = v_inv.id;
        UPDATE public.dev_orders SET status = 'in_progress', updated_at = now() WHERE id = v_inv.order_id AND status NOT IN ('completed','cancelled');
        INSERT INTO public.dev_order_events(order_id, event_type, actor_role, actor_id, message_text, payload)
        VALUES (v_inv.order_id, 'status_changed', 'system', p.user_id,
          'تم دفع الفاتورة رقم ' || coalesce(v_inv.invoice_number,'') || ' إلكترونياً بمبلغ ' || to_char(v_amount, 'FM999999990.00') || ' ر.س',
          jsonb_build_object('kind', 'payment_received', 'invoice_id', v_inv.id, 'amount', v_amount, 'payment', p.internal_payment_id));
        v_out := jsonb_build_object('invoice_id', v_inv.id, 'invoice_paid', true);
      ELSE
        v_out := jsonb_build_object('invoice_paid', false, 'credited_to_wallet', v_amount);
      END IF;
    ELSE
      BEGIN
        v_res := public._pay_service_order_as(p.user_id, (p.intent->>'service_id')::uuid, (p.intent->>'quantity')::int,
          p.intent->>'link', p.intent->>'notes', p.intent->>'coupon_code', 'pmt-' || p.id::text, 'electronic');
        IF (v_res->>'total')::numeric IS DISTINCT FROM v_amount AND NOT coalesce((v_res->>'duplicate')::boolean,false) THEN
          RAISE EXCEPTION 'PRICE_CHANGED';
        END IF;
        v_out := jsonb_build_object('order_id', v_res->'order_id', 'order_number', v_res->'order_number', 'order_created', true);
      EXCEPTION WHEN others THEN
        v_err := SQLERRM;
        v_out := jsonb_build_object('order_created', false, 'credited_to_wallet', v_amount, 'reason', left(v_err, 60));
      END;
    END IF;
  END IF;

  UPDATE public.payments SET status = 'paid', paid_at = now(), processed_at = now(), result = v_out WHERE id = p.id;
  INSERT INTO public.payment_events(payment_id, source, event_type, details) VALUES (p.id, p_source, 'paid_applied', v_out);
  INSERT INTO public.notifications(user_id, title, message, type)
  VALUES (p.user_id, 'تم استلام دفعتك بنجاح', 'رقم العملية ' || p.internal_payment_id || ' بمبلغ ' || to_char(v_amount, 'FM999999990.00') || ' ر.س', 'success');
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'status', 'paid', 'result', v_out);
END; $$;

-- ===== Refunds (admin via server) =====
CREATE OR REPLACE FUNCTION public.payment_refund_prepare(p_payment_id uuid, p_amount_minor bigint, p_reason text, p_admin uuid, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; v_ex record; v_pending bigint; v_id uuid; v_amt numeric;
BEGIN
  IF NOT public.has_role(p_admin, 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 OR length(p_reason) > 500 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
  SELECT * INTO v_ex FROM public.payment_refunds WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN jsonb_build_object('duplicate', true, 'refund_id', v_ex.id, 'status', v_ex.status); END IF;
  SELECT * INTO p FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF;
  IF p.status NOT IN ('paid','partially_refunded') OR p.provider_payment_id IS NULL THEN RAISE EXCEPTION 'PAYMENT_NOT_REFUNDABLE'; END IF;
  SELECT coalesce(sum(amount_minor),0) INTO v_pending FROM public.payment_refunds WHERE payment_id = p.id AND status = 'pending';
  IF p_amount_minor IS NULL OR p_amount_minor <= 0 OR p_amount_minor + p.refunded_minor + v_pending > p.amount_minor THEN RAISE EXCEPTION 'REFUND_EXCEEDS_REFUNDABLE'; END IF;
  v_amt := round(p_amount_minor::numeric / 100, 2);
  INSERT INTO public.payment_refunds(payment_id, amount_minor, reason, admin_id, idempotency_key) VALUES (p.id, p_amount_minor, btrim(p_reason), p_admin, p_idempotency_key) RETURNING id INTO v_id;
  -- Money returned to the card must first leave the wallet (fails if the customer already spent it).
  PERFORM public._wallet_post(p.user_id, -v_amt, 'refund', 'payment_refund', v_id, 'prf:' || v_id, 'استرداد إلكتروني للعملية ' || p.internal_payment_id, p_admin, NULL, false);
  UPDATE public.payment_refunds SET wallet_reversed = true WHERE id = v_id;
  RETURN jsonb_build_object('duplicate', false, 'refund_id', v_id, 'provider_payment_id', p.provider_payment_id, 'amount_minor', p_amount_minor);
END; $$;

CREATE OR REPLACE FUNCTION public.payment_refund_finish(p_refund_id uuid, p_success boolean, p_failure text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; p record; v_amt numeric;
BEGIN
  SELECT * INTO r FROM public.payment_refunds WHERE id = p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND'; END IF;
  IF r.status <> 'pending' THEN RETURN jsonb_build_object('duplicate', true, 'status', r.status); END IF;
  SELECT * INTO p FROM public.payments WHERE id = r.payment_id FOR UPDATE;
  v_amt := round(r.amount_minor::numeric / 100, 2);
  IF p_success THEN
    UPDATE public.payment_refunds SET status = 'succeeded', updated_at = now() WHERE id = r.id;
    UPDATE public.payments SET refunded_minor = refunded_minor + r.amount_minor,
      status = CASE WHEN refunded_minor + r.amount_minor >= amount_minor THEN 'refunded' ELSE 'partially_refunded' END WHERE id = p.id;
    INSERT INTO public.notifications(user_id, title, message, type)
    VALUES (p.user_id, 'تمت معالجة الاسترداد', 'تم استرداد ' || to_char(v_amt, 'FM999999990.00') || ' ر.س للعملية ' || p.internal_payment_id, 'info');
  ELSE
    UPDATE public.payment_refunds SET status = 'failed', failure_code = left(coalesce(p_failure,'provider_error'),60), updated_at = now() WHERE id = r.id;
    IF r.wallet_reversed THEN
      PERFORM public._wallet_post(p.user_id, v_amt, 'refund', 'payment_refund', r.id, 'prf-undo:' || r.id, 'إلغاء استرداد لم يكتمل ' || p.internal_payment_id, r.admin_id, NULL, false);
    END IF;
  END IF;
  INSERT INTO public.payment_events(payment_id, source, event_type, details) VALUES (p.id, 'admin', CASE WHEN p_success THEN 'refund_succeeded' ELSE 'refund_failed' END, jsonb_build_object('amount_minor', r.amount_minor));
  RETURN jsonb_build_object('duplicate', false, 'status', CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END);
END; $$;

REVOKE ALL ON FUNCTION public._quote_service_order(uuid,int,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._pay_service_order_as(uuid,uuid,int,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_create(uuid,text,uuid,jsonb,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_apply_verified(uuid,text,text,bigint,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_refund_prepare(uuid,bigint,text,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_refund_finish(uuid,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._quote_service_order(uuid,int,text), public._pay_service_order_as(uuid,uuid,int,text,text,text,text,text),
  public.payment_create(uuid,text,uuid,jsonb,text,text), public.payment_apply_verified(uuid,text,text,bigint,text,text,text,text,text),
  public.payment_refund_prepare(uuid,bigint,text,uuid,text), public.payment_refund_finish(uuid,boolean,text) TO service_role;
