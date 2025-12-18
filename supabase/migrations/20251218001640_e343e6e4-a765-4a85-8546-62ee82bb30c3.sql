-- Add maintenance schedule settings
INSERT INTO public.system_settings (key, value, category) VALUES
('maintenance_scheduled', 'false', 'system'),
('maintenance_start_time', 'null', 'system'),
('maintenance_end_time', 'null', 'system'),
('maintenance_message', '"نعمل حالياً على تحسين الموقع"', 'system')
ON CONFLICT (key) DO NOTHING;

-- Allow anyone to read maintenance schedule settings
CREATE POLICY "Anyone can read maintenance schedule"
ON public.system_settings
FOR SELECT
USING (key IN ('maintenance_scheduled', 'maintenance_start_time', 'maintenance_end_time', 'maintenance_message'));