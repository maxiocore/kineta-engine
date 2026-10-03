
-- 1. PII
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 2. Referrals
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Anyone can view referral codes for validation" ON public.referral_codes;
REVOKE INSERT, UPDATE, DELETE ON public.referrals, public.referral_codes, public.referral_commissions FROM anon, authenticated;
GRANT SELECT ON public.referrals, public.referral_codes, public.referral_commissions TO authenticated;

ALTER TABLE public.referral_commissions ADD COLUMN IF NOT EXISTS deposit_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS referral_commissions_order_uniq ON public.referral_commissions(order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referral_commissions_deposit_uniq ON public.referral_commissions(deposit_id) WHERE deposit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_uniq ON public.referrals(referred_id);

CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_code record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_code IS NULL OR length(btrim(p_code)) < 4 OR length(p_code) > 32 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  SELECT * INTO v_code FROM referral_codes WHERE upper(code) = upper(btrim(p_code)) AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_code.user_id = uid THEN RETURN jsonb_build_object('ok', false, 'error', 'own_code'); END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = uid) THEN RETURN jsonb_build_object('ok', false, 'error', 'already_referred'); END IF;
  INSERT INTO referrals(referrer_id, referred_id, referral_code, status, converted_at)
  VALUES (v_code.user_id, uid, upper(btrim(p_code)), 'converted', now()) ON CONFLICT (referred_id) DO NOTHING;
  IF FOUND THEN UPDATE referral_codes SET total_referrals = total_referrals + 1 WHERE id = v_code.id; END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_my_referral_code()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  INSERT INTO referral_codes(user_id, code) VALUES (uid, upper(substring(md5(random()::text || uid::text) from 1 for 8)))
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v FROM referral_codes WHERE user_id = uid;
  RETURN to_jsonb(v);
END; $$;

CREATE OR REPLACE FUNCTION public.calculate_referral_commission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_record record; commission numeric; effective_rate numeric; v_cid uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') AND coalesce(NEW.total_price,0) > 0 THEN
    SELECT r.id, r.referrer_id, r.commission_rate, rc.custom_commission_rate, COALESCE(vl.commission_rate, 5) AS vip_rate
      INTO ref_record
      FROM referrals r JOIN referral_codes rc ON rc.user_id = r.referrer_id LEFT JOIN vip_levels vl ON vl.id = rc.vip_level_id
      WHERE r.referred_id = NEW.user_id AND r.status = 'converted' AND r.referrer_id <> NEW.user_id;
    IF FOUND THEN
      effective_rate := least(greatest(COALESCE(ref_record.custom_commission_rate, ref_record.vip_rate, ref_record.commission_rate, 5), 0), 50);
      commission := round(NEW.total_price * effective_rate / 100, 2);
      IF commission > 0 THEN
        INSERT INTO referral_commissions(referral_id, order_id, order_amount, commission_rate, commission_amount)
        VALUES (ref_record.id, NEW.id, NEW.total_price, effective_rate, commission)
        ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING RETURNING id INTO v_cid;
        IF v_cid IS NOT NULL THEN
          UPDATE referrals SET total_commission = total_commission + commission WHERE id = ref_record.id;
          UPDATE referral_codes SET total_earnings = total_earnings + commission WHERE user_id = ref_record.referrer_id;
          PERFORM _wallet_post(ref_record.referrer_id, commission, 'referral_commission', 'referral_commission', v_cid,
            'refc:order:' || NEW.id, 'عمولة إحالة للطلب ' || NEW.order_number, NULL, NULL, false);
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.calculate_referral_commission_on_deposit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_record record; commission numeric; effective_rate numeric; v_cid uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') AND coalesce(NEW.amount,0) > 0 THEN
    SELECT r.id, r.referrer_id, r.commission_rate, rc.custom_commission_rate, COALESCE(vl.commission_rate, 5) AS vip_rate
      INTO ref_record
      FROM referrals r JOIN referral_codes rc ON rc.user_id = r.referrer_id LEFT JOIN vip_levels vl ON vl.id = rc.vip_level_id
      WHERE r.referred_id = NEW.user_id AND r.status = 'converted' AND r.referrer_id <> NEW.user_id;
    IF FOUND THEN
      effective_rate := least(greatest(COALESCE(ref_record.custom_commission_rate, ref_record.vip_rate, ref_record.commission_rate, 5), 0), 50);
      commission := round(NEW.amount * effective_rate / 100, 2);
      IF commission > 0 THEN
        INSERT INTO referral_commissions(referral_id, deposit_id, order_amount, commission_rate, commission_amount)
        VALUES (ref_record.id, NEW.id, NEW.amount, effective_rate, commission)
        ON CONFLICT (deposit_id) WHERE deposit_id IS NOT NULL DO NOTHING RETURNING id INTO v_cid;
        IF v_cid IS NOT NULL THEN
          UPDATE referrals SET total_commission = total_commission + commission WHERE id = ref_record.id;
          UPDATE referral_codes SET total_earnings = total_earnings + commission WHERE user_id = ref_record.referrer_id;
          PERFORM _wallet_post(ref_record.referrer_id, commission, 'referral_commission', 'referral_commission', v_cid,
            'refc:dep:' || NEW.id, 'عمولة إحالة من إيداع', NULL, NULL, false);
          INSERT INTO notifications(user_id, title, message, type)
          VALUES (ref_record.referrer_id, 'عمولة إحالة جديدة', 'حصلت على عمولة ' || commission || ' ر.س من إيداع أحد المُحالين', 'success');
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 3. Cloud cost / margin
REVOKE SELECT ON public.cloud_orders FROM anon, authenticated;
GRANT SELECT (id, user_id, server_id, plan_id, idempotency_key, transaction_reference, subtotal, vat_rate, vat_amount, total,
  payment_method, status, created_at, updated_at, location_code, retail_price_before_vat, retail_server_price, retail_ipv4_price,
  retail_backup_price, retail_addons_price, ipv4_selected, backups_selected, included_traffic_tb, traffic_overage_price,
  traffic_overage_currency, is_e2e_test, refunded_at, refund_amount) ON public.cloud_orders TO authenticated;
