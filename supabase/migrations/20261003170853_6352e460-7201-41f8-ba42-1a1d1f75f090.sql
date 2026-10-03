
ALTER TABLE public.cloud_subscriptions ADD CONSTRAINT cloud_sub_vat_fraction CHECK (vat_rate_snapshot IS NULL OR (vat_rate_snapshot >= 0 AND vat_rate_snapshot < 1));
ALTER TABLE public.cloud_renewal_invoices ADD CONSTRAINT cloud_inv_vat_fraction CHECK (vat_rate >= 0 AND vat_rate < 1);

CREATE OR REPLACE FUNCTION public.cloud_record_renewal_failure(p_sub uuid, p_reason text, p_now timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.cloud_subscriptions; st public.cloud_lifecycle_settings; v_now timestamptz; v_n int; v_due timestamptz;
BEGIN
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF p_now IS NOT NULL AND NOT s.is_simulation THEN RAISE EXCEPTION 'TIME_OVERRIDE_SIMULATION_ONLY'; END IF;
  SELECT * INTO st FROM public.cloud_lifecycle_settings;
  v_now := coalesce(p_now, now());
  v_n := s.attempt_count + 1;
  v_due := coalesce(s.next_renewal_at, v_now);
  PERFORM set_config('app.cloud_reason', p_reason, true);
  IF s.status IN ('active','renewal_due') THEN
    UPDATE public.cloud_subscriptions SET status = 'payment_failed' WHERE id = s.id;
    UPDATE public.cloud_subscriptions SET status = 'grace_period', grace_ends_at = v_due + make_interval(days => st.grace_period_days) WHERE id = s.id;
    PERFORM public._cloud_notify(s, 'renewal_failed', 'فشل تجديد خدمة الخادم', 'Server renewal failed', jsonb_build_object('key', 'f' || v_n, 'amount_minor', s.renewal_total_minor));
    PERFORM public._cloud_notify(s, 'grace_started', 'بدأت مهلة السداد', 'Grace period started', jsonb_build_object('key', 'g' || v_n, 'date', v_due + make_interval(days => st.grace_period_days)));
  ELSIF s.status NOT IN ('payment_failed','grace_period') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status);
  END IF;
  -- Retry schedule is measured from the original due date (due, +24h, +48h, +72h).
  UPDATE public.cloud_subscriptions SET failure_reason = p_reason, failed_at = v_now, attempt_count = v_n,
    next_retry_at = CASE WHEN v_n <= coalesce(array_length(st.renewal_retry_hours,1),0) THEN v_due + make_interval(hours => st.renewal_retry_hours[v_n]) END
  WHERE id = s.id;
  IF st.grace_server_policy = 'suspend_immediately' THEN
    UPDATE public.cloud_subscriptions SET status = 'suspension_pending', suspension_reason = 'non_payment' WHERE id = s.id AND status = 'grace_period';
    PERFORM public.cloud_enqueue_job('suspension', s.id, 'suspend:' || s.id || ':' || v_n, jsonb_build_object('server_id', s.server_id), s.is_simulation);
  END IF;
  RETURN jsonb_build_object('ok', true, 'attempt', v_n);
END $$;
REVOKE ALL ON FUNCTION public.cloud_record_renewal_failure(uuid,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_record_renewal_failure(uuid,text,timestamptz) TO service_role;
