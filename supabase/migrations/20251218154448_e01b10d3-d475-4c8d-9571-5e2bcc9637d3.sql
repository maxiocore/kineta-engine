-- Add category/type column to api_providers table
ALTER TABLE public.api_providers 
ADD COLUMN category text DEFAULT 'smm';

-- Add description column for notes
ALTER TABLE public.api_providers 
ADD COLUMN description text;

-- Create index for category filtering
CREATE INDEX idx_api_providers_category ON public.api_providers(category);