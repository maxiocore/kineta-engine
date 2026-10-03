
-- ===== Settings =====
CREATE TABLE public.cloud_lifecycle_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  grace_period_days int NOT NULL DEFAULT 3 CHECK (grace_period_days BETWEEN 0 AND 60),
  grace_server_policy text NOT NULL DEFAULT 'keep_running' CHECK (grace_server_policy IN ('keep_running','suspend_immediately')),
  renewal_retry_hours int[] NOT NULL DEFAULT '{24,48,72}',
  termination_delay_days int NOT NULL DEFAULT 7 CHECK (termination_delay_days BETWEEN 1 AND 180),
  notify_before_days int[] NOT NULL DEFAULT '{7,3,1}',
  auto_renew_default boolean NOT NULL DEFAULT true,
  min_margin_warning_pct numeric NOT NULL DEFAULT 20,
  provider_max_attempts int NOT NULL DEFAULT 3 CHECK (provider_max_attempts BETWEEN 1 AND 10),
  provider_backoff_seconds int NOT NULL DEFAULT 60,
  values_decided boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, UPDATE ON public.cloud_lifecycle_settings TO authenticated;
GRANT ALL ON public.cloud_lifecycle_settings TO service_role;
ALTER TABLE public.cloud_lifecycle_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read lifecycle settings" ON public.cloud_lifecycle_settings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin update lifecycle settings" ON public.cloud_lifecycle_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.cloud_lifecycle_settings DEFAULT VALUES;

-- ===== Subscriptions =====
ALTER TABLE public.cloud_subscriptions
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS next_renewal_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'wallet',
  ADD COLUMN IF NOT EXISTS renewal_subtotal_minor bigint,
  ADD COLUMN IF NOT EXISTS renewal_backup_minor bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate_snapshot numeric,
  ADD COLUMN IF NOT EXISTS renewal_vat_minor bigint,
  ADD COLUMN IF NOT EXISTS renewal_total_minor bigint,
  ADD COLUMN IF NOT EXISTS backups_addon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_mode text CHECK (cancel_mode IN ('period_end','immediate')),
  ADD COLUMN IF NOT EXISTS termination_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_deletion_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS protect_from_termination boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_simulation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sim_wallet_minor bigint;
ALTER TABLE public.cloud_subscriptions ALTER COLUMN order_id DROP NOT NULL;

-- ===== Events =====
CREATE TABLE public.cloud_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.cloud_subscriptions(id) ON DELETE CASCADE,
  user_id uuid,
  event text NOT NULL,
  from_status text, to_status text,
  details jsonb NOT NULL DEFAULT '{}',
  actor uuid,
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_subscription_events TO authenticated;
GRANT ALL ON public.cloud_subscription_events TO service_role;
ALTER TABLE public.cloud_subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin events" ON public.cloud_subscription_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX ON public.cloud_subscription_events(subscription_id, created_at DESC);

-- ===== Renewal invoices (customer-visible) =====
CREATE TABLE public.cloud_renewal_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.cloud_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL DEFAULT ('CLR-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,6))),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  backup_minor bigint NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL,
  vat_minor bigint NOT NULL CHECK (vat_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  status text NOT NULL DEFAULT 'paid',
  payment_method text NOT NULL,
  ledger_id uuid,
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, period_start)
);
GRANT SELECT ON public.cloud_renewal_invoices TO authenticated;
GRANT ALL ON public.cloud_renewal_invoices TO service_role;
ALTER TABLE public.cloud_renewal_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin renewal invoices" ON public.cloud_renewal_invoices FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ===== Admin-only cost snapshots =====
CREATE TABLE public.cloud_renewal_costs (
  invoice_id uuid PRIMARY KEY REFERENCES public.cloud_renewal_invoices(id) ON DELETE CASCADE,
  provider_cost_sar numeric,
  retail_sar numeric,
  margin_pct numeric,
  margin_alert boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_renewal_costs TO authenticated;
GRANT ALL ON public.cloud_renewal_costs TO service_role;
ALTER TABLE public.cloud_renewal_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin renewal costs" ON public.cloud_renewal_costs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ===== Jobs =====
CREATE TABLE public.cloud_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('provisioning','server_action','renewal','suspension','reactivation','termination','reconciliation','notification')),
  resource_type text NOT NULL DEFAULT 'subscription',
  resource_id uuid,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','manual_review','cancelled')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz, finished_at timestamptz,
  last_error text, error_class text,
  idempotency_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}',
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_jobs TO authenticated;
GRANT ALL ON public.cloud_jobs TO service_role;
ALTER TABLE public.cloud_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin jobs" ON public.cloud_jobs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX ON public.cloud_jobs(status, scheduled_at);