GRANT ALL ON public.cloud_orders TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_cloud_orders()
RETURNS SETOF public.cloud_orders LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN QUERY SELECT * FROM cloud_orders ORDER BY created_at DESC LIMIT 1000;
END; $$;

-- 4. Deposits
CREATE OR REPLACE FUNCTION public.deposits_client_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_m record; v_b record; v_fee numeric := 0; v_bonus numeric := 0; v_val numeric;
BEGIN
  IF coalesce(auth.role(), '') <> 'authenticated' OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 OR NEW.amount > 1000000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  SELECT * INTO v_m FROM payment_methods WHERE id = NEW.payment_method_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_PAYMENT_METHOD'; END IF;
  IF v_m.min_amount IS NOT NULL AND NEW.amount < v_m.min_amount THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF v_m.max_amount IS NOT NULL AND NEW.amount > v_m.max_amount THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF coalesce(v_m.extra_fee_value, 0) > 0 THEN
    v_fee := CASE WHEN v_m.extra_fee_type = 'percentage' THEN NEW.amount * v_m.extra_fee_value / 100 ELSE v_m.extra_fee_value END;
  END IF;
  FOR v_b IN SELECT * FROM payment_bonuses WHERE is_active = true
      AND (payment_method_id IS NULL OR payment_method_id = NEW.payment_method_id)
      AND NEW.amount >= min_amount AND (max_amount IS NULL OR NEW.amount <= max_amount) LOOP
    v_val := CASE WHEN v_b.bonus_type = 'percentage' THEN NEW.amount * v_b.bonus_value / 100 ELSE v_b.bonus_value END;
    IF v_val > v_bonus THEN v_bonus := v_val; END IF;
  END LOOP;
  NEW.status := 'pending';
  NEW.completed_at := NULL;
  NEW.fee_amount := round(v_fee, 2);
  NEW.bonus_amount := round(v_bonus, 2);
  NEW.total_credited := round(greatest(0, NEW.amount - v_fee + v_bonus), 2);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS deposits_client_guard ON public.deposits;
CREATE TRIGGER deposits_client_guard BEFORE INSERT ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.deposits_client_guard();
REVOKE UPDATE, DELETE ON public.deposits FROM anon;

