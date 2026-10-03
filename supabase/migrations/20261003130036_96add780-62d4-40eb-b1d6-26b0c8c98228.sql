CREATE OR REPLACE FUNCTION public.deposits_client_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_m record; v_b record; v_fee numeric := 0; v_bonus numeric := 0; v_val numeric;
BEGIN
  IF coalesce(auth.role(), '') <> 'authenticated' OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 OR NEW.amount > 1000000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF NEW.payment_method_id IS NOT NULL THEN
    SELECT * INTO v_m FROM payment_methods WHERE id = NEW.payment_method_id AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_PAYMENT_METHOD'; END IF;
    IF v_m.min_amount IS NOT NULL AND NEW.amount < v_m.min_amount THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
    IF v_m.max_amount IS NOT NULL AND NEW.amount > v_m.max_amount THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
    IF coalesce(v_m.extra_fee_value, 0) > 0 THEN
      v_fee := CASE WHEN v_m.extra_fee_type = 'percentage' THEN NEW.amount * v_m.extra_fee_value / 100 ELSE v_m.extra_fee_value END;
    END IF;
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
REVOKE ALL ON FUNCTION public.deposits_client_guard() FROM PUBLIC, anon, authenticated;