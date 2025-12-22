-- Update the track_order_status_change function to handle system updates
CREATE OR REPLACE FUNCTION public.track_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Use auth.uid() if available, otherwise use system user ID for automated updates
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by, notes)
    VALUES (
      NEW.id, 
      OLD.status, 
      NEW.status, 
      COALESCE(auth.uid(), system_user_id),
      CASE 
        WHEN auth.uid() IS NULL THEN 'تحديث تلقائي من النظام'
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$function$;