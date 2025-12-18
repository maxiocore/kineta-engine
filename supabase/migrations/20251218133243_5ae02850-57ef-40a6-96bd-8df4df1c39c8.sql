-- Create categories table for organized service categorization
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Layers',
  color TEXT DEFAULT 'from-primary to-accent',
  description TEXT,
  description_ar TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id column to services table
ALTER TABLE public.services 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_services_category_id ON public.services(category_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;