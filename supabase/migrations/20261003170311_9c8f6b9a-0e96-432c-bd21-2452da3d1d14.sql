
ALTER TABLE public.cloud_subscriptions
  ADD COLUMN IF NOT EXISTS backup_status text NOT NULL DEFAULT 'none' CHECK (backup_status IN ('none','active','cancellation_pending','cancelled')),
  ADD COLUMN IF NOT EXISTS backup_cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_warning_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sim_provider_ref text;
ALTER TABLE public.cloud_subscriptions DROP CONSTRAINT IF EXISTS cloud_sub_sim_ref_only;
ALTER TABLE public.cloud_subscriptions ADD CONSTRAINT cloud_sub_sim_ref_only CHECK (sim_provider_ref IS NULL OR is_simulation);

ALTER TABLE public.cloud_jobs DROP CONSTRAINT IF EXISTS cloud_jobs_job_type_check;
ALTER TABLE public.cloud_jobs ADD CONSTRAINT cloud_jobs_job_type_check CHECK (job_type IN ('provisioning','server_action','renewal','suspension','reactivation','termination','reconciliation','notification','backup_disable'));

-- ===== Scheduler runs + locks =====
CREATE TABLE public.cloud_scheduler_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_scanned int NOT NULL DEFAULT 0,
  records_processed int NOT NULL DEFAULT 0,
  successes int NOT NULL DEFAULT 0,
  failures int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','finished','skipped_locked','disabled','error')),
  notes text,
  is_simulation boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.cloud_scheduler_runs TO authenticated;
GRANT ALL ON public.cloud_scheduler_runs TO service_role;
ALTER TABLE public.cloud_scheduler_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin scheduler runs" ON public.cloud_scheduler_runs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.cloud_scheduler_locks (
  job_type text PRIMARY KEY,
  run_id uuid NOT NULL,
  locked_until timestamptz NOT NULL
);
GRANT ALL ON public.cloud_scheduler_locks TO service_role;
ALTER TABLE public.cloud_scheduler_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin scheduler locks" ON public.cloud_scheduler_locks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.cloud_scheduler_begin(p_type text, p_ttl_seconds int DEFAULT 600, p_sim boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_run uuid := gen_random_uuid(); v_got int;
BEGIN
  INSERT INTO public.cloud_scheduler_locks(job_type, run_id, locked_until) VALUES (p_type, v_run, now() + make_interval(secs => p_ttl_seconds))
  ON CONFLICT (job_type) DO UPDATE SET run_id = EXCLUDED.run_id, locked_until = EXCLUDED.locked_until
    WHERE public.cloud_scheduler_locks.locked_until < now();
  GET DIAGNOSTICS v_got = ROW_COUNT;
  IF v_got = 0 THEN
    INSERT INTO public.cloud_scheduler_runs(job_type, status, finished_at, is_simulation) VALUES (p_type, 'skipped_locked', now(), p_sim);
    RETURN NULL;
  END IF;
  INSERT INTO public.cloud_scheduler_runs(id, job_type, is_simulation) VALUES (v_run, p_type, p_sim);
  RETURN v_run;
END $$;