-- ===== Locks =====
CREATE TABLE public.cloud_server_locks (
  resource_id uuid PRIMARY KEY,
  action text NOT NULL,
  job_id uuid,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);
GRANT SELECT ON public.cloud_server_locks TO authenticated;
GRANT ALL ON public.cloud_server_locks TO service_role;
ALTER TABLE public.cloud_server_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin locks" ON public.cloud_server_locks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ===== Reconciliation / alerts / maintenance =====
CREATE TABLE public.cloud_reconciliation_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('provider_missing','internal_missing','orphan','ip_mismatch','status_mismatch','duplicate')),
  server_id uuid, provider_ref text,
  details jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored')),
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz, resolved_by uuid
);
GRANT SELECT, UPDATE ON public.cloud_reconciliation_findings TO authenticated;
GRANT ALL ON public.cloud_reconciliation_findings TO service_role;
ALTER TABLE public.cloud_reconciliation_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin findings read" ON public.cloud_reconciliation_findings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin findings update" ON public.cloud_reconciliation_findings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.cloud_admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  dedupe_key text UNIQUE,
  acknowledged_at timestamptz, acknowledged_by uuid,
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.cloud_admin_alerts TO authenticated;
GRANT ALL ON public.cloud_admin_alerts TO service_role;
ALTER TABLE public.cloud_admin_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin alerts read" ON public.cloud_admin_alerts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin alerts update" ON public.cloud_admin_alerts FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.cloud_maintenance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('scheduled_maintenance','incident','degraded')),
  title_ar text NOT NULL, title_en text NOT NULL,
  message_ar text, message_en text,
  location_code text,
  starts_at timestamptz NOT NULL, ends_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_maintenance_events TO authenticated;
GRANT ALL ON public.cloud_maintenance_events TO service_role;
ALTER TABLE public.cloud_maintenance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published maintenance read" ON public.cloud_maintenance_events FOR SELECT TO authenticated USING (is_published OR public.is_admin(auth.uid()));
CREATE POLICY "admin maintenance write" ON public.cloud_maintenance_events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== Transition guard =====
CREATE OR REPLACE FUNCTION public.cloud_sub_allowed(p_from text, p_to text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_to = ANY (CASE p_from
    WHEN 'pending_payment' THEN ARRAY['paid','terminated','cancelled']
    WHEN 'paid' THEN ARRAY['provisioning','active']
    WHEN 'provisioning' THEN ARRAY['active','provisioning_failed']
    WHEN 'provisioning_failed' THEN ARRAY['provisioning','terminated']
    WHEN 'active' THEN ARRAY['renewal_due','payment_failed','cancellation_pending','suspension_pending','termination_pending']
    WHEN 'renewal_due' THEN ARRAY['active','payment_failed','cancellation_pending']
    WHEN 'payment_failed' THEN ARRAY['grace_period','active','suspension_pending']
    WHEN 'grace_period' THEN ARRAY['active','suspension_pending','cancellation_pending']
    WHEN 'suspension_pending' THEN ARRAY['suspended','reactivation_pending']
    WHEN 'suspended' THEN ARRAY['reactivation_pending','termination_pending']
    WHEN 'reactivation_pending' THEN ARRAY['active','suspended']
    WHEN 'cancellation_pending' THEN ARRAY['active','termination_pending']
    WHEN 'termination_pending' THEN ARRAY['terminated','suspended']
    ELSE ARRAY[]::text[] END)
$$;

CREATE OR REPLACE FUNCTION public.cloud_sub_status_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.cloud_sub_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'INVALID_SUBSCRIPTION_TRANSITION % -> %', OLD.status, NEW.status;
    END IF;
    INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, from_status, to_status, details, actor, is_simulation)
    VALUES (NEW.id, NEW.user_id, 'status_change', OLD.status, NEW.status,
      jsonb_build_object('reason', coalesce(current_setting('app.cloud_reason', true), '')), auth.uid(), NEW.is_simulation);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cloud_sub_status_guard ON public.cloud_subscriptions;
