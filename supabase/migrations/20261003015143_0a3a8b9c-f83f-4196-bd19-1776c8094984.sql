ALTER TABLE public.cloud_orders
  ADD COLUMN IF NOT EXISTS provider_server_cost numeric,
  ADD COLUMN IF NOT EXISTS provider_ipv4_cost numeric,
  ADD COLUMN IF NOT EXISTS provider_backup_cost numeric,
  ADD COLUMN IF NOT EXISTS provider_addons_cost numeric,
  ADD COLUMN IF NOT EXISTS raw_provider_cost numeric,
  ADD COLUMN IF NOT EXISTS retail_server_price numeric,
  ADD COLUMN IF NOT EXISTS retail_ipv4_price numeric,
  ADD COLUMN IF NOT EXISTS retail_backup_price numeric,
  ADD COLUMN IF NOT EXISTS retail_addons_price numeric,
  ADD COLUMN IF NOT EXISTS gross_profit numeric,
  ADD COLUMN IF NOT EXISTS gross_margin_pct numeric,
  ADD COLUMN IF NOT EXISTS ipv4_selected boolean,
  ADD COLUMN IF NOT EXISTS backups_selected boolean,
  ADD COLUMN IF NOT EXISTS included_traffic_tb numeric,
  ADD COLUMN IF NOT EXISTS traffic_overage_price numeric,
  ADD COLUMN IF NOT EXISTS traffic_overage_currency text;

DROP FUNCTION IF EXISTS public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text);

CREATE OR REPLACE FUNCTION public.order_cloud_server(p_plan_id uuid, p_location text, p_image text, p_name text, p_hostname text, p_ssh_key_id uuid, p_backups boolean, p_idempotency_key text, p_ipv4 boolean DEFAULT false)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_plan cloud_plans; v_set cloud_billing_settings; v_ps cloud_pricing_settings; v_cost cloud_plan_costs;
  v_img cloud_images; v_pp cloud_provider_prices; v_existing cloud_orders;
  v_ploc text; v_rate numeric; v_bal numeric; v_id uuid; v_order uuid; v_status text;
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

  -- Plan / location / image validation
  SELECT * INTO v_plan FROM cloud_plans WHERE id = p_plan_id AND is_active AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'plan not available'; END IF;
  IF NOT (p_location = ANY(v_plan.location_codes)) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_locations WHERE code=p_location AND is_active AND customer_visible) THEN RAISE EXCEPTION 'location not available'; END IF;
  SELECT * INTO v_img FROM cloud_images WHERE code=p_image AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'image not available'; END IF;
  IF lower(COALESCE(v_img.architecture,'x86')) <> lower(COALESCE(v_plan.architecture,'x86')) THEN RAISE EXCEPTION 'image not compatible with plan architecture'; END IF;
  IF p_ssh_key_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE id=p_ssh_key_id AND user_id=v_uid) THEN RAISE EXCEPTION 'invalid ssh key'; END IF;

  -- IPv4 option
  IF v_plan.ipv4_mode = 'included' THEN v_ipv4_on := true;
  ELSIF v_plan.ipv4_mode = 'optional' THEN v_ipv4_on := COALESCE(p_ipv4,false);
    IF v_ipv4_on AND (v_plan.ipv4_retail_price IS NULL OR v_plan.ipv4_retail_price <= 0) THEN RAISE EXCEPTION 'ipv4 option not available'; END IF;
  ELSE IF COALESCE(p_ipv4,false) THEN RAISE EXCEPTION 'ipv4 option not available'; END IF; v_ipv4_on := false; END IF;
  -- Backup option
  IF v_bk AND (v_plan.retail_backup_price IS NULL OR v_plan.retail_backup_price < 0) THEN RAISE EXCEPTION 'backup option not available'; END IF;

  -- Provider cost (admin-only data, location-specific)
  SELECT * INTO v_cost FROM cloud_plan_costs WHERE plan_id = v_plan.id;
  IF v_cost.provider_id IS NULL OR v_cost.provider_ref IS NULL THEN RAISE EXCEPTION 'plan not available'; END IF;
  SELECT provider_ref INTO v_ploc FROM cloud_resource_mappings WHERE kind='location' AND code=p_location AND provider_id=v_cost.provider_id;
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

  -- Customer retail price (DB only; browser values ignored)
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

  -- Atomic debit + order (whole function is one transaction; any failure rolls back the debit)
  SELECT balance INTO v_bal FROM user_balances WHERE user_id = v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal < v_total THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE user_balances SET balance = balance - v_total, total_spent = COALESCE(total_spent,0) + v_total, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO cloud_servers (user_id, plan_id, server_type, name, hostname, status, location_code, image_code, backups_enabled, ssh_key_id, monthly_price, renewal_date, specs)
  VALUES (v_uid, v_plan.id, v_plan.server_type, trim(p_name), p_hostname, 'pending', p_location, p_image, v_bk, p_ssh_key_id, v_sub, (now() + interval '1 month')::date,
    jsonb_build_object('vcpu', v_plan.vcpu, 'cpu_model', v_plan.cpu_model, 'ram_gb', v_plan.ram_gb, 'storage_gb', v_plan.storage_gb, 'disk_type', v_plan.disk_type, 'architecture', v_plan.architecture,
      'traffic_tb', v_pp.included_traffic_tb, 'ipv4', v_ipv4_on, 'ipv6', true))
  RETURNING id INTO v_id;
  v_status := CASE WHEN v_ps.provisioning_mode = 'automatic' THEN 'queued' ELSE 'awaiting_approval' END;
  INSERT INTO cloud_orders (user_id, server_id, plan_id, idempotency_key, transaction_reference, subtotal, vat_rate, vat_amount, total, status, location_code,
    provider_cost_original, provider_currency, exchange_rate_used, provider_cost_sar, cost_buffer_pct, adjusted_cost_sar, retail_price_before_vat,
    provider_server_cost, provider_ipv4_cost, provider_backup_cost, provider_addons_cost, raw_provider_cost,
    retail_server_price, retail_ipv4_price, retail_backup_price, retail_addons_price, gross_profit, gross_margin_pct,
    ipv4_selected, backups_selected, included_traffic_tb, traffic_overage_price, traffic_overage_currency)
  VALUES (v_uid, v_id, v_plan.id, p_idempotency_key, 'CLD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), v_sub, v_set.vat_rate, v_vat, v_total, v_status, p_location,
    c_raw, v_ps.provider_currency, v_rate, round(c_raw * v_rate, 4), v_ps.cost_buffer_pct, c_adj, v_sub,
    c_server, c_ipv4, c_backup, c_addons, c_raw, r_server, r_ipv4, r_backup, r_addons, v_profit, CASE WHEN v_sub > 0 THEN round(v_profit / v_sub * 100, 2) END,
    v_ipv4_on, v_bk, v_pp.included_traffic_tb, v_pp.overage_price_per_tb, CASE WHEN v_pp.overage_price_per_tb IS NOT NULL THEN v_pp.currency END)
  RETURNING id INTO v_order;
  INSERT INTO cloud_provisioning_jobs (order_id, server_id, status) VALUES (v_order, v_id, v_status);
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (v_uid, v_id, 'server_ordered', jsonb_build_object('total', v_total, 'plan', v_plan.code, 'order_id', v_order));
  RETURN jsonb_build_object('server_id', v_id, 'order_id', v_order, 'subtotal', v_sub, 'vat', v_vat, 'total', v_total);
END $function$;

REVOKE ALL ON FUNCTION public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_cloud_server(uuid, text, text, text, text, uuid, boolean, text, boolean) TO authenticated;