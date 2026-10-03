CREATE OR REPLACE FUNCTION public.cloud_ssh_keys_validate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_parts text[]; v_type text; v_blob bytea; v_len int;
BEGIN
  NEW.public_key := regexp_replace(btrim(coalesce(NEW.public_key,'')), '\s+', ' ', 'g');
  NEW.name := btrim(coalesce(NEW.name,''));
  IF length(NEW.name) < 1 OR length(NEW.name) > 64 THEN RAISE EXCEPTION 'invalid ssh key name'; END IF;
  IF NEW.public_key ~* 'PRIVATE KEY' OR NEW.public_key ~ '-----' THEN RAISE EXCEPTION 'private keys are not accepted'; END IF;
  IF length(NEW.public_key) > 8192 OR NEW.public_key !~ '^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) [A-Za-z0-9+/]+={0,3}( [^\r\n]{0,200})?$' THEN
    RAISE EXCEPTION 'invalid ssh public key format'; END IF;
  v_parts := string_to_array(NEW.public_key, ' '); v_type := v_parts[1];
  BEGIN v_blob := decode(v_parts[2], 'base64'); EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid ssh public key format'; END;
  IF length(v_blob) < 20 THEN RAISE EXCEPTION 'invalid ssh public key format'; END IF;
  v_len := (get_byte(v_blob,0) << 24) | (get_byte(v_blob,1) << 16) | (get_byte(v_blob,2) << 8) | get_byte(v_blob,3);
  IF v_len <> length(v_type) OR substring(v_blob from 5 for v_len) <> convert_to(v_type,'UTF8') THEN RAISE EXCEPTION 'invalid ssh public key format'; END IF;
  IF v_type = 'ssh-rsa' AND length(v_blob) < 270 THEN RAISE EXCEPTION 'rsa key too short (min 2048 bits)'; END IF;
  NEW.fingerprint := 'SHA256:' || rtrim(encode(sha256(v_blob), 'base64'), '=');
  IF EXISTS (SELECT 1 FROM cloud_ssh_keys WHERE user_id = NEW.user_id AND fingerprint = NEW.fingerprint AND id <> NEW.id) THEN RAISE EXCEPTION 'ssh key already added'; END IF;
  IF TG_OP = 'INSERT' AND (SELECT count(*) FROM cloud_ssh_keys WHERE user_id = NEW.user_id) >= 20 THEN RAISE EXCEPTION 'too many ssh keys'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cloud_ssh_keys_validate ON public.cloud_ssh_keys;
CREATE TRIGGER cloud_ssh_keys_validate BEFORE INSERT OR UPDATE ON public.cloud_ssh_keys FOR EACH ROW EXECUTE FUNCTION public.cloud_ssh_keys_validate();

CREATE TABLE IF NOT EXISTS public.cloud_email_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  template text NOT NULL,
  category text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('cloud','billing')),
  locale text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
  server_id uuid,
  subscription_id uuid,
  order_id uuid,
  recipient text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed','retrying','manual_review')),
  attempts int NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  delivery_status text CHECK (delivery_status IN ('delivered','bounced','complained','delayed')),
  delivery_checked_at timestamptz,
  last_error text,
  idempotency_key text NOT NULL UNIQUE,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_email_jobs TO authenticated;