CREATE TRIGGER cloud_sub_status_guard BEFORE UPDATE ON public.cloud_subscriptions FOR EACH ROW EXECUTE FUNCTION public.cloud_sub_status_guard();

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public._cloud_notify(p_sub public.cloud_subscriptions, p_event text, p_ar text, p_en text, p_data jsonb DEFAULT '{}')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, details, is_simulation)
  VALUES (p_sub.id, p_sub.user_id, 'notify:' || p_event, p_data || jsonb_build_object('ar', p_ar, 'en', p_en), p_sub.is_simulation);
  IF NOT p_sub.is_simulation THEN
    INSERT INTO public.notifications(user_id, title, message, type) VALUES (p_sub.user_id, p_ar, p_en, 'cloud');
    INSERT INTO public.cloud_jobs(job_type, resource_id, idempotency_key, payload)
    VALUES ('notification', p_sub.id, 'notify:' || p_sub.id || ':' || p_event || ':' || coalesce(p_data->>'key', to_char(now(),'YYYYMMDDHH24MI')),
      jsonb_build_object('event', p_event, 'user_id', p_sub.user_id) || p_data)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._cloud_alert(p_kind text, p_sev text, p_msg text, p_key text, p_details jsonb DEFAULT '{}', p_sim boolean DEFAULT false)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.cloud_admin_alerts(kind, severity, message, dedupe_key, details, is_simulation)
  VALUES (p_kind, p_sev, p_msg, p_key, p_details, p_sim) ON CONFLICT (dedupe_key) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.cloud_enqueue_job(p_type text, p_resource uuid, p_key text, p_payload jsonb DEFAULT '{}', p_sim boolean DEFAULT false, p_at timestamptz DEFAULT now())
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_max int;
BEGIN
  SELECT provider_max_attempts INTO v_max FROM public.cloud_lifecycle_settings;
  INSERT INTO public.cloud_jobs(job_type, resource_id, idempotency_key, payload, is_simulation, scheduled_at, max_attempts)
  VALUES (p_type, p_resource, p_key, p_payload, p_sim, p_at, coalesce(v_max,3))
  ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN SELECT id INTO v_id FROM public.cloud_jobs WHERE idempotency_key = p_key; END IF;
  RETURN v_id;
END $$;

-- Claim one job atomically (no two workers run the same job).
CREATE OR REPLACE FUNCTION public.cloud_claim_job(p_job uuid) RETURNS public.cloud_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.cloud_jobs;
BEGIN
  UPDATE public.cloud_jobs SET status = 'running', started_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE id = (SELECT id FROM public.cloud_jobs WHERE id = p_job AND status = 'queued' FOR UPDATE SKIP LOCKED)
  RETURNING * INTO j;
  RETURN j;
END $$;

