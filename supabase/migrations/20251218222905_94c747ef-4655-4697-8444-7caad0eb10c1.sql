-- Create table for saving user's recent links
CREATE TABLE public.user_recent_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  link text NOT NULL,
  service_category text,
  label text,
  use_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_recent_links_user_id ON public.user_recent_links(user_id);
CREATE INDEX idx_user_recent_links_last_used ON public.user_recent_links(last_used_at DESC);

-- Enable RLS
ALTER TABLE public.user_recent_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own links
CREATE POLICY "Users can view their own recent links"
ON public.user_recent_links
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert their own recent links"
ON public.user_recent_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update their own recent links"
ON public.user_recent_links
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete their own recent links"
ON public.user_recent_links
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all links
CREATE POLICY "Admins can manage all recent links"
ON public.user_recent_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));