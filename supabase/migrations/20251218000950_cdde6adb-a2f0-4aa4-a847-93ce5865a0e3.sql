-- Allow anyone to read the maintenance_mode setting (for checking if site is under maintenance)
CREATE POLICY "Anyone can read maintenance mode"
ON public.system_settings
FOR SELECT
USING (key = 'maintenance_mode');