ALTER TABLE public.cloud_subscriptions ADD COLUMN IF NOT EXISTS is_lifecycle_test boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public._cloud_notify(p_sub cloud_subscriptions, p_event text, p_ar text, p_en text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, details, is_simulation)
  VALUES (p_sub.id, p_sub.user_id, 'notify:' || p_event, p_data || jsonb_build_object('ar', p_ar, 'en', p_en), p_sub.is_simulation);
  -- Lifecycle tests record the event only: no in-app notification and no email job.
  IF NOT p_sub.is_simulation AND NOT coalesce(p_sub.is_lifecycle_test, false) THEN
    INSERT INTO public.notifications(user_id, title, message, type) VALUES (p_sub.user_id, p_ar, p_en, 'cloud');
    INSERT INTO public.cloud_jobs(job_type, resource_id, idempotency_key, payload)
    VALUES ('notification', p_sub.id, 'notify:' || p_sub.id || ':' || p_event || ':' || coalesce(p_data->>'key', to_char(now(),'YYYYMMDDHH24MI')),
      jsonb_build_object('event', p_event, 'user_id', p_sub.user_id) || p_data)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
END $function$;

CREATE OR REPLACE FUNCTION public.cloud_renew_subscription(p_sub uuid, p_now timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  -- Simulations and real-provider lifecycle tests use a simulated wallet; never the real wallet.
  IF s.is_simulation OR s.is_lifecycle_test THEN
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
END $function$;

-- Customers can never pay a lifecycle-test subscription.
CREATE OR REPLACE FUNCTION public.cloud_pay_due(p_sub uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s public.cloud_subscriptions;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub;
  IF NOT FOUND OR s.user_id <> auth.uid() OR s.is_simulation OR s.is_lifecycle_test THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('payment_failed','grace_period','suspension_pending','suspended') THEN RETURN jsonb_build_object('ok', false, 'reason', 'nothing_due'); END IF;
  RETURN public.cloud_renew_subscription(p_sub, NULL);
END $function$;