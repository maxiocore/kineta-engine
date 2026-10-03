ALTER TABLE public.cloud_images
  ADD COLUMN IF NOT EXISTS provider_image_id text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS provider_status text;

ALTER TABLE public.cloud_orders ADD COLUMN IF NOT EXISTS overage_cost_sar numeric;
ALTER TABLE public.cloud_plans ADD COLUMN IF NOT EXISTS retail_overage_price_sar numeric;

CREATE OR REPLACE FUNCTION public.cloud_orders_overage_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.traffic_overage_price IS NOT NULL AND NEW.exchange_rate_used IS NOT NULL THEN
    NEW.overage_cost_sar := round(NEW.traffic_overage_price * NEW.exchange_rate_used, 4);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cloud_orders_overage ON public.cloud_orders;
CREATE TRIGGER trg_cloud_orders_overage BEFORE INSERT ON public.cloud_orders FOR EACH ROW EXECUTE FUNCTION public.cloud_orders_overage_snapshot();

-- Customer-safe traffic info per active plan + location (no provider names, ids or costs beyond the converted overage display price)
CREATE OR REPLACE FUNCTION public.get_cloud_plan_traffic()
RETURNS TABLE(plan_id uuid, location_code text, included_traffic_tb numeric, extra_traffic_sar_per_tb numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, l.code, pp.included_traffic_tb,
    COALESCE(p.retail_overage_price_sar, round(pp.overage_price_per_tb * public.cloud_effective_rate(), 2))
  FROM cloud_plans p
  JOIN cloud_plan_costs c ON c.plan_id = p.id
  JOIN cloud_locations l ON l.code = ANY(p.location_codes) AND l.is_active AND l.customer_visible
  LEFT JOIN cloud_resource_mappings m ON m.kind='location' AND m.code=l.code AND m.provider_id=c.provider_id
  JOIN cloud_provider_prices pp ON pp.provider_id=c.provider_id AND pp.server_type=c.provider_ref AND pp.location=COALESCE(m.provider_ref, l.code)
  WHERE p.is_active AND p.status='active';
$$;
REVOKE ALL ON FUNCTION public.get_cloud_plan_traffic() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cloud_plan_traffic() TO authenticated;