CREATE OR REPLACE FUNCTION public.cloud_finish_job(p_job uuid, p_ok boolean, p_class text DEFAULT NULL, p_error text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.cloud_jobs; v_backoff int; v_new text;
BEGIN
  SELECT * INTO j FROM public.cloud_jobs WHERE id = p_job FOR UPDATE;
  IF NOT FOUND OR j.status <> 'running' THEN RETURN 'not_running'; END IF;
  IF p_ok THEN
    UPDATE public.cloud_jobs SET status='succeeded', finished_at=now(), last_error=NULL, error_class=NULL, updated_at=now() WHERE id=p_job;
    DELETE FROM public.cloud_server_locks WHERE job_id = p_job;
    RETURN 'succeeded';
  END IF;
  SELECT provider_backoff_seconds INTO v_backoff FROM public.cloud_lifecycle_settings;
  IF p_class IN ('authentication','invalid_request','resource_missing','unknown') OR j.attempts >= j.max_attempts THEN
    v_new := 'manual_review';
    PERFORM public._cloud_alert('repeated_job_failure', CASE WHEN p_class='authentication' THEN 'critical' ELSE 'warning' END,
      'Job moved to manual review: ' || j.job_type, 'job:' || j.id, jsonb_build_object('class', p_class), j.is_simulation);
  ELSE v_new := 'queued'; END IF;
  UPDATE public.cloud_jobs SET status=v_new, last_error=left(p_error,500), error_class=p_class, finished_at=CASE WHEN v_new='manual_review' THEN now() END,
    scheduled_at = now() + make_interval(secs => coalesce(v_backoff,60) * power(2, j.attempts - 1)), updated_at=now() WHERE id=p_job;
  DELETE FROM public.cloud_server_locks WHERE job_id = p_job;
  RETURN v_new;
END $$;

CREATE OR REPLACE FUNCTION public.cloud_admin_job_action(p_job uuid, p_action text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_action = 'retry' THEN UPDATE public.cloud_jobs SET status='queued', attempts=0, scheduled_at=now(), updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed');
  ELSIF p_action = 'resolve' THEN UPDATE public.cloud_jobs SET status='succeeded', finished_at=now(), last_error=coalesce(last_error,'') || ' [resolved by admin]', updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed');
  ELSIF p_action = 'cancel' THEN UPDATE public.cloud_jobs SET status='cancelled', finished_at=now(), updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed','queued');
  ELSE RAISE EXCEPTION 'INVALID_ACTION'; END IF;
  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id) VALUES (auth.uid(), 'cloud_job_' || p_action, 'cloud_job', p_job::text);
  RETURN 'ok';
END $$;

-- One destructive action per server at a time.
CREATE OR REPLACE FUNCTION public.cloud_acquire_lock(p_resource uuid, p_action text, p_job uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.cloud_server_locks WHERE resource_id = p_resource AND expires_at < now();
  INSERT INTO public.cloud_server_locks(resource_id, action, job_id) VALUES (p_resource, p_action, p_job) ON CONFLICT (resource_id) DO NOTHING;
  RETURN EXISTS (SELECT 1 FROM public.cloud_server_locks WHERE resource_id = p_resource AND job_id IS NOT DISTINCT FROM p_job AND action = p_action);
END $$;

CREATE OR REPLACE FUNCTION public.cloud_release_lock(p_resource uuid, p_job uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.cloud_server_locks WHERE resource_id = p_resource AND job_id IS NOT DISTINCT FROM p_job;
$$;

-- ===== Renewal / settlement (single atomic path) =====
CREATE OR REPLACE FUNCTION public.cloud_renew_subscription(p_sub uuid, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_now timestamptz; v_total bigint; v_ledger jsonb; v_inv uuid; v_new_status text;
  v_cost numeric; v_margin numeric; v_min numeric; v_bal numeric; v_end timestamptz;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  v_now := coalesce(p_now, now());
  IF s.status NOT IN ('active','renewal_due','payment_failed','grace_period','suspension_pending','suspended') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status);
  END IF;
  IF s.status IN ('active','renewal_due') AND s.next_renewal_at > v_now THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_due'); END IF;
  IF s.status IN ('active','renewal_due') AND NOT s.auto_renew THEN RETURN jsonb_build_object('ok', false, 'reason', 'auto_renew_off'); END IF;
  IF s.renewal_total_minor IS NULL OR s.current_period_end IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_snapshot'); END IF;
  IF EXISTS (SELECT 1 FROM public.cloud_renewal_invoices WHERE subscription_id = s.id AND period_start = s.current_period_end) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;
  v_total := s.renewal_total_minor;
  IF s.is_simulation THEN
    IF coalesce(s.sim_wallet_minor,0) < v_total THEN RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance'); END IF;
    UPDATE public.cloud_subscriptions SET sim_wallet_minor = sim_wallet_minor - v_total WHERE id = s.id;
  ELSE
    IF s.payment_method <> 'wallet' THEN RETURN jsonb_build_object('ok', false, 'reason', 'requires_customer_payment'); END IF;
    SELECT balance INTO v_bal FROM public.user_balances WHERE user_id = s.user_id FOR UPDATE;
    IF coalesce(v_bal,0) * 100 < v_total THEN RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance'); END IF;
    v_ledger := public._wallet_post(s.user_id, -(v_total::numeric / 100), 'debit', 'cloud_subscription', s.id,
      'cloud_renew:' || s.id || ':' || extract(epoch from s.current_period_end)::bigint, 'Cloud renewal', NULL, NULL, true);
  END IF;
  v_end := s.current_period_end + interval '1 month';
  INSERT INTO public.cloud_renewal_invoices(subscription_id, user_id, period_start, period_end, subtotal_minor, backup_minor, vat_rate, vat_minor, total_minor, payment_method, ledger_id, is_simulation)
  VALUES (s.id, s.user_id, s.current_period_end, v_end, s.renewal_subtotal_minor, s.renewal_backup_minor, s.vat_rate_snapshot, s.renewal_vat_minor, v_total, s.payment_method, (v_ledger->>'log_id')::uuid, s.is_simulation)
  RETURNING id INTO v_inv;
  -- Admin-only cost snapshot + margin alert (customer price never changes automatically).
  SELECT c.infra_cost INTO v_cost FROM public.cloud_servers sv JOIN public.cloud_plan_costs c ON c.plan_id = sv.plan_id WHERE sv.id = s.server_id LIMIT 1;
  SELECT min_margin_warning_pct INTO v_min FROM public.cloud_lifecycle_settings;
  IF v_cost IS NOT NULL AND s.renewal_subtotal_minor > 0 THEN
    v_margin := round((1 - v_cost / (s.renewal_subtotal_minor::numeric / 100)) * 100, 2);
  END IF;
  INSERT INTO public.cloud_renewal_costs(invoice_id, provider_cost_sar, retail_sar, margin_pct, margin_alert)
  VALUES (v_inv, v_cost, s.renewal_subtotal_minor::numeric / 100, v_margin, coalesce(v_margin < v_min, false));
  IF v_margin < v_min THEN PERFORM public._cloud_alert('margin_low', 'warning', 'Renewal margin below minimum', 'margin:' || v_inv, jsonb_build_object('margin', v_margin), s.is_simulation); END IF;

  v_new_status := CASE WHEN s.status IN ('suspension_pending','suspended') THEN 'reactivation_pending' ELSE 'active' END;
  PERFORM set_config('app.cloud_reason', 'renewal_paid', true);
  UPDATE public.cloud_subscriptions SET status = v_new_status, current_period_start = s.current_period_end, current_period_end = v_end,
    next_renewal_at = v_end, renewal_at = v_end::date, attempt_count = 0, failure_reason = NULL, failed_at = NULL, next_retry_at = NULL, grace_ends_at = NULL
  WHERE id = s.id;
  IF v_new_status = 'reactivation_pending' THEN
    PERFORM public.cloud_enqueue_job('reactivation', s.id, 'reactivate:' || s.id || ':' || v_inv, jsonb_build_object('server_id', s.server_id), s.is_simulation);
    PERFORM public._cloud_notify(s, 'payment_received', 'تم استلام الدفعة، جارٍ إعادة تفعيل الخدمة', 'Payment received, reactivating your service', jsonb_build_object('key', v_inv));
  ELSE
    PERFORM public._cloud_notify(s, 'renewal_successful', 'تم تجديد خدمة الخادم بنجاح', 'Your server service was renewed', jsonb_build_object('key', v_inv));
  END IF;
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'invoice_id', v_inv, 'status', v_new_status, 'total_minor', v_total);
END $$;

CREATE OR REPLACE FUNCTION public.cloud_record_renewal_failure(p_sub uuid, p_reason text, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; st public.cloud_lifecycle_settings; v_now timestamptz; v_n int;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  SELECT * INTO st FROM public.cloud_lifecycle_settings;
  v_now := coalesce(p_now, now());
  v_n := s.attempt_count + 1;
  PERFORM set_config('app.cloud_reason', p_reason, true);
  IF s.status IN ('active','renewal_due') THEN
    UPDATE public.cloud_subscriptions SET status = 'payment_failed' WHERE id = s.id;
    UPDATE public.cloud_subscriptions SET status = 'grace_period', grace_ends_at = v_now + make_interval(days => st.grace_period_days) WHERE id = s.id;
    PERFORM public._cloud_notify(s, 'renewal_failed', 'فشل تجديد خدمة الخادم', 'Server renewal failed', jsonb_build_object('key', 'f' || v_n, 'amount_minor', s.renewal_total_minor));
    PERFORM public._cloud_notify(s, 'grace_started', 'بدأت مهلة السداد', 'Grace period started', jsonb_build_object('key', 'g' || v_n));
  ELSIF s.status NOT IN ('payment_failed','grace_period') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status);
  END IF;
  UPDATE public.cloud_subscriptions SET failure_reason = p_reason, failed_at = v_now, attempt_count = v_n,
    next_retry_at = CASE WHEN v_n <= coalesce(array_length(st.renewal_retry_hours,1),0) THEN v_now + make_interval(hours => st.renewal_retry_hours[v_n]) END
  WHERE id = s.id;
  IF st.grace_server_policy = 'suspend_immediately' THEN
    UPDATE public.cloud_subscriptions SET status = 'suspension_pending', suspension_reason = 'non_payment' WHERE id = s.id AND status = 'grace_period';
    PERFORM public.cloud_enqueue_job('suspension', s.id, 'suspend:' || s.id || ':' || v_n, jsonb_build_object('server_id', s.server_id), s.is_simulation);
  END IF;
  RETURN jsonb_build_object('ok', true, 'attempt', v_n);
END $$;

-- Grace expired → suspension_pending (+ power-off job). Never deletes.
CREATE OR REPLACE FUNCTION public.cloud_begin_suspension(p_sub uuid, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_now timestamptz;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  v_now := coalesce(p_now, now());
  IF s.status <> 'grace_period' OR s.grace_ends_at > v_now THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_eligible_' || s.status); END IF;
  PERFORM set_config('app.cloud_reason', 'grace_expired', true);
  UPDATE public.cloud_subscriptions SET status = 'suspension_pending', suspension_reason = 'non_payment' WHERE id = s.id;
  PERFORM public.cloud_enqueue_job('suspension', s.id, 'suspend:' || s.id || ':' || extract(epoch from s.grace_ends_at)::bigint, jsonb_build_object('server_id', s.server_id), s.is_simulation);
  PERFORM public._cloud_notify(s, 'suspension_warning', 'سيتم تعليق الخدمة لعدم السداد', 'Service will be suspended for non-payment', '{}');
  RETURN jsonb_build_object('ok', true);
END $$;

-- Provider confirmed power-off / power-on / deletion.
CREATE OR REPLACE FUNCTION public.cloud_confirm_provider_state(p_sub uuid, p_state text, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; st public.cloud_lifecycle_settings; v_now timestamptz;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  SELECT * INTO st FROM public.cloud_lifecycle_settings;
  v_now := coalesce(p_now, now());
  IF p_state = 'powered_off' AND s.status = 'suspension_pending' THEN
    UPDATE public.cloud_subscriptions SET status = 'suspended', suspended_at = v_now,
      termination_scheduled_at = v_now + make_interval(days => st.termination_delay_days) WHERE id = s.id;
    PERFORM public._cloud_notify(s, 'service_suspended', 'تم تعليق الخدمة لعدم السداد', 'Service suspended for non-payment', '{}');
    PERFORM public._cloud_notify(s, 'termination_warning', 'تنبيه: موعد الحذف النهائي محدد', 'Termination scheduled', jsonb_build_object('date', v_now + make_interval(days => st.termination_delay_days)));
  ELSIF p_state = 'running' AND s.status = 'reactivation_pending' THEN
    UPDATE public.cloud_subscriptions SET status = 'active', reactivated_at = v_now, suspended_at = NULL, suspension_reason = NULL, termination_scheduled_at = NULL WHERE id = s.id;
    PERFORM public._cloud_notify(s, 'service_reactivated', 'تمت إعادة تفعيل الخدمة', 'Service reactivated', '{}');
  ELSIF p_state = 'deleted' AND s.status = 'termination_pending' THEN
    UPDATE public.cloud_subscriptions SET status = 'terminated', terminated_at = v_now, provider_deletion_verified_at = v_now WHERE id = s.id;
    PERFORM public._cloud_notify(s, 'service_terminated', 'تم إنهاء الخدمة', 'Service terminated', '{}');
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'state_mismatch_' || s.status);
  END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Termination with every safeguard re-checked under lock.
CREATE OR REPLACE FUNCTION public.cloud_begin_termination(p_sub uuid, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_now timestamptz;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  v_now := coalesce(p_now, now());
  IF s.status NOT IN ('suspended','cancellation_pending') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status); END IF;
  IF s.termination_scheduled_at IS NULL OR s.termination_scheduled_at > v_now THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_due'); END IF;
  IF s.protect_from_termination THEN
    PERFORM public._cloud_alert('termination_blocked', 'info', 'Protected subscription skipped termination', 'protect:' || s.id, '{}', s.is_simulation);
    RETURN jsonb_build_object('ok', false, 'reason', 'protected');
  END IF;
  IF s.on_hold THEN RETURN jsonb_build_object('ok', false, 'reason', 'on_hold'); END IF;
  IF s.status = 'suspended' AND EXISTS (SELECT 1 FROM public.cloud_renewal_invoices WHERE subscription_id = s.id AND created_at >= s.suspended_at) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'paid_after_suspension');
  END IF;
  IF EXISTS (SELECT 1 FROM public.cloud_jobs WHERE resource_id = s.id AND job_type = 'reactivation' AND status IN ('queued','running')) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'reactivation_pending');
  END IF;
  PERFORM set_config('app.cloud_reason', 'termination_due', true);
  UPDATE public.cloud_subscriptions SET status = 'termination_pending' WHERE id = s.id;
  PERFORM public.cloud_enqueue_job('termination', s.id, 'terminate:' || s.id, jsonb_build_object('server_id', s.server_id), s.is_simulation);
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== Customer-callable =====
CREATE OR REPLACE FUNCTION public.cloud_request_cancel(p_sub uuid, p_mode text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_at timestamptz;
BEGIN
  IF p_mode NOT IN ('period_end','immediate') THEN RAISE EXCEPTION 'INVALID_MODE'; END IF;
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid())) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('active','renewal_due','grace_period') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status); END IF;
  v_at := CASE WHEN p_mode = 'period_end' THEN coalesce(s.current_period_end, now()) ELSE now() END;
  PERFORM set_config('app.cloud_reason', 'customer_cancel_' || p_mode, true);
  UPDATE public.cloud_subscriptions SET status = 'cancellation_pending', auto_renew = false, cancel_mode = p_mode, termination_scheduled_at = v_at WHERE id = s.id;
  PERFORM public._cloud_notify(s, 'cancellation_scheduled', 'تمت جدولة إلغاء الخدمة', 'Cancellation scheduled', jsonb_build_object('date', v_at, 'refund', 'per_refund_policy'));
  RETURN jsonb_build_object('ok', true, 'stops_at', v_at, 'refund', 'per_refund_policy_no_automatic_refund');
