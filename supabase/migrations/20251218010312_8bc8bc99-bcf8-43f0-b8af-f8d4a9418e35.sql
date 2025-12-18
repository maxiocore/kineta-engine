-- Add external_service_id to services table to store BulkFollows service ID
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS external_service_id TEXT;

-- Add link and quantity fields to orders table for SMM panel orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_status TEXT;

-- Add index for external lookups
CREATE INDEX IF NOT EXISTS idx_services_external_id ON public.services(external_service_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_order_id);