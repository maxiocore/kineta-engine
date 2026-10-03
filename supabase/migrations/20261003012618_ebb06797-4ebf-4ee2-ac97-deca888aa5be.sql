
ALTER TABLE public.cloud_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active', ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS cpu_type text, ADD COLUMN IF NOT EXISTS architecture text DEFAULT 'x86', ADD COLUMN IF NOT EXISTS ipv4_included boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS ipv6_included boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS billing_cycles text[] NOT NULL DEFAULT '{monthly}', ADD COLUMN IF NOT EXISTS cores int, ADD COLUMN IF NOT EXISTS threads int, ADD COLUMN IF NOT EXISTS disk_count int;
ALTER TABLE public.cloud_plans DROP COLUMN IF EXISTS provider_ref;
ALTER TABLE public.cloud_locations ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS cloud_available boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS dedicated_available boolean NOT NULL DEFAULT false;
ALTER TABLE public.cloud_images ADD COLUMN IF NOT EXISTS name_ar text, ADD COLUMN IF NOT EXISTS architecture text DEFAULT 'x86', ADD COLUMN IF NOT EXISTS cloud_supported boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS dedicated_supported boolean NOT NULL DEFAULT false;
ALTER TABLE public.cloud_servers ADD COLUMN IF NOT EXISTS suspended_at timestamptz, ADD COLUMN IF NOT EXISTS cancelled_at timestamptz, ADD COLUMN IF NOT EXISTS suspend_reason text;

CREATE TABLE public.cloud_providers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, type text NOT NULL, status text NOT NULL DEFAULT 'disabled', last_health_check timestamptz, last_success_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_provider_catalog (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_id uuid NOT NULL REFERENCES public.cloud_providers(id) ON DELETE CASCADE, kind text NOT NULL, provider_ref text NOT NULL, name text NOT NULL, data jsonb NOT NULL DEFAULT '{}', synced_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider_id, kind, provider_ref));
CREATE TABLE public.cloud_plan_costs (plan_id uuid PRIMARY KEY REFERENCES public.cloud_plans(id) ON DELETE CASCADE, provider_id uuid REFERENCES public.cloud_providers(id) ON DELETE SET NULL, provider_ref text, infra_cost numeric NOT NULL DEFAULT 0, provider_setup_cost numeric NOT NULL DEFAULT 0, pricing_mode text NOT NULL DEFAULT 'manual', updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_resource_mappings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, code text NOT NULL, provider_id uuid NOT NULL REFERENCES public.cloud_providers(id) ON DELETE CASCADE, provider_ref text NOT NULL, UNIQUE(kind, code, provider_id));
CREATE TABLE public.cloud_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, server_id uuid REFERENCES public.cloud_servers(id) ON DELETE SET NULL, plan_id uuid REFERENCES public.cloud_plans(id) ON DELETE SET NULL, idempotency_key text NOT NULL UNIQUE, transaction_reference text NOT NULL UNIQUE, subtotal numeric NOT NULL, vat_rate numeric NOT NULL, vat_amount numeric NOT NULL, total numeric NOT NULL, payment_method text NOT NULL DEFAULT 'wallet', status text NOT NULL DEFAULT 'paid', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_provisioning_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES public.cloud_orders(id) ON DELETE CASCADE, server_id uuid REFERENCES public.cloud_servers(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'queued', attempt_count int NOT NULL DEFAULT 0, last_attempt_at timestamptz, error_code text, safe_error text, provider_request_id text, provider_resource_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_billing_settings (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), vat_rate numeric NOT NULL DEFAULT 0.15, currency text NOT NULL DEFAULT 'SAR', backups_surcharge numeric NOT NULL DEFAULT 0.2, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO public.cloud_billing_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_providers, public.cloud_provider_catalog, public.cloud_plan_costs, public.cloud_resource_mappings, public.cloud_provisioning_jobs, public.cloud_orders, public.cloud_billing_settings TO authenticated;
GRANT ALL ON public.cloud_providers, public.cloud_provider_catalog, public.cloud_plan_costs, public.cloud_resource_mappings, public.cloud_provisioning_jobs, public.cloud_orders, public.cloud_billing_settings TO service_role;

ALTER TABLE public.cloud_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_provider_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_plan_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_resource_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin providers" ON public.cloud_providers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin catalog" ON public.cloud_provider_catalog FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin costs" ON public.cloud_plan_costs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin mappings" ON public.cloud_resource_mappings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin jobs" ON public.cloud_provisioning_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own orders view" ON public.cloud_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin orders manage" ON public.cloud_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "read billing settings" ON public.cloud_billing_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin billing settings" ON public.cloud_billing_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER t_cloud_providers_upd BEFORE UPDATE ON public.cloud_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_orders_upd BEFORE UPDATE ON public.cloud_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_jobs_upd BEFORE UPDATE ON public.cloud_provisioning_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customers may only rename their own servers
CREATE OR REPLACE FUNCTION public.cloud_servers_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF (to_jsonb(NEW) - 'name' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'name' - 'updated_at') THEN
    RAISE EXCEPTION 'only name can be changed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_cloud_servers_guard BEFORE UPDATE ON public.cloud_servers FOR EACH ROW EXECUTE FUNCTION public.cloud_servers_guard();

DROP FUNCTION IF EXISTS public.order_cloud_server(uuid,text,text,text,text,uuid,boolean);
CREATE OR REPLACE FUNCTION public.order_cloud_server(p_plan_id uuid, p_location text, p_image text, p_name text, p_hostname text, p_ssh_key_id uuid, p_backups boolean, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_plan cloud_plans; v_set cloud_billing_settings; v_sub numeric; v_vat numeric; v_total numeric; v_bal numeric; v_id uuid; v_order uuid; v_existing cloud_orders;
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
  IF NOT EXISTS (SELECT 1 FROM cloud_locations WHERE code=p_location AND is_active) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_images WHERE code=p_image AND is_active) THEN RAISE EXCEPTION 'image not available'; END IF;
  IF p_ssh_key_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE id=p_ssh_key_id AND user_id=v_uid) THEN RAISE EXCEPTION 'invalid ssh key'; END IF;
  SELECT * INTO v_set FROM cloud_billing_settings WHERE id = 1;
  v_sub := round(v_plan.monthly_price * (CASE WHEN p_backups THEN 1 + v_set.backups_surcharge ELSE 1 END) + v_plan.setup_fee, 2);
  v_vat := round(v_sub * v_set.vat_rate, 2);
  v_total := v_sub + v_vat;
  SELECT balance INTO v_bal FROM user_balances WHERE user_id = v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal < v_total THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE user_balances SET balance = balance - v_total, total_spent = COALESCE(total_spent,0) + v_total, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO cloud_servers (user_id, plan_id, server_type, name, hostname, status, location_code, image_code, backups_enabled, ssh_key_id, monthly_price, renewal_date, specs)
  VALUES (v_uid, v_plan.id, v_plan.server_type, trim(p_name), p_hostname, 'pending', p_location, p_image, COALESCE(p_backups,false), p_ssh_key_id, v_plan.monthly_price, (now() + interval '1 month')::date,
    jsonb_build_object('vcpu', v_plan.vcpu, 'cpu_model', v_plan.cpu_model, 'ram_gb', v_plan.ram_gb, 'storage_gb', v_plan.storage_gb, 'disk_type', v_plan.disk_type, 'traffic_tb', v_plan.traffic_tb))
  RETURNING id INTO v_id;
  INSERT INTO cloud_orders (user_id, server_id, plan_id, idempotency_key, transaction_reference, subtotal, vat_rate, vat_amount, total, status)
  VALUES (v_uid, v_id, v_plan.id, p_idempotency_key, 'CLD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), v_sub, v_set.vat_rate, v_vat, v_total, 'queued')
  RETURNING id INTO v_order;
  INSERT INTO cloud_provisioning_jobs (order_id, server_id, status) VALUES (v_order, v_id, 'queued');
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (v_uid, v_id, 'server_ordered', jsonb_build_object('total', v_total, 'plan', v_plan.code, 'order_id', v_order));
  RETURN jsonb_build_object('server_id', v_id, 'order_id', v_order, 'total', v_total);
END $$;
REVOKE ALL ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean,text) TO authenticated;
