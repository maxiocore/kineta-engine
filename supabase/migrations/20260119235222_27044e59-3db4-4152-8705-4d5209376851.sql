-- Drop the permissive policy and create a proper one
DROP POLICY IF EXISTS "Service role full access" ON public.whatsapp_verifications;

-- Only allow service role to access (via edge functions)
-- No anonymous access allowed
CREATE POLICY "No public access" ON public.whatsapp_verifications
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);