-- 1. Billing settings: admin/server only + safe public whitelist
DROP POLICY IF EXISTS "read billing settings" ON public.cloud_billing_settings;
CREATE POLICY "admins read billing settings" ON public.cloud_billing_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.cloud_public_checkout_config()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('vat_rate', vat_rate, 'backups_surcharge', backups_surcharge, 'currency', currency) FROM public.cloud_billing_settings WHERE id = 1
$$;
REVOKE ALL ON FUNCTION public.cloud_public_checkout_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloud_public_checkout_config() TO authenticated, service_role;

-- 2. Launch guard
CREATE TABLE public.cloud_launch_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_new_per_window int NOT NULL DEFAULT 10 CHECK (max_new_per_window >= 0),
  window_hours int NOT NULL DEFAULT 24 CHECK (window_hours > 0),
  reservation_ttl_minutes int NOT NULL DEFAULT 15 CHECK (reservation_ttl_minutes BETWEEN 1 AND 120),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, UPDATE ON public.cloud_launch_settings TO authenticated;
GRANT ALL ON public.cloud_launch_settings TO service_role;
ALTER TABLE public.cloud_launch_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read launch settings" ON public.cloud_launch_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update launch settings" ON public.cloud_launch_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.cloud_launch_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.cloud_launch_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','consumed','released','expired')),
  expires_at timestamptz NOT NULL,
  order_id uuid,
  consumed_at timestamptz,
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX cloud_launch_res_window ON public.cloud_launch_reservations (is_simulation, status, created_at);
GRANT SELECT ON public.cloud_launch_reservations TO authenticated;
GRANT ALL ON public.cloud_launch_reservations TO service_role;
ALTER TABLE public.cloud_launch_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reservations" ON public.cloud_launch_reservations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public._cloud_reserve_launch_slot(p_user uuid, p_plan uuid, p_key text, p_sim boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s cloud_launch_settings; r cloud_launch_reservations; v_used int;
BEGIN
  IF p_user IS NULL OR p_key IS NULL OR length(p_key) < 8 OR length(p_key) > 120 THEN RAISE EXCEPTION 'invalid reservation key'; END IF;
  -- One global lock serialises all reservations, so concurrent callers can never exceed the limit.
  PERFORM pg_advisory_xact_lock(hashtext('cloud_launch_guard:' || p_sim::text));
  SELECT * INTO s FROM cloud_launch_settings WHERE id = 1;
  UPDATE cloud_launch_reservations SET status = 'expired' WHERE status = 'reserved' AND expires_at <= now() AND is_simulation = p_sim;
  SELECT * INTO r FROM cloud_launch_reservations WHERE user_id = p_user AND idempotency_key = p_key;
  IF FOUND THEN
    IF r.status IN ('reserved','consumed') THEN RETURN jsonb_build_object('ok', true, 'reservation_id', r.id, 'expires_at', r.expires_at, 'status', r.status, 'duplicate', true); END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'reservation_' || r.status);
  END IF;
  SELECT count(*) INTO v_used FROM cloud_launch_reservations
   WHERE is_simulation = p_sim AND ((status = 'consumed' AND consumed_at > now() - make_interval(hours => s.window_hours)) OR (status = 'reserved' AND expires_at > now()));
  IF v_used >= s.max_new_per_window THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'capacity_full', 'used', v_used, 'limit', s.max_new_per_window);
  END IF;
  INSERT INTO cloud_launch_reservations (user_id, plan_id, idempotency_key, expires_at, is_simulation)
  VALUES (p_user, p_plan, p_key, now() + make_interval(mins => s.reservation_ttl_minutes), p_sim) RETURNING * INTO r;
  RETURN jsonb_build_object('ok', true, 'reservation_id', r.id, 'expires_at', r.expires_at, 'status', 'reserved', 'used', v_used + 1, 'limit', s.max_new_per_window);
