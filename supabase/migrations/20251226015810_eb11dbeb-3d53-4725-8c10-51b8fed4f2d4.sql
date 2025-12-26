-- Create a function to get public platform statistics
-- This is safe because it only returns aggregate counts, no PII

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders),
    'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'completed'),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_services', (SELECT COUNT(*) FROM services WHERE status = 'active'),
    'total_deposits', (SELECT COUNT(*) FROM deposits WHERE status = 'completed')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;