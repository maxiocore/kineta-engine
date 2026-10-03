
DO $$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.payment_create(uuid,text,uuid,jsonb,text,text)'::regprocedure);
  d := replace(d, 'BEGIN v_amount := round((p_intent->>''amount'')::numeric, 2); EXCEPTION WHEN others THEN RAISE EXCEPTION ''INVALID_AMOUNT''; END;',
    'BEGIN v_amount := (p_intent->>''amount'')::numeric; EXCEPTION WHEN others THEN RAISE EXCEPTION ''INVALID_AMOUNT''; END;
    IF v_amount IS NOT NULL AND v_amount <> round(v_amount, 2) THEN RAISE EXCEPTION ''INVALID_AMOUNT''; END IF;');
  IF position('v_amount <> round(v_amount, 2)' in d) = 0 THEN RAISE EXCEPTION 'patch_failed'; END IF;
  EXECUTE d;
END $$;