END $$;

CREATE OR REPLACE FUNCTION public.cloud_undo_cancel(p_sub uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid())) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status <> 'cancellation_pending' OR s.cancel_mode <> 'period_end' OR s.termination_scheduled_at <= now() THEN RETURN jsonb_build_object('ok', false); END IF;
  UPDATE public.cloud_subscriptions SET status = 'active', auto_renew = true, cancel_mode = NULL, termination_scheduled_at = NULL WHERE id = s.id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.cloud_set_auto_renew(p_sub uuid, p_on boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid())) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('active','renewal_due') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status); END IF;
  UPDATE public.cloud_subscriptions SET auto_renew = p_on WHERE id = s.id;
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, details, actor) VALUES (s.id, s.user_id, 'auto_renew', jsonb_build_object('on', p_on), auth.uid());
  RETURN jsonb_build_object('ok', true);
END $$;

-- Customer "Pay now" from wallet (grace / suspended). Same atomic path.
CREATE OR REPLACE FUNCTION public.cloud_pay_due(p_sub uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub;
  IF NOT FOUND OR s.user_id <> auth.uid() OR s.is_simulation THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('payment_failed','grace_period','suspension_pending','suspended') THEN RETURN jsonb_build_object('ok', false, 'reason', 'nothing_due'); END IF;
  RETURN public.cloud_renew_subscription(p_sub, NULL);
END $$;

CREATE OR REPLACE FUNCTION public.cloud_admin_set_protection(p_sub uuid, p_protect boolean, p_hold boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.cloud_subscriptions SET protect_from_termination = p_protect, on_hold = p_hold WHERE id = p_sub;
  INSERT INTO public.cloud_subscription_events(subscription_id, event, details, actor) VALUES (p_sub, 'admin_protection', jsonb_build_object('protect', p_protect, 'hold', p_hold), auth.uid());
  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id) VALUES (auth.uid(), 'cloud_protection', 'cloud_subscription', p_sub::text);
END $$;

-- ===== Permissions: workers are service-role only =====
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['cloud_sub_allowed(text,text)','_cloud_notify(cloud_subscriptions,text,text,text,jsonb)','_cloud_alert(text,text,text,text,jsonb,boolean)',
    'cloud_enqueue_job(text,uuid,text,jsonb,boolean,timestamptz)','cloud_claim_job(uuid)','cloud_finish_job(uuid,boolean,text,text)',
    'cloud_acquire_lock(uuid,text,uuid)','cloud_release_lock(uuid,uuid)','cloud_renew_subscription(uuid,timestamptz)',
    'cloud_record_renewal_failure(uuid,text,timestamptz)','cloud_begin_suspension(uuid,timestamptz)','cloud_confirm_provider_state(uuid,text,timestamptz)',
    'cloud_begin_termination(uuid,timestamptz)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY['cloud_request_cancel(uuid,text)','cloud_undo_cancel(uuid)','cloud_set_auto_renew(uuid,boolean)','cloud_pay_due(uuid)',
    'cloud_admin_set_protection(uuid,boolean,boolean)','cloud_admin_job_action(uuid,text)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;