END $$;
REVOKE ALL ON FUNCTION public._cloud_reserve_launch_slot(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._cloud_reserve_launch_slot(uuid, uuid, text, boolean) TO service_role;

-- Customer-callable: check + reserve before payment.
CREATE OR REPLACE FUNCTION public.cloud_reserve_launch_slot(p_plan_id uuid, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_plans WHERE id = p_plan_id AND status = 'active' AND is_active) THEN RETURN jsonb_build_object('ok', false, 'reason', 'plan_not_available'); END IF;
  RETURN public._cloud_reserve_launch_slot(auth.uid(), p_plan_id, p_idempotency_key, false);
END $$;
REVOKE ALL ON FUNCTION public.cloud_reserve_launch_slot(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloud_reserve_launch_slot(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cloud_launch_capacity()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('limit', s.max_new_per_window, 'window_hours', s.window_hours,
    'used', (SELECT count(*) FROM cloud_launch_reservations r WHERE NOT r.is_simulation AND ((r.status='consumed' AND r.consumed_at > now() - make_interval(hours => s.window_hours)) OR (r.status='reserved' AND r.expires_at > now()))))
  FROM cloud_launch_settings s WHERE s.id = 1
$$;
REVOKE ALL ON FUNCTION public.cloud_launch_capacity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloud_launch_capacity() TO authenticated, service_role;

-- 3. Provisioning job state machine columns
ALTER TABLE public.cloud_provisioning_jobs
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS phase_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS readiness jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reconciliation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_reason text,
  ADD COLUMN IF NOT EXISTS is_simulation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_id uuid;
ALTER TABLE public.cloud_orders ADD COLUMN IF NOT EXISTS is_simulation boolean NOT NULL DEFAULT false;

CREATE TABLE public.cloud_provisioning_keys (
  job_id uuid PRIMARY KEY REFERENCES public.cloud_provisioning_jobs(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  private_key_enc text NOT NULL,
  iv text NOT NULL,
  provider_key_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cloud_provisioning_keys TO service_role;
ALTER TABLE public.cloud_provisioning_keys ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cloud_prov_allowed(p_from text, p_to text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_to = ANY (CASE p_from
    WHEN 'awaiting_approval' THEN ARRAY['queued','manual_review']
    WHEN 'queued' THEN ARRAY['provisioning','manual_review','reconciliation']
    WHEN 'provisioning' THEN ARRAY['configuring','provisioning_failed','reconciliation','manual_review','queued']
    WHEN 'configuring' THEN ARRAY['active','provisioning_failed','manual_review']
    WHEN 'provisioning_failed' THEN ARRAY['reconciliation','manual_review']
    WHEN 'reconciliation' THEN ARRAY['provisioning','configuring','queued','manual_review','refund_eligible']
    WHEN 'manual_review' THEN ARRAY['reconciliation','queued','refund_eligible']
    WHEN 'refund_eligible' THEN ARRAY['refunded','reconciliation']
    ELSE ARRAY[]::text[] END)
$$;

-- Atomic claim: only one worker (or admin recovery) holds a job at a time.
CREATE OR REPLACE FUNCTION public.cloud_claim_provisioning_job(p_job uuid, p_worker text, p_ttl_seconds int DEFAULT 300)
RETURNS public.cloud_provisioning_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j cloud_provisioning_jobs;
BEGIN
  UPDATE cloud_provisioning_jobs SET locked_until = now() + make_interval(secs => p_ttl_seconds), locked_by = p_worker, updated_at = now()
   WHERE id = p_job AND status IN ('queued','provisioning','configuring','reconciliation','provisioning_failed')
     AND (locked_until IS NULL OR locked_until < now()) AND (next_attempt_at IS NULL OR next_attempt_at <= now())
  RETURNING * INTO j;
  RETURN j;
END $$;

CREATE OR REPLACE FUNCTION public.cloud_release_provisioning_job(p_job uuid, p_worker text, p_retry_in_seconds int DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE cloud_provisioning_jobs SET locked_until = NULL, locked_by = NULL,
    next_attempt_at = CASE WHEN p_retry_in_seconds IS NULL THEN next_attempt_at ELSE now() + make_interval(secs => p_retry_in_seconds) END, updated_at = now()
  WHERE id = p_job AND locked_by = p_worker
$$;

-- The only way to move a provisioning job. Requires the lock; never overwrites a provider id.
CREATE OR REPLACE FUNCTION public.cloud_set_provisioning_state(p_job uuid, p_worker text, p_to text, p_fields jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j cloud_provisioning_jobs; v_ref text := nullif(p_fields->>'provider_resource_id','');
BEGIN
  SELECT * INTO j FROM cloud_provisioning_jobs WHERE id = p_job FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'job not found'; END IF;
  IF j.locked_by IS DISTINCT FROM p_worker OR j.locked_until < now() THEN RAISE EXCEPTION 'job lock not held'; END IF;
  IF j.status <> p_to AND NOT public.cloud_prov_allowed(j.status, p_to) THEN RAISE EXCEPTION 'INVALID_PROVISIONING_TRANSITION % -> %', j.status, p_to; END IF;
  IF v_ref IS NOT NULL AND j.provider_resource_id IS NOT NULL AND j.provider_resource_id <> v_ref THEN RAISE EXCEPTION 'provider resource already bound'; END IF;
  IF p_to = 'active' AND NOT COALESCE((p_fields->'readiness'->>'all_passed')::boolean, false) THEN RAISE EXCEPTION 'readiness not proven'; END IF;
  UPDATE cloud_provisioning_jobs SET
    status = p_to,
    provider_resource_id = COALESCE(j.provider_resource_id, v_ref),
    provider_request_id = COALESCE(p_fields->>'provider_request_id', provider_request_id),
    attempt_count = attempt_count + COALESCE((p_fields->>'attempt_inc')::int, 0),
    last_attempt_at = CASE WHEN (p_fields ? 'attempt_inc') THEN now() ELSE last_attempt_at END,
    phase_started_at = CASE WHEN j.status <> p_to THEN now() ELSE phase_started_at END,
    readiness = COALESCE(p_fields->'readiness', readiness),
    reconciliation = COALESCE(p_fields->'reconciliation', reconciliation),
    error_code = CASE WHEN p_fields ? 'error_code' THEN p_fields->>'error_code' ELSE error_code END,
    safe_error = CASE WHEN p_fields ? 'error_code' THEN 'جاري معالجة طلبك' ELSE safe_error END,
    manual_reason = COALESCE(p_fields->>'manual_reason', manual_reason),
    updated_at = now()
  WHERE id = p_job;

  -- Mirror customer-visible state. Customers never see raw provider errors.
  IF p_to IN ('provisioning','configuring') THEN
    UPDATE cloud_servers SET status = p_to,
      provider_server_id = COALESCE(provider_server_id, v_ref), provider = COALESCE(provider, p_fields->>'provider'),
      primary_ipv4 = COALESCE(p_fields->>'ipv4', primary_ipv4), primary_ipv6 = COALESCE(p_fields->>'ipv6', primary_ipv6)
     WHERE id = j.server_id;
    UPDATE cloud_orders SET status = 'provisioning', updated_at = now() WHERE id = j.order_id;
    UPDATE cloud_subscriptions SET status = 'provisioning' WHERE order_id = j.order_id AND status = 'paid';
  ELSIF p_to = 'active' THEN
    UPDATE cloud_servers SET status = 'running', primary_ipv4 = COALESCE(p_fields->>'ipv4', primary_ipv4), primary_ipv6 = COALESCE(p_fields->>'ipv6', primary_ipv6) WHERE id = j.server_id;
    UPDATE cloud_orders SET status = 'active', updated_at = now() WHERE id = j.order_id;
    UPDATE cloud_subscriptions SET status = 'provisioning' WHERE order_id = j.order_id AND status = 'paid';
    UPDATE cloud_subscriptions SET status = 'active', started_at = COALESCE(started_at, now()) WHERE order_id = j.order_id AND status = 'provisioning';
  ELSIF p_to IN ('manual_review','refund_eligible','provisioning_failed') THEN
    UPDATE cloud_orders SET status = p_to, updated_at = now() WHERE id = j.order_id;
    UPDATE cloud_subscriptions SET status = 'provisioning' WHERE order_id = j.order_id AND status = 'paid';
    UPDATE cloud_subscriptions SET status = 'provisioning_failed', failure_reason = 'provisioning' WHERE order_id = j.order_id AND status = 'provisioning';
    PERFORM public._cloud_alert('provisioning_' || p_to, 'critical', 'Paid cloud order needs attention: ' || p_to,
      'prov:' || j.id || ':' || p_to || ':' || COALESCE(p_fields->>'error_code',''), jsonb_build_object('job', j.id, 'order', j.order_id, 'reason', COALESCE(p_fields->>'manual_reason', p_fields->>'error_code')), j.is_simulation);
  END IF;
  RETURN jsonb_build_object('ok', true, 'from', j.status, 'to', p_to);
END $$;

REVOKE ALL ON FUNCTION public.cloud_claim_provisioning_job(uuid, text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_release_provisioning_job(uuid, text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_set_provisioning_state(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_claim_provisioning_job(uuid, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloud_release_provisioning_job(uuid, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloud_set_provisioning_state(uuid, text, text, jsonb) TO service_role;

-- Safe refund: once, exact amount, only when provider resource is confirmed absent.
CREATE OR REPLACE FUNCTION public.cloud_refund_failed_order(p_order uuid, p_actor uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o cloud_orders; j cloud_provisioning_jobs; s cloud_servers; w jsonb; v_actor uuid := COALESCE(auth.uid(), p_actor);
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO o FROM cloud_orders WHERE id = p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF o.refunded_at IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'duplicate', true, 'amount', o.refund_amount); END IF;
  SELECT * INTO j FROM cloud_provisioning_jobs WHERE order_id = p_order FOR UPDATE;
  SELECT * INTO s FROM cloud_servers WHERE id = o.server_id;
  IF j.status <> 'refund_eligible' THEN RAISE EXCEPTION 'order not refund eligible'; END IF;
  IF j.provider_resource_id IS NOT NULL OR s.provider_server_id IS NOT NULL THEN RAISE EXCEPTION 'provider resource exists, refund blocked'; END IF;
  IF NOT COALESCE((j.reconciliation->>'absent_confirmed')::boolean, false) THEN RAISE EXCEPTION 'provider absence not confirmed'; END IF;
  IF o.is_simulation THEN
    w := jsonb_build_object('simulated', true);
  ELSE
    w := public._wallet_post(o.user_id, o.total, 'refund', 'cloud_order_refund', o.id, 'cloud_refund:' || o.id, 'Cloud order refund (provisioning failed)', v_actor, NULL, true);
  END IF;
  UPDATE cloud_orders SET refunded_at = now(), refund_amount = o.total, status = 'refunded', updated_at = now() WHERE id = o.id;
  UPDATE cloud_provisioning_jobs SET status = 'refunded', updated_at = now() WHERE id = j.id;
  UPDATE cloud_servers SET status = 'cancelled', cancelled_at = now() WHERE id = o.server_id;
  UPDATE cloud_subscriptions SET status = 'terminated', terminated_at = now() WHERE order_id = o.id AND status = 'provisioning_failed';
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (o.user_id, o.server_id, 'order_refunded', jsonb_build_object('amount', o.total, 'order_id', o.id));
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'amount', o.total, 'wallet', w);
END $$;
REVOKE ALL ON FUNCTION public.cloud_refund_failed_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloud_refund_failed_order(uuid, uuid) TO authenticated, service_role;

-- 4. order_cloud_server: launch guard before charge, central wallet path, paid -> queue.
DROP FUNCTION IF EXISTS public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text, boolean);
CREATE FUNCTION public.order_cloud_server(p_plan_id uuid, p_location text, p_image text, p_name text, p_hostname text, p_ssh_key_id uuid, p_backups boolean, p_idempotency_key text, p_ipv4 boolean DEFAULT false, p_reservation_id uuid DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_plan cloud_plans; v_set cloud_billing_settings; v_ps cloud_pricing_settings; v_cost cloud_plan_costs;
  v_img cloud_images; v_pp cloud_provider_prices; v_existing cloud_orders; v_grant cloud_e2e_customer_grants; v_res cloud_launch_reservations; v_rj jsonb;
  v_ploc text; v_rate numeric; v_bal numeric; v_id uuid; v_order uuid := gen_random_uuid(); v_e2e boolean := false; v_job uuid;
  v_ipv4_on boolean; v_bk boolean := COALESCE(p_backups,false);
  c_server numeric; c_ipv4 numeric := 0; c_backup numeric := 0; c_addons numeric := 0; c_raw numeric; c_adj numeric; v_ip_price numeric; v_bk_pct numeric;
  r_server numeric; r_ipv4 numeric := 0; r_backup numeric := 0; r_addons numeric := 0; v_sub numeric; v_vat numeric; v_total numeric; v_profit numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 16 OR length(p_idempotency_key) > 100 THEN RAISE EXCEPTION 'invalid idempotency key'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cloud_order:' || p_idempotency_key));
  SELECT * INTO v_existing FROM cloud_orders WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.user_id <> v_uid THEN RAISE EXCEPTION 'invalid idempotency key'; END IF;
    RETURN jsonb_build_object('server_id', v_existing.server_id, 'order_id', v_existing.id, 'total', v_existing.total, 'duplicate', true);
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 OR length(p_name) > 63 THEN RAISE EXCEPTION 'invalid name'; END IF;

  SELECT * INTO v_plan FROM cloud_plans WHERE id = p_plan_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'plan not available'; END IF;
  IF NOT v_plan.is_active THEN
    SELECT * INTO v_grant FROM cloud_e2e_customer_grants WHERE user_id = v_uid AND plan_id = v_plan.id AND location_code = p_location AND image_code = p_image AND used_at IS NULL AND expires_at > now() FOR UPDATE LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'plan not available'; END IF;
    v_e2e := true;
  END IF;
  IF NOT (p_location = ANY(v_plan.location_codes)) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_locations WHERE code=p_location AND is_active AND customer_visible) THEN RAISE EXCEPTION 'location not available'; END IF;
  SELECT * INTO v_img FROM cloud_images WHERE code=p_image AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'image not available'; END IF;
  IF lower(COALESCE(v_img.architecture,'x86')) <> lower(COALESCE(v_plan.architecture,'x86')) THEN RAISE EXCEPTION 'image not compatible with plan architecture'; END IF;
  IF p_ssh_key_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE id=p_ssh_key_id AND user_id=v_uid) THEN RAISE EXCEPTION 'invalid ssh key'; END IF;

  IF v_plan.ipv4_mode = 'included' THEN v_ipv4_on := true;
  ELSIF v_plan.ipv4_mode = 'optional' THEN v_ipv4_on := COALESCE(p_ipv4,false);
    IF v_ipv4_on AND (v_plan.ipv4_retail_price IS NULL OR v_plan.ipv4_retail_price <= 0) THEN RAISE EXCEPTION 'ipv4 option not available'; END IF;
  ELSE IF COALESCE(p_ipv4,false) THEN RAISE EXCEPTION 'ipv4 option not available'; END IF; v_ipv4_on := false; END IF;
  IF v_bk AND (v_plan.retail_backup_price IS NULL OR v_plan.retail_backup_price < 0) THEN RAISE EXCEPTION 'backup option not available'; END IF;

  SELECT * INTO v_cost FROM cloud_plan_costs WHERE plan_id = v_plan.id;
  IF v_cost.provider_id IS NULL OR v_cost.provider_ref IS NULL THEN RAISE EXCEPTION 'plan not available'; END IF;
  SELECT provider_ref INTO v_ploc FROM cloud_resource_mappings WHERE kind='location' AND code=p_location AND provider_id=v_cost.provider_id;
  IF v_ploc IS NULL OR NOT EXISTS (SELECT 1 FROM cloud_resource_mappings WHERE kind='image' AND code=p_image AND provider_id=v_cost.provider_id) THEN RAISE EXCEPTION 'location not available'; END IF;
  SELECT * INTO v_pp FROM cloud_provider_prices WHERE provider_id=v_cost.provider_id AND server_type=v_cost.provider_ref AND location=COALESCE(v_ploc, p_location);
  IF NOT FOUND OR v_pp.monthly_net IS NULL THEN RAISE EXCEPTION 'location not available'; END IF;
  c_server := v_pp.monthly_net;
  IF v_ipv4_on THEN
    SELECT price_net INTO v_ip_price FROM cloud_provider_addon_prices WHERE provider_id=v_cost.provider_id AND resource='primary_ip' AND variant='ipv4' AND location=v_pp.location AND pricing_available;
    IF v_ip_price IS NULL THEN RAISE EXCEPTION 'pricing unavailable'; END IF;
    c_ipv4 := v_ip_price;
  END IF;
  IF v_bk THEN
    SELECT percentage INTO v_bk_pct FROM cloud_provider_addon_prices WHERE provider_id=v_cost.provider_id AND resource='backup' AND pricing_available;
    IF v_bk_pct IS NULL THEN RAISE EXCEPTION 'pricing unavailable'; END IF;
    c_backup := round(c_server * v_bk_pct / 100, 4);
  END IF;
  c_raw := c_server + c_ipv4 + c_backup + c_addons;
  SELECT * INTO v_ps FROM cloud_pricing_settings WHERE id = 1;
  v_rate := public.cloud_effective_rate();
  IF v_rate IS NULL OR v_rate <= 0 THEN RAISE EXCEPTION 'pricing unavailable'; END IF;
  c_adj := round(c_raw * v_rate * (1 + COALESCE(v_ps.cost_buffer_pct,0)/100), 4);

  IF v_plan.pricing_mode = 'location' THEN
    SELECT monthly_price INTO r_server FROM cloud_plan_location_prices WHERE plan_id = v_plan.id AND location_code = p_location;
  ELSE r_server := v_plan.monthly_price; END IF;
  IF r_server IS NULL OR r_server <= 0 THEN RAISE EXCEPTION 'plan not available'; END IF;
  IF v_plan.ipv4_mode = 'optional' AND v_ipv4_on THEN r_ipv4 := v_plan.ipv4_retail_price; END IF;
  IF v_bk THEN r_backup := v_plan.retail_backup_price; END IF;
  SELECT * INTO v_set FROM cloud_billing_settings WHERE id = 1;
  v_sub := round(r_server + r_ipv4 + r_backup + r_addons + COALESCE(v_plan.setup_fee,0), 2);
  v_vat := round(v_sub * v_set.vat_rate, 2);
  v_total := v_sub + v_vat;
  v_profit := round(v_sub - c_adj, 2);

  -- Launch guard BEFORE any charge.
  IF NOT v_e2e THEN
    IF p_reservation_id IS NOT NULL THEN
      SELECT * INTO v_res FROM cloud_launch_reservations WHERE id = p_reservation_id AND user_id = v_uid AND NOT is_simulation FOR UPDATE;
      IF NOT FOUND OR v_res.status <> 'reserved' OR v_res.expires_at <= now() THEN RAISE EXCEPTION 'launch reservation invalid or expired'; END IF;
    ELSE
      v_rj := public._cloud_reserve_launch_slot(v_uid, v_plan.id, 'order:' || p_idempotency_key, false);
      IF NOT COALESCE((v_rj->>'ok')::boolean, false) THEN RAISE EXCEPTION 'launch capacity full'; END IF;
      SELECT * INTO v_res FROM cloud_launch_reservations WHERE id = (v_rj->>'reservation_id')::uuid FOR UPDATE;
    END IF;
  END IF;

  SELECT balance INTO v_bal FROM user_balances WHERE user_id = v_uid;
  IF v_bal IS NULL OR v_bal < v_total THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  -- Central protected wallet engine (locked, exact, idempotent, immutable ledger).
  PERFORM public._wallet_post(v_uid, -v_total, 'debit', 'cloud_order', v_order, 'cloud_order:' || p_idempotency_key,
    CASE WHEN v_e2e THEN 'E2E_TEST cloud order' ELSE 'Cloud order' END, v_uid, NULL, true);

  INSERT INTO cloud_servers (user_id, plan_id, server_type, name, hostname, status, location_code, image_code, backups_enabled, ssh_key_id, monthly_price, renewal_date, specs)
  VALUES (v_uid, v_plan.id, v_plan.server_type, trim(p_name), p_hostname, 'pending', p_location, p_image, v_bk, p_ssh_key_id, v_sub, (now() + interval '1 month')::date,
    jsonb_build_object('vcpu', v_plan.vcpu, 'cpu_model', v_plan.cpu_model, 'ram_gb', v_plan.ram_gb, 'storage_gb', v_plan.storage_gb, 'disk_type', v_plan.disk_type, 'architecture', v_plan.architecture,
      'traffic_tb', v_pp.included_traffic_tb, 'ipv4', v_ipv4_on, 'ipv6', true))
  RETURNING id INTO v_id;
  INSERT INTO cloud_orders (id, user_id, server_id, plan_id, idempotency_key, transaction_reference, subtotal, vat_rate, vat_amount, total, status, location_code, payment_method,
    provider_cost_original, provider_currency, exchange_rate_used, provider_cost_sar, cost_buffer_pct, adjusted_cost_sar, retail_price_before_vat,
    provider_server_cost, provider_ipv4_cost, provider_backup_cost, provider_addons_cost, raw_provider_cost,
    retail_server_price, retail_ipv4_price, retail_backup_price, retail_addons_price, gross_profit, gross_margin_pct,
    ipv4_selected, backups_selected, included_traffic_tb, traffic_overage_price, traffic_overage_currency, is_e2e_test)
  VALUES (v_order, v_uid, v_id, v_plan.id, p_idempotency_key, 'CLD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), v_sub, v_set.vat_rate, v_vat, v_total, 'paid', p_location, 'wallet',
    c_raw, v_ps.provider_currency, v_rate, round(c_raw * v_rate, 4), v_ps.cost_buffer_pct, c_adj, v_sub,
    c_server, c_ipv4, c_backup, c_addons, c_raw, r_server, r_ipv4, r_backup, r_addons, v_profit, CASE WHEN v_sub > 0 THEN round(v_profit / v_sub * 100, 2) END,
    v_ipv4_on, v_bk, v_pp.included_traffic_tb, v_pp.overage_price_per_tb, CASE WHEN v_pp.overage_price_per_tb IS NOT NULL THEN v_pp.currency END, v_e2e);
  INSERT INTO cloud_provisioning_jobs (order_id, server_id, status, reservation_id) VALUES (v_order, v_id, 'queued', v_res.id) RETURNING id INTO v_job;
  IF v_res.id IS NOT NULL THEN UPDATE cloud_launch_reservations SET status = 'consumed', consumed_at = now(), order_id = v_order WHERE id = v_res.id; END IF;
  INSERT INTO cloud_subscriptions (user_id, order_id, server_id, amount, vat_amount, renewal_at, is_e2e_test, status)
  VALUES (v_uid, v_order, v_id, v_sub, v_vat, (now() + interval '1 month')::date, v_e2e, 'paid');
  IF v_e2e THEN UPDATE cloud_e2e_customer_grants SET used_at = now(), order_id = v_order WHERE id = v_grant.id; END IF;
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (v_uid, v_id, 'server_ordered', jsonb_build_object('total', v_total, 'plan', v_plan.code, 'order_id', v_order));
  RETURN jsonb_build_object('server_id', v_id, 'order_id', v_order, 'job_id', v_job, 'subtotal', v_sub, 'vat', v_vat, 'total', v_total);
END $function$;
REVOKE ALL ON FUNCTION public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text, boolean, uuid) TO authenticated, service_role;