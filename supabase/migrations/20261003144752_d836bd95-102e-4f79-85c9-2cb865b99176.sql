CREATE TABLE public.live_payment_test_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK (amount_minor = 100),
  purpose text NOT NULL CHECK (purpose = 'wallet_topup_live_test'),
  max_payments int NOT NULL DEFAULT 1 CHECK (max_payments = 1),
  payment_id uuid REFERENCES public.payments(id),
  idempotency_key text,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);
GRANT SELECT ON public.live_payment_test_overrides TO authenticated;
GRANT ALL ON public.live_payment_test_overrides TO service_role;
ALTER TABLE public.live_payment_test_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read live test overrides" ON public.live_payment_test_overrides FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Atomic one-shot claim: returns the claimed override id, or the existing one for the same idempotency key (retry), else NULL.
CREATE OR REPLACE FUNCTION public.live_test_claim(p_user uuid, p_idempotency_key text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM public.live_payment_test_overrides
   WHERE user_id = p_user AND active AND expires_at > now() ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF o.idempotency_key IS NULL THEN
    UPDATE public.live_payment_test_overrides SET idempotency_key = p_idempotency_key WHERE id = o.id;
    RETURN o.id;
  END IF;
  IF o.idempotency_key = p_idempotency_key THEN RETURN o.id; END IF;
  RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.live_test_claim(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_test_claim(uuid, text) TO service_role;

INSERT INTO public.live_payment_test_overrides(user_id, amount_minor, purpose)
VALUES ('3030f5e0-95d4-4e9e-9075-07eaf560ce6f', 100, 'wallet_topup_live_test');