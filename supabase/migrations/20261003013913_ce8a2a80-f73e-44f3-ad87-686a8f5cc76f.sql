
CREATE TABLE public.cloud_pricing_settings (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), selling_currency text NOT NULL DEFAULT 'SAR', provider_currency text NOT NULL DEFAULT 'EUR', rate_mode text NOT NULL DEFAULT 'auto', auto_rate numeric, auto_rate_source text, auto_rate_updated_at timestamptz, manual_rate numeric NOT NULL DEFAULT 4.0, cost_buffer_pct numeric NOT NULL DEFAULT 3, min_margin_pct numeric NOT NULL DEFAULT 20, rate_stale_hours int NOT NULL DEFAULT 48, provisioning_mode text NOT NULL DEFAULT 'manual_approval', updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO public.cloud_pricing_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.cloud_provider_prices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_id uuid NOT NULL REFERENCES public.cloud_providers(id) ON DELETE CASCADE, server_type text NOT NULL, location text NOT NULL, currency text NOT NULL DEFAULT 'EUR', monthly_net numeric NOT NULL, monthly_gross numeric, hourly_net numeric, included_traffic_tb numeric, previous_monthly_net numeric, changed_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider_id, server_type, location));
CREATE TABLE public.cloud_plan_location_prices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES public.cloud_plans(id) ON DELETE CASCADE, location_code text NOT NULL, monthly_price numeric NOT NULL CHECK (monthly_price > 0), UNIQUE(plan_id, location_code));
CREATE TABLE public.cloud_price_alerts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL, plan_id uuid REFERENCES public.cloud_plans(id) ON DELETE CASCADE, server_type text, location text, old_value numeric, new_value numeric, message text, resolved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

ALTER TABLE public.cloud_plans ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'same', ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'cloud_vps';
ALTER TABLE public.cloud_orders ADD COLUMN IF NOT EXISTS location_code text, ADD COLUMN IF NOT EXISTS provider_cost_original numeric, ADD COLUMN IF NOT EXISTS provider_currency text, ADD COLUMN IF NOT EXISTS exchange_rate_used numeric, ADD COLUMN IF NOT EXISTS provider_cost_sar numeric, ADD COLUMN IF NOT EXISTS cost_buffer_pct numeric, ADD COLUMN IF NOT EXISTS adjusted_cost_sar numeric, ADD COLUMN IF NOT EXISTS retail_price_before_vat numeric;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_pricing_settings, public.cloud_provider_prices, public.cloud_plan_location_prices, public.cloud_price_alerts TO authenticated;
GRANT ALL ON public.cloud_pricing_settings, public.cloud_provider_prices, public.cloud_plan_location_prices, public.cloud_price_alerts TO service_role;
ALTER TABLE public.cloud_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_provider_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_plan_location_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin pricing settings" ON public.cloud_pricing_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin provider prices" ON public.cloud_provider_prices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin price alerts" ON public.cloud_price_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "view location prices" ON public.cloud_plan_location_prices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.cloud_plans p WHERE p.id = plan_id AND (p.is_active OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admin location prices" ON public.cloud_plan_location_prices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.cloud_effective_rate() RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN s.rate_mode = 'auto' AND s.auto_rate IS NOT NULL AND s.auto_rate > 0 THEN s.auto_rate ELSE s.manual_rate END FROM cloud_pricing_settings s WHERE id = 1
$$;
REVOKE ALL ON FUNCTION public.cloud_effective_rate() FROM public, anon, authenticated;

