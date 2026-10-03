CREATE TABLE public.cloud_provider_addon_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.cloud_providers(id) ON DELETE CASCADE,
  resource text NOT NULL,
  location text NOT NULL DEFAULT '*',
  variant text NOT NULL DEFAULT '',
  unit text,
  price_net numeric,
  price_gross numeric,
  percentage numeric,
  currency text NOT NULL DEFAULT 'EUR',
  pricing_available boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'provider_api',
  note text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, resource, location, variant)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_provider_addon_prices TO authenticated;
GRANT ALL ON public.cloud_provider_addon_prices TO service_role;
ALTER TABLE public.cloud_provider_addon_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage addon prices" ON public.cloud_provider_addon_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.cloud_provider_prices
  ADD COLUMN IF NOT EXISTS overage_price_per_tb numeric,
  ADD COLUMN IF NOT EXISTS overage_source text;

ALTER TABLE public.cloud_plans
  ADD COLUMN IF NOT EXISTS ipv4_mode text NOT NULL DEFAULT 'included',
  ADD COLUMN IF NOT EXISTS retail_backup_price numeric,
  ADD COLUMN IF NOT EXISTS ipv4_retail_price numeric;

ALTER TABLE public.cloud_locations
  ADD COLUMN IF NOT EXISTS customer_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS provider_available boolean NOT NULL DEFAULT true;