GRANT ALL ON public.cloud_email_jobs TO service_role;
ALTER TABLE public.cloud_email_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read cloud email jobs" ON public.cloud_email_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS cloud_email_jobs_due ON public.cloud_email_jobs (status, scheduled_at);
CREATE INDEX IF NOT EXISTS cloud_email_jobs_created ON public.cloud_email_jobs (created_at DESC);
CREATE TRIGGER cloud_email_jobs_updated BEFORE UPDATE ON public.cloud_email_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.cloud_enqueue_email(p_user uuid, p_template text, p_key text, p_data jsonb DEFAULT '{}'::jsonb,
  p_server uuid DEFAULT NULL, p_sub uuid DEFAULT NULL, p_order uuid DEFAULT NULL, p_test boolean DEFAULT false, p_recipient text DEFAULT NULL, p_locale text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_sender text; v_cat text; v_to text; v_loc text;
BEGIN
  v_sender := CASE WHEN p_template IN ('payment_receipt','payment_received','invoice','renewal_reminder','renewal_successful','renewal_failed','grace_started','refund') THEN 'billing' ELSE 'cloud' END;
  v_cat := CASE
    WHEN p_template = 'server_ready' THEN 'server_ready'
    WHEN p_template IN ('provisioning_started','provisioning_delayed') THEN 'provisioning'
    WHEN p_template IN ('payment_receipt','payment_received','invoice','refund') THEN 'billing'
    WHEN p_template IN ('renewal_reminder','renewal_successful','renewal_failed','grace_started') THEN 'renewal'
    WHEN p_template IN ('suspension_warning','service_suspended','service_reactivated') THEN 'suspension'
    WHEN p_template IN ('termination_warning','final_termination_warning','service_terminated','cancellation_scheduled') THEN 'termination'
    WHEN p_template = 'maintenance' THEN 'maintenance'
    ELSE 'other' END;
  v_to := coalesce(p_recipient, (SELECT email FROM auth.users WHERE id = p_user));
  v_loc := coalesce(p_locale, CASE WHEN (SELECT language FROM user_settings WHERE user_id = p_user) = 'en' THEN 'en' ELSE 'ar' END);
  INSERT INTO cloud_email_jobs (user_id, template, category, sender, locale, server_id, subscription_id, order_id, recipient, data, idempotency_key, is_test,
    status, last_error)
  VALUES (p_user, p_template, v_cat, v_sender, v_loc, p_server, p_sub, p_order, v_to, coalesce(p_data,'{}'::jsonb), p_key, p_test,
    CASE WHEN v_to IS NULL THEN 'manual_review' ELSE 'queued' END, CASE WHEN v_to IS NULL THEN 'no_recipient' END)
  ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.cloud_enqueue_email(uuid,text,text,jsonb,uuid,uuid,uuid,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_enqueue_email(uuid,text,text,jsonb,uuid,uuid,uuid,boolean,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cloud_claim_email_jobs(p_limit int DEFAULT 20)
RETURNS SETOF public.cloud_email_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE cloud_email_jobs SET status = 'manual_review', last_error = 'send_outcome_unknown', locked_until = NULL
   WHERE status = 'sending' AND locked_until < now();
  RETURN QUERY
  UPDATE cloud_email_jobs j SET status = 'sending', attempts = j.attempts + 1, locked_until = now() + interval '5 minutes'
   WHERE j.id IN (SELECT id FROM cloud_email_jobs WHERE status IN ('queued','retrying') AND scheduled_at <= now()
                  ORDER BY scheduled_at LIMIT greatest(1, least(p_limit, 50)) FOR UPDATE SKIP LOCKED)
  RETURNING j.*;
END $$;
REVOKE ALL ON FUNCTION public.cloud_claim_email_jobs(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_claim_email_jobs(int) TO service_role;

CREATE OR REPLACE FUNCTION public.cloud_finish_email_job(p_id uuid, p_ok boolean, p_message_id text DEFAULT NULL, p_error text DEFAULT NULL, p_permanent boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v cloud_email_jobs;
BEGIN
  SELECT * INTO v FROM cloud_email_jobs WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v.status <> 'sending' THEN RETURN 'ignored'; END IF;
  IF p_ok THEN
    UPDATE cloud_email_jobs SET status = 'sent', sent_at = now(), provider_message_id = p_message_id, locked_until = NULL, last_error = NULL WHERE id = p_id; RETURN 'sent';
  ELSIF p_permanent OR v.attempts >= 5 THEN
    UPDATE cloud_email_jobs SET status = CASE WHEN p_permanent THEN 'failed' ELSE 'manual_review' END, locked_until = NULL, last_error = left(p_error, 300) WHERE id = p_id;
    INSERT INTO cloud_admin_alerts (kind, severity, message, dedupe_key, details)
      VALUES ('email_delivery_failed', 'warning', 'Cloud email could not be delivered', 'email_fail:' || p_id, jsonb_build_object('email_job', p_id, 'template', v.template))
      ON CONFLICT DO NOTHING;
    RETURN 'gave_up';
  ELSE
    UPDATE cloud_email_jobs SET status = 'retrying', locked_until = NULL, last_error = left(p_error, 300),
      scheduled_at = now() + (power(2, v.attempts) * interval '1 minute') WHERE id = p_id;
    RETURN 'retrying';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.cloud_finish_email_job(uuid,boolean,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_finish_email_job(uuid,boolean,text,text,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public._cloud_notify(p_sub cloud_subscriptions, p_event text, p_ar text, p_en text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.cloud_subscription_events(subscription_id, user_id, event, details, is_simulation)
  VALUES (p_sub.id, p_sub.user_id, 'notify:' || p_event, p_data || jsonb_build_object('ar', p_ar, 'en', p_en), p_sub.is_simulation);
  IF NOT p_sub.is_simulation AND NOT coalesce(p_sub.is_lifecycle_test, false) THEN
    INSERT INTO public.notifications(user_id, title, message, type) VALUES (p_sub.user_id, p_ar, p_en, 'cloud');
    PERFORM public.cloud_enqueue_email(p_sub.user_id, p_event,
      'sub:' || p_sub.id || ':' || p_event || ':' || coalesce(p_data->>'key', p_sub.current_period_end::text, p_sub.next_renewal_at::text, to_char(now(),'YYYYMMDDHH24')),
      p_data || jsonb_build_object('amount_minor', coalesce(p_data->'amount_minor', to_jsonb(p_sub.renewal_total_minor))), p_sub.server_id, p_sub.id, p_sub.order_id);
  END IF;
END $function$;

CREATE OR REPLACE FUNCTION public.cloud_provisioning_email_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_order cloud_orders; v_tpl text;
BEGIN
  IF NEW.is_simulation OR NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  v_tpl := CASE WHEN NEW.status = 'provisioning' AND OLD.status = 'queued' THEN 'provisioning_started'
                WHEN NEW.status = 'active' THEN 'server_ready'
                WHEN NEW.status IN ('manual_review','refund_eligible') THEN 'provisioning_delayed' END;
  IF v_tpl IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_order FROM cloud_orders WHERE id = NEW.order_id;
  IF NOT FOUND OR v_order.is_simulation THEN RETURN NEW; END IF;
  PERFORM public.cloud_enqueue_email(v_order.user_id, v_tpl, 'prov:' || NEW.id || ':' || v_tpl, '{}'::jsonb, NEW.server_id, NULL, v_order.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cloud_provisioning_email ON public.cloud_provisioning_jobs;
CREATE TRIGGER cloud_provisioning_email AFTER UPDATE OF status ON public.cloud_provisioning_jobs FOR EACH ROW EXECUTE FUNCTION public.cloud_provisioning_email_trigger();

CREATE OR REPLACE FUNCTION public.cloud_order_receipt_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'paid' AND NOT coalesce(NEW.is_simulation,false) THEN
    PERFORM public.cloud_enqueue_email(NEW.user_id, 'payment_receipt', 'order:' || NEW.id || ':payment_receipt', '{}'::jsonb, NEW.server_id, NULL, NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cloud_order_receipt ON public.cloud_orders;
CREATE TRIGGER cloud_order_receipt AFTER INSERT ON public.cloud_orders FOR EACH ROW EXECUTE FUNCTION public.cloud_order_receipt_trigger();

CREATE OR REPLACE FUNCTION public.cloud_scheduler_secret_ok(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce(length(p_secret) >= 32 AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cloud_scheduler_secret' AND decrypted_secret = p_secret), false)
$$;
REVOKE ALL ON FUNCTION public.cloud_scheduler_secret_ok(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cloud_scheduler_secret_ok(text) TO service_role;

CREATE OR REPLACE FUNCTION public.cloud_orders_require_ssh_key()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT coalesce(NEW.is_simulation, false) AND NOT EXISTS (
       SELECT 1 FROM cloud_servers s JOIN cloud_ssh_keys k ON k.id = s.ssh_key_id AND k.user_id = s.user_id
        WHERE s.id = NEW.server_id) THEN
    RAISE EXCEPTION 'ssh key required';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cloud_orders_require_ssh_key ON public.cloud_orders;
CREATE TRIGGER cloud_orders_require_ssh_key BEFORE INSERT ON public.cloud_orders FOR EACH ROW EXECUTE FUNCTION public.cloud_orders_require_ssh_key();