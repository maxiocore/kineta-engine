-- Create table for favorite import categories
CREATE TABLE public.favorite_import_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.api_providers(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  auto_translate BOOLEAN DEFAULT true,
  apply_profit_margin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id, category_name)
);

-- Enable RLS
ALTER TABLE public.favorite_import_categories ENABLE ROW LEVEL SECURITY;

-- Admins can manage all favorites
CREATE POLICY "Admins can manage favorite import categories"
ON public.favorite_import_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_favorite_import_categories_user_provider 
ON public.favorite_import_categories(user_id, provider_id);