DROP FUNCTION IF EXISTS public.order_cloud_server(uuid,text,text,text,text,uuid,boolean,text);
CREATE OR REPLACE FUNCTION public.order_cloud_server(p_plan_id uuid, p_location text, p_image text, p_name text, p_hostname text, p_ssh_key_id uuid, p_backups boolean, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_plan cloud_plans; v_set cloud_billing_settings; v_ps cloud_pricing_settings; v_cost cloud_plan_costs;
  v_retail numeric; v_sub numeric; v_vat numeric; v_total numeric; v_bal numeric; v_id uuid; v_order uuid; v_existing cloud_orders;
  v_ploc text; v_pcost numeric; v_rate numeric; v_cost_sar numeric; v_adj numeric; v_status text;
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
  SELECT * INTO v_plan FROM cloud_plans WHERE id = p_plan_id AND is_active AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'plan not available'; END IF;
  IF NOT (p_location = ANY(v_plan.location_codes)) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_locations WHERE code=p_location AND is_active) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_images WHERE code=p_image AND is_active) THEN RAISE EXCEPTION 'image not available'; END IF;
  IF p_ssh_key_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE id=p_ssh_key_id AND user_id=v_uid) THEN RAISE EXCEPTION 'invalid ssh key'; END IF;

  -- Retail price always loaded server-side
  IF v_plan.pricing_mode = 'location' THEN
    SELECT monthly_price INTO v_retail FROM cloud_plan_location_prices WHERE plan_id = v_plan.id AND location_code = p_location;
    IF v_retail IS NULL THEN RAISE EXCEPTION 'location not available'; END IF;
  ELSE v_retail := v_plan.monthly_price; END IF;
  IF v_retail IS NULL OR v_retail <= 0 THEN RAISE EXCEPTION 'plan not available'; END IF;

  SELECT * INTO v_set FROM cloud_billing_settings WHERE id = 1;
  SELECT * INTO v_ps FROM cloud_pricing_settings WHERE id = 1;
  v_sub := round(v_retail * (CASE WHEN p_backups THEN 1 + v_set.backups_surcharge ELSE 1 END) + v_plan.setup_fee, 2);
  v_vat := round(v_sub * v_set.vat_rate, 2);
  v_total := v_sub + v_vat;

  -- Cost snapshot (admin-only data)
  SELECT * INTO v_cost FROM cloud_plan_costs WHERE plan_id = v_plan.id;
  IF v_cost.provider_id IS NOT NULL AND v_cost.provider_ref IS NOT NULL THEN
    SELECT provider_ref INTO v_ploc FROM cloud_resource_mappings WHERE kind='location' AND code=p_location AND provider_id=v_cost.provider_id;
    SELECT monthly_net INTO v_pcost FROM cloud_provider_prices WHERE provider_id=v_cost.provider_id AND server_type=v_cost.provider_ref AND location=COALESCE(v_ploc, p_location);
  END IF;
  v_rate := public.cloud_effective_rate();
  IF v_pcost IS NOT NULL THEN v_cost_sar := round(v_pcost * v_rate, 4); ELSE v_cost_sar := v_cost.infra_cost; END IF;
  v_adj := round(COALESCE(v_cost_sar,0) * (1 + COALESCE(v_ps.cost_buffer_pct,0)/100), 4);

  SELECT balance INTO v_bal FROM user_balances WHERE user_id = v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal < v_total THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE user_balances SET balance = balance - v_total, total_spent = COALESCE(total_spent,0) + v_total, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO cloud_servers (user_id, plan_id, server_type, name, hostname, status, location_code, image_code, backups_enabled, ssh_key_id, monthly_price, renewal_date, specs)
  VALUES (v_uid, v_plan.id, v_plan.server_type, trim(p_name), p_hostname, 'pending', p_location, p_image, COALESCE(p_backups,false), p_ssh_key_id, v_retail, (now() + interval '1 month')::date,
    jsonb_build_object('vcpu', v_plan.vcpu, 'cpu_model', v_plan.cpu_model, 'ram_gb', v_plan.ram_gb, 'storage_gb', v_plan.storage_gb, 'disk_type', v_plan.disk_type, 'traffic_tb', v_plan.traffic_tb))
  RETURNING id INTO v_id;
  v_status := CASE WHEN v_ps.provisioning_mode = 'automatic' THEN 'queued' ELSE 'awaiting_approval' END;
  INSERT INTO cloud_orders (user_id, server_id, plan_id, idempotency_key, transaction_reference, subtotal, vat_rate, vat_amount, total, status, location_code,
    provider_cost_original, provider_currency, exchange_rate_used, provider_cost_sar, cost_buffer_pct, adjusted_cost_sar, retail_price_before_vat)
  VALUES (v_uid, v_id, v_plan.id, p_idempotency_key, 'CLD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), v_sub, v_set.vat_rate, v_vat, v_total, v_status, p_location,
    v_pcost, CASE WHEN v_pcost IS NOT NULL THEN v_ps.provider_currency END, CASE WHEN v_pcost IS NOT NULL THEN v_rate END, v_cost_sar, v_ps.cost_buffer_pct, v_adj, v_sub)
  RETURNING id INTO v_order;
  INSERT INTO cloud_provisioning_jobs (order_id, server_id, status) VALUES (v_order, v_id, v_status);
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (v_uid, v_id, 'server_ordered', jsonb_build_object('total', v_total, 'plan', v_plan.code, 'order_id', v_order));
  RETURN jsonb_build_object('server_id', v_id, 'order_id', v_order, 'total', v_total);
END $$;
REVOKE ALL ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean,text) TO authenticated;
