-- Create featured_offers table for special offers and featured services
CREATE TABLE public.featured_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  discount_percentage INTEGER DEFAULT 0,
  original_price NUMERIC,
  offer_price NUMERIC,
  image_url TEXT,
  badge_text TEXT,
  badge_text_ar TEXT,
  badge_color TEXT DEFAULT 'from-primary to-accent',
  category TEXT NOT NULL DEFAULT 'design', -- 'design', 'dev', 'smm'
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_offers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage featured offers" 
ON public.featured_offers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active offers" 
ON public.featured_offers 
FOR SELECT 
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_featured_offers_updated_at
BEFORE UPDATE ON public.featured_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();