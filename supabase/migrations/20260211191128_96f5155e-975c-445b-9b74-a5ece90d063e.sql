
-- Create table to store iOS device tokens for push notifications
CREATE TABLE public.ios_device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  device_name TEXT,
  os_version TEXT,
  app_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE public.ios_device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can view their own device tokens"
  ON public.ios_device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device tokens"
  ON public.ios_device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens"
  ON public.ios_device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens"
  ON public.ios_device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all tokens for sending notifications
CREATE POLICY "Admins can view all device tokens"
  ON public.ios_device_tokens FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookup
CREATE INDEX idx_ios_device_tokens_user_id ON public.ios_device_tokens(user_id);
CREATE INDEX idx_ios_device_tokens_active ON public.ios_device_tokens(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_ios_device_tokens_updated_at
  BEFORE UPDATE ON public.ios_device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
