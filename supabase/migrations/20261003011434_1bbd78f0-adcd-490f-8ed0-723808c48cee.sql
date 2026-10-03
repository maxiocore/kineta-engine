CREATE TABLE public.cloud_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name_ar text NOT NULL, name_en text NOT NULL, country text, is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, family text NOT NULL, version text, is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, server_type text NOT NULL CHECK (server_type IN ('vps','dedicated')), name_ar text NOT NULL, name_en text NOT NULL, vcpu int, cpu_model text, ram_gb int NOT NULL DEFAULT 0, storage_gb int NOT NULL DEFAULT 0, disk_type text DEFAULT 'NVMe SSD', traffic_tb numeric DEFAULT 20, network text, monthly_price numeric NOT NULL DEFAULT 0, setup_fee numeric NOT NULL DEFAULT 0, location_codes text[] NOT NULL DEFAULT '{}', provider_ref text, is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_servers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, plan_id uuid REFERENCES public.cloud_plans(id) ON DELETE SET NULL, server_type text NOT NULL, name text NOT NULL, hostname text, status text NOT NULL DEFAULT 'pending', location_code text, image_code text, primary_ipv4 text, primary_ipv6 text, backups_enabled boolean NOT NULL DEFAULT false, ssh_key_id uuid, provider text NOT NULL DEFAULT 'manual', provider_server_id text, monthly_price numeric NOT NULL DEFAULT 0, renewal_date date, specs jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_server_ips (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), server_id uuid NOT NULL REFERENCES public.cloud_servers(id) ON DELETE CASCADE, user_id uuid NOT NULL, ip text NOT NULL, version int NOT NULL DEFAULT 4, is_primary boolean NOT NULL DEFAULT false, reverse_dns text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_ssh_keys (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL, public_key text NOT NULL, fingerprint text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_snapshots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), server_id uuid NOT NULL REFERENCES public.cloud_servers(id) ON DELETE CASCADE, user_id uuid NOT NULL, name text NOT NULL, status text NOT NULL DEFAULT 'pending', size_gb numeric, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_backups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), server_id uuid NOT NULL REFERENCES public.cloud_servers(id) ON DELETE CASCADE, user_id uuid NOT NULL, status text NOT NULL DEFAULT 'pending', size_gb numeric, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_server_actions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), server_id uuid NOT NULL REFERENCES public.cloud_servers(id) ON DELETE CASCADE, user_id uuid NOT NULL, action text NOT NULL, status text NOT NULL DEFAULT 'requested', payload jsonb NOT NULL DEFAULT '{}', error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cloud_activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, server_id uuid REFERENCES public.cloud_servers(id) ON DELETE SET NULL, event text NOT NULL, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT ON public.cloud_locations, public.cloud_images, public.cloud_plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cloud_locations, public.cloud_images, public.cloud_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_servers, public.cloud_server_ips, public.cloud_ssh_keys, public.cloud_snapshots, public.cloud_backups, public.cloud_server_actions, public.cloud_activity_logs TO authenticated;
GRANT ALL ON public.cloud_locations, public.cloud_images, public.cloud_plans, public.cloud_servers, public.cloud_server_ips, public.cloud_ssh_keys, public.cloud_snapshots, public.cloud_backups, public.cloud_server_actions, public.cloud_activity_logs TO service_role;

ALTER TABLE public.cloud_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_server_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_ssh_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_server_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view active locations" ON public.cloud_locations FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage locations" ON public.cloud_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "view active images" ON public.cloud_images FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage images" ON public.cloud_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "view active plans" ON public.cloud_plans FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage plans" ON public.cloud_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own servers view" ON public.cloud_servers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own servers rename" ON public.cloud_servers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin servers all" ON public.cloud_servers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own ips view" ON public.cloud_server_ips FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin ips all" ON public.cloud_server_ips FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own keys" ON public.cloud_ssh_keys FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own snapshots view" ON public.cloud_snapshots FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own snapshots request" ON public.cloud_snapshots FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status='pending' AND EXISTS (SELECT 1 FROM public.cloud_servers s WHERE s.id=server_id AND s.user_id=auth.uid()));
CREATE POLICY "admin snapshots all" ON public.cloud_snapshots FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own backups view" ON public.cloud_backups FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin backups all" ON public.cloud_backups FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own actions view" ON public.cloud_server_actions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own actions request" ON public.cloud_server_actions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status='requested' AND EXISTS (SELECT 1 FROM public.cloud_servers s WHERE s.id=server_id AND s.user_id=auth.uid()));
CREATE POLICY "admin actions all" ON public.cloud_server_actions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own logs view" ON public.cloud_activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own logs insert" ON public.cloud_activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TRIGGER t_cloud_locations_upd BEFORE UPDATE ON public.cloud_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_images_upd BEFORE UPDATE ON public.cloud_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_plans_upd BEFORE UPDATE ON public.cloud_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_servers_upd BEFORE UPDATE ON public.cloud_servers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cloud_actions_upd BEFORE UPDATE ON public.cloud_server_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.order_cloud_server(p_plan_id uuid, p_location text, p_image text, p_name text, p_hostname text, p_ssh_key_id uuid, p_backups boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_plan cloud_plans; v_sub numeric; v_total numeric; v_bal numeric; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 OR length(p_name) > 63 THEN RAISE EXCEPTION 'invalid name'; END IF;
  SELECT * INTO v_plan FROM cloud_plans WHERE id = p_plan_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_locations WHERE code=p_location AND is_active) THEN RAISE EXCEPTION 'location not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cloud_images WHERE code=p_image AND is_active) THEN RAISE EXCEPTION 'image not available'; END IF;
  IF p_ssh_key_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE id=p_ssh_key_id AND user_id=v_uid) THEN RAISE EXCEPTION 'invalid ssh key'; END IF;
  v_sub := v_plan.monthly_price * (CASE WHEN p_backups THEN 1.2 ELSE 1 END) + v_plan.setup_fee;
  v_total := round(v_sub * 1.15, 2);
  SELECT balance INTO v_bal FROM user_balances WHERE user_id = v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal < v_total THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE user_balances SET balance = balance - v_total, total_spent = COALESCE(total_spent,0) + v_total, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO cloud_servers (user_id, plan_id, server_type, name, hostname, status, location_code, image_code, backups_enabled, ssh_key_id, monthly_price, renewal_date, specs)
  VALUES (v_uid, v_plan.id, v_plan.server_type, trim(p_name), p_hostname, 'pending', p_location, p_image, COALESCE(p_backups,false), p_ssh_key_id, v_plan.monthly_price, (now() + interval '1 month')::date,
    jsonb_build_object('vcpu', v_plan.vcpu, 'cpu_model', v_plan.cpu_model, 'ram_gb', v_plan.ram_gb, 'storage_gb', v_plan.storage_gb, 'disk_type', v_plan.disk_type, 'traffic_tb', v_plan.traffic_tb))
  RETURNING id INTO v_id;
  INSERT INTO cloud_server_actions (server_id, user_id, action, status) VALUES (v_id, v_uid, 'create', 'requested');
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (v_uid, v_id, 'server_ordered', jsonb_build_object('total', v_total, 'plan', v_plan.code));
  RETURN jsonb_build_object('server_id', v_id, 'total', v_total);
END $$;
REVOKE ALL ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.order_cloud_server(uuid,text,text,text,text,uuid,boolean) TO authenticated;