CREATE OR REPLACE FUNCTION public.cloud_scheduler_end(p_run uuid, p_scanned int, p_processed int, p_ok int, p_fail int, p_status text DEFAULT 'finished', p_notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cloud_scheduler_runs SET finished_at = now(), records_scanned = p_scanned, records_processed = p_processed, successes = p_ok, failures = p_fail, status = p_status, notes = left(p_notes, 500) WHERE id = p_run;
  DELETE FROM public.cloud_scheduler_locks WHERE run_id = p_run;
END $$;

-- ===== Final warning =====
CREATE OR REPLACE FUNCTION public.cloud_send_final_warning(p_sub uuid, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  IF s.status NOT IN ('suspended','cancellation_pending') OR s.final_warning_sent_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  UPDATE public.cloud_subscriptions SET final_warning_sent_at = coalesce(p_now, now()) WHERE id = s.id;
  PERFORM public._cloud_notify(s, 'final_termination_warning', 'تنبيه نهائي: سيتم حذف الخادم نهائياً', 'Final warning: your server will be permanently deleted', jsonb_build_object('date', s.termination_scheduled_at, 'key', 'final'));
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== Termination: all guards + final warning required =====
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
  IF s.final_warning_sent_at IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'final_warning_not_sent'); END IF;
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

-- ===== Cancel vs renewal rule =====
CREATE OR REPLACE FUNCTION public.cloud_request_cancel(p_sub uuid, p_mode text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_at timestamptz; v_mode text := p_mode; v_converted boolean := false;
BEGIN
  IF p_mode NOT IN ('period_end','immediate') THEN RAISE EXCEPTION 'INVALID_MODE'; END IF;
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid()) AND auth.role() <> 'service_role') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('active','renewal_due','grace_period') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status); END IF;
  -- Renewal won the race: the customer keeps the paid period, cancellation moves to the new period end.
  IF v_mode = 'immediate' AND EXISTS (SELECT 1 FROM public.cloud_renewal_invoices WHERE subscription_id = s.id AND period_start = s.current_period_start AND created_at > now() - interval '10 minutes') THEN
    v_mode := 'period_end'; v_converted := true;
  END IF;
  v_at := CASE WHEN v_mode = 'period_end' THEN coalesce(s.current_period_end, now()) ELSE now() END;
  PERFORM set_config('app.cloud_reason', 'customer_cancel_' || v_mode || CASE WHEN v_converted THEN '_after_renewal' ELSE '' END, true);
  UPDATE public.cloud_subscriptions SET status = 'cancellation_pending', auto_renew = false, cancel_mode = v_mode, termination_scheduled_at = v_at WHERE id = s.id;
  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id, new_values)
  VALUES (auth.uid(), 'cloud_cancel', 'cloud_subscription', s.id::text, jsonb_build_object('requested', p_mode, 'applied', v_mode, 'stops_at', v_at));
  PERFORM public._cloud_notify(s, 'cancellation_scheduled', 'تمت جدولة إلغاء الخدمة', 'Cancellation scheduled', jsonb_build_object('date', v_at, 'key', 'cancel'));
  RETURN jsonb_build_object('ok', true, 'mode', v_mode, 'converted_after_renewal', v_converted, 'stops_at', v_at, 'refund', 'per_refund_policy_no_automatic_refund');
END $$;

-- ===== Backup add-on cancellation =====
CREATE OR REPLACE FUNCTION public.cloud_request_backup_cancel(p_sub uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid()) AND auth.role() <> 'service_role') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.backup_status <> 'active' THEN RETURN jsonb_build_object('ok', false, 'reason', 'backup_' || s.backup_status); END IF;
  UPDATE public.cloud_subscriptions SET backup_status = 'cancellation_pending', backup_cancel_requested_at = now() WHERE id = s.id;
  PERFORM public.cloud_enqueue_job('backup_disable', s.id, 'backup_off:' || s.id || ':' || extract(epoch from now())::bigint, jsonb_build_object('server_id', s.server_id), s.is_simulation);
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, actor, is_simulation) VALUES (s.id, s.user_id, 'backup_cancel_requested', auth.uid(), s.is_simulation);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.cloud_confirm_backup_disabled(p_sub uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; v_vat bigint;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF s.backup_status <> 'cancellation_pending' THEN RETURN jsonb_build_object('ok', false, 'reason', 'backup_' || s.backup_status); END IF;
  v_vat := public.vat_halalas(s.renewal_subtotal_minor, s.vat_rate_snapshot);
  UPDATE public.cloud_subscriptions SET backup_status = 'cancelled', backups_addon = false, renewal_backup_minor = 0,
    renewal_vat_minor = v_vat, renewal_total_minor = s.renewal_subtotal_minor + v_vat WHERE id = s.id;
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, details, is_simulation)
  VALUES (s.id, s.user_id, 'backup_cancelled', jsonb_build_object('old_total_minor', s.renewal_total_minor, 'new_total_minor', s.renewal_subtotal_minor + v_vat), s.is_simulation);
  RETURN jsonb_build_object('ok', true, 'new_total_minor', s.renewal_subtotal_minor + v_vat);
END $$;

-- ===== Provider action safety gate =====
-- Provider IDs come only from our own records (never the browser). Re-checks state and takes the server lock.
CREATE OR REPLACE FUNCTION public.cloud_prepare_provider_action(p_job uuid, p_dry boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.cloud_jobs; s public.cloud_subscriptions; sv public.cloud_servers; v_ref text; v_expected text[]; v_action text; v_lock_key uuid; v_got boolean;
BEGIN
  SELECT * INTO j FROM public.cloud_jobs WHERE id = p_job;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'job_not_found'); END IF;
  IF NOT p_dry AND j.status <> 'running' THEN RETURN jsonb_build_object('ok', false, 'reason', 'job_not_claimed'); END IF;
  IF NOT p_dry AND j.status = 'running' AND j.is_simulation IS DISTINCT FROM false AND false THEN NULL; END IF;
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = j.resource_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'subscription_not_found'); END IF;
  IF s.is_simulation <> j.is_simulation THEN RETURN jsonb_build_object('ok', false, 'reason', 'simulation_mismatch'); END IF;
  v_action := CASE j.job_type WHEN 'suspension' THEN 'poweroff' WHEN 'reactivation' THEN 'poweron' WHEN 'termination' THEN 'delete' WHEN 'backup_disable' THEN 'disable_backup' END;
  IF v_action IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_a_provider_job'); END IF;
  v_expected := CASE j.job_type WHEN 'suspension' THEN ARRAY['suspension_pending'] WHEN 'reactivation' THEN ARRAY['reactivation_pending'] WHEN 'termination' THEN ARRAY['termination_pending']
    ELSE ARRAY['active','renewal_due','payment_failed','grace_period','suspension_pending','suspended','reactivation_pending','cancellation_pending'] END;
  IF NOT (s.status = ANY (v_expected)) THEN RETURN jsonb_build_object('ok', false, 'reason', 'lifecycle_state_' || s.status); END IF;
  IF j.job_type = 'backup_disable' AND s.backup_status <> 'cancellation_pending' THEN RETURN jsonb_build_object('ok', false, 'reason', 'backup_' || s.backup_status); END IF;
  IF j.job_type = 'termination' THEN
    IF s.protect_from_termination OR s.on_hold THEN RETURN jsonb_build_object('ok', false, 'reason', 'protected_or_hold'); END IF;
    IF s.termination_scheduled_at IS NULL OR s.termination_scheduled_at > now() AND NOT s.is_simulation THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_due'); END IF;
    IF s.suspended_at IS NOT NULL AND EXISTS (SELECT 1 FROM public.cloud_renewal_invoices WHERE subscription_id = s.id AND created_at >= s.suspended_at) THEN RETURN jsonb_build_object('ok', false, 'reason', 'paid_after_suspension'); END IF;
    IF EXISTS (SELECT 1 FROM public.cloud_jobs WHERE resource_id = s.id AND job_type = 'reactivation' AND status IN ('queued','running')) THEN RETURN jsonb_build_object('ok', false, 'reason', 'reactivation_pending'); END IF;
  END IF;
  IF s.is_simulation THEN
    v_ref := s.sim_provider_ref; v_lock_key := s.id;
  ELSE
    SELECT * INTO sv FROM public.cloud_servers WHERE id = s.server_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'server_not_found'); END IF;
    IF sv.user_id <> s.user_id THEN RETURN jsonb_build_object('ok', false, 'reason', 'ownership_mismatch'); END IF;
    IF sv.provider IS DISTINCT FROM 'hetzner_cloud' THEN RETURN jsonb_build_object('ok', false, 'reason', 'unexpected_provider'); END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cloud_orders o WHERE o.server_id = sv.id AND o.user_id = s.user_id) AND s.order_id IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'order_mapping_mismatch'); END IF;
    v_ref := sv.provider_server_id; v_lock_key := sv.id;
  END IF;
  IF v_ref IS NULL OR v_ref !~ '^[A-Za-z0-9_-]{1,40}$' THEN RETURN jsonb_build_object('ok', false, 'reason', 'provider_resource_missing'); END IF;
  v_got := public.cloud_acquire_lock(v_lock_key, v_action, CASE WHEN p_dry THEN gen_random_uuid() ELSE j.id END);
  IF NOT v_got THEN RETURN jsonb_build_object('ok', false, 'reason', 'server_locked'); END IF;
  IF p_dry THEN DELETE FROM public.cloud_server_locks WHERE resource_id = v_lock_key AND action = v_action AND job_id IS DISTINCT FROM j.id; END IF;
  RETURN jsonb_build_object('ok', true, 'provider_ref', v_ref, 'action', v_action, 'lock_key', v_lock_key, 'subscription_id', s.id, 'dry', p_dry);
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['cloud_scheduler_begin(text,int,boolean)','cloud_scheduler_end(uuid,int,int,int,int,text,text)','cloud_send_final_warning(uuid,timestamptz)',
    'cloud_begin_termination(uuid,timestamptz)','cloud_confirm_backup_disabled(uuid)','cloud_prepare_provider_action(uuid,boolean)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY['cloud_request_cancel(uuid,text)','cloud_request_backup_cancel(uuid)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;