CREATE OR REPLACE FUNCTION public.update_balance_on_deposit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_res jsonb;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') AND coalesce(NEW.total_credited,0) > 0 THEN
    v_res := _wallet_post(NEW.user_id, round(NEW.total_credited,2), 'deposit', 'deposit', NEW.id, 'dep:' || NEW.id,
      'إيداع رصيد', NULL, NULL, false);
    IF NOT (v_res->>'duplicate')::boolean THEN
      PERFORM set_config('app.wallet_ledger', 'on', true);
      UPDATE user_balances SET total_deposited = coalesce(total_deposited,0) + round(NEW.total_credited,2) WHERE user_id = NEW.user_id;
      PERFORM set_config('app.wallet_ledger', 'off', true);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.award_cashback_on_deposit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; cb numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    IF EXISTS (SELECT 1 FROM cashback_transactions WHERE reference_id = NEW.id AND type = 'earned') THEN RETURN NEW; END IF;
    SELECT * INTO s FROM cashback_settings WHERE is_active = true LIMIT 1;
    IF FOUND AND s.cashback_percentage > 0 AND NEW.amount >= s.min_deposit_amount THEN
      cb := NEW.amount * (s.cashback_percentage / 100);
      IF s.max_cashback_amount IS NOT NULL AND cb > s.max_cashback_amount THEN cb := s.max_cashback_amount; END IF;
      INSERT INTO user_cashback (user_id, cashback_balance, total_earned) VALUES (NEW.user_id, cb, cb)
      ON CONFLICT (user_id) DO UPDATE SET cashback_balance = user_cashback.cashback_balance + cb,
        total_earned = user_cashback.total_earned + cb, updated_at = now();
      INSERT INTO cashback_transactions (user_id, amount, type, description, description_ar, reference_id)
      VALUES (NEW.user_id, cb, 'earned', 'Cashback from deposit of ' || NEW.amount || ' SAR', 'كاش باك من شحن رصيد بقيمة ' || NEW.amount || ' ر.س', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Verified provider completion (service_role only): locks the deposit, checks amount/currency, completes once.
CREATE OR REPLACE FUNCTION public.complete_deposit_verified(p_deposit_id uuid, p_verified_amount numeric, p_currency text, p_provider_ref text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d record;
BEGIN
  SELECT * INTO d FROM deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_deposit'); END IF;
  IF d.status = 'completed' THEN RETURN jsonb_build_object('ok', true, 'duplicate', true, 'amount', d.total_credited); END IF;
  IF d.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_pending'); END IF;
  IF upper(coalesce(p_currency,'')) <> 'SAR' THEN RETURN jsonb_build_object('ok', false, 'error', 'currency_mismatch'); END IF;
  IF p_verified_amount IS NULL OR round(p_verified_amount, 2) <> round(d.amount, 2) THEN RETURN jsonb_build_object('ok', false, 'error', 'amount_mismatch'); END IF;
  IF p_provider_ref IS NULL OR d.transaction_id IS DISTINCT FROM p_provider_ref THEN RETURN jsonb_build_object('ok', false, 'error', 'reference_mismatch'); END IF;
  UPDATE deposits SET status = 'completed', completed_at = now() WHERE id = d.id;
  INSERT INTO audit_logs(table_name, action, new_value, metadata)
  VALUES ('deposits', 'DEPOSIT_VERIFIED_COMPLETED', jsonb_build_object('amount', d.amount, 'credited', d.total_credited),
    jsonb_build_object('deposit_id', d.id, 'provider_ref', p_provider_ref, 'user_id', d.user_id));
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'amount', d.total_credited);
END; $$;

-- 6. Server action rate limit (service_role only)
DROP POLICY IF EXISTS "own actions request" ON public.cloud_server_actions;
CREATE OR REPLACE FUNCTION public.cloud_action_rate_check(p_user uuid, p_server uuid, p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n_server int; n_user int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('cloud_action:' || p_user::text));
  SELECT count(*) INTO n_server FROM cloud_activity_logs WHERE server_id = p_server AND event = 'action_attempt' AND created_at > now() - interval '60 seconds';
  SELECT count(*) INTO n_user FROM cloud_activity_logs WHERE user_id = p_user AND event = 'action_attempt' AND created_at > now() - interval '1 hour';
  IF n_server >= 3 OR n_user >= 30 THEN
    INSERT INTO cloud_activity_logs(user_id, server_id, event, details) VALUES (p_user, p_server, 'action_rate_limited', jsonb_build_object('action', p_action));
    RETURN false;
  END IF;
  INSERT INTO cloud_activity_logs(user_id, server_id, event, details) VALUES (p_user, p_server, 'action_attempt', jsonb_build_object('action', p_action));
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.complete_deposit_verified(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_action_rate_check(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deposits_client_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_deposit_verified(uuid, numeric, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cloud_action_rate_check(uuid, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_my_referral_code() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_cloud_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_cloud_orders() TO authenticated, service_role;
