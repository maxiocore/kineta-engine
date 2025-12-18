
-- Create table for API providers (SMM panels)
CREATE TABLE public.api_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  profit_margin NUMERIC NOT NULL DEFAULT 30,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  services_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API providers
CREATE POLICY "Admins can manage API providers"
  ON public.api_providers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_api_providers_updated_at
  BEFORE UPDATE ON public.api_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add provider_id to services table to track source
ALTER TABLE public.services 
ADD COLUMN provider_id UUID REFERENCES public.api_providers(id) ON DELETE SET NULL;
