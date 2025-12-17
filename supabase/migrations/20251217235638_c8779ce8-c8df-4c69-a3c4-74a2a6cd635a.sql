-- Create system_settings table for storing platform settings
CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL DEFAULT '{}',
    category text NOT NULL DEFAULT 'general',
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

-- Insert default settings
INSERT INTO public.system_settings (key, value, category) VALUES
('site_name', '"ماركت برو"', 'general'),
('site_description', '"منصة تسويق رقمي متكاملة مدعومة بالذكاء الاصطناعي"', 'general'),
('contact_email', '"hello@marketpro.com"', 'general'),
('contact_phone', '"+966500000000"', 'general'),
('notification_new_orders', 'true', 'notifications'),
('notification_new_users', 'true', 'notifications'),
('notification_payments', 'true', 'notifications'),
('notification_daily_reports', 'false', 'notifications'),
('security_2fa_required', 'true', 'security'),
('security_activity_logging', 'true', 'security'),
('security_account_lockout', 'true', 'security'),
('security_email_verification', 'false', 'security'),
('maintenance_mode', 'false', 'system'),
('max_upload_size', '10', 'system');