-- Create SMS logs table
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID,
  reference_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all logs
CREATE POLICY "Admins can view all SMS logs" 
ON public.sms_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_sms_logs_created_at ON public.sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX idx_sms_logs_type ON public.sms_logs(type);

-- Add SMS notification setting
INSERT INTO public.system_settings (key, value, category)
VALUES ('sms_notifications_enabled', 'true', 'notifications')
ON CONFLICT (key) DO NOTHING;