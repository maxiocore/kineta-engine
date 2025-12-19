-- Create user_settings table for client preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_orders BOOLEAN NOT NULL DEFAULT true,
  notification_promotions BOOLEAN NOT NULL DEFAULT true,
  notification_push BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'ar',
  theme TEXT NOT NULL DEFAULT 'system',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all settings
CREATE POLICY "Admins can manage all user settings"
ON public.user_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for auto init user settings
CREATE OR REPLACE FUNCTION public.init_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_init_settings ON public.profiles;
CREATE TRIGGER on_profile_created_init_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.init_user_settings();

-- Add realtime for user_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;