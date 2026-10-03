CREATE OR REPLACE FUNCTION public.cloud_admin_job_action(p_job uuid, p_action text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_action = 'retry' THEN UPDATE public.cloud_jobs SET status='queued', attempts=0, scheduled_at=now(), updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed');
  ELSIF p_action = 'resolve' THEN UPDATE public.cloud_jobs SET status='succeeded', finished_at=now(), last_error=coalesce(last_error,'') || ' [resolved by admin]', updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed');
  ELSIF p_action = 'cancel' THEN UPDATE public.cloud_jobs SET status='cancelled', finished_at=now(), updated_at=now() WHERE id=p_job AND status IN ('manual_review','failed','queued');
  ELSE RAISE EXCEPTION 'INVALID_ACTION'; END IF;
  INSERT INTO public.audit_logs(user_id, action, table_name, record_id) VALUES (auth.uid(), 'cloud_job_' || p_action, 'cloud_job', p_job::text);
  RETURN 'ok';
END $function$;

CREATE OR REPLACE FUNCTION public.cloud_admin_set_protection(p_sub uuid, p_protect boolean, p_hold boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.cloud_subscriptions SET protect_from_termination = p_protect, on_hold = p_hold WHERE id = p_sub;
  INSERT INTO public.cloud_subscription_events(subscription_id, event, details, actor) VALUES (p_sub, 'admin_protection', jsonb_build_object('protect', p_protect, 'hold', p_hold), auth.uid());
  INSERT INTO public.audit_logs(user_id, action, table_name, record_id) VALUES (auth.uid(), 'cloud_protection', 'cloud_subscription', p_sub::text);
END $function$;

CREATE OR REPLACE FUNCTION public.cloud_request_cancel(p_sub uuid, p_mode text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s public.cloud_subscriptions; v_at timestamptz; v_mode text := p_mode; v_converted boolean := false;
BEGIN
  IF p_mode NOT IN ('period_end','immediate') THEN RAISE EXCEPTION 'INVALID_MODE'; END IF;
  SELECT * INTO s FROM public.cloud_subscriptions WHERE id = p_sub FOR UPDATE;
  IF NOT FOUND OR (s.user_id <> auth.uid() AND NOT public.is_admin(auth.uid()) AND auth.role() <> 'service_role') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF s.status NOT IN ('active','renewal_due','grace_period') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status_' || s.status); END IF;
  IF v_mode = 'immediate' AND EXISTS (SELECT 1 FROM public.cloud_renewal_invoices WHERE subscription_id = s.id AND period_start = s.current_period_start AND created_at > now() - interval '10 minutes') THEN
    v_mode := 'period_end'; v_converted := true;
  END IF;
  v_at := CASE WHEN v_mode = 'period_end' THEN coalesce(s.current_period_end, now()) ELSE now() END;
  PERFORM set_config('app.cloud_reason', 'customer_cancel_' || v_mode || CASE WHEN v_converted THEN '_after_renewal' ELSE '' END, true);
  UPDATE public.cloud_subscriptions SET status = 'cancellation_pending', auto_renew = false, cancel_mode = v_mode, termination_scheduled_at = v_at WHERE id = s.id;
  INSERT INTO public.audit_logs(user_id, action, table_name, record_id, new_value)
  VALUES (auth.uid(), 'cloud_cancel', 'cloud_subscription', s.id::text, jsonb_build_object('requested', p_mode, 'applied', v_mode, 'stops_at', v_at));
  PERFORM public._cloud_notify(s, 'cancellation_scheduled', 'تمت جدولة إلغاء الخدمة', 'Cancellation scheduled', jsonb_build_object('date', v_at, 'key', 'cancel'));
  RETURN jsonb_build_object('ok', true, 'mode', v_mode, 'converted_after_renewal', v_converted, 'stops_at', v_at, 'refund', 'per_refund_policy_no_automatic_refund');
END $function$;