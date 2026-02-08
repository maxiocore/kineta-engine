CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  status_text TEXT;
  admin_record RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get status text in Arabic
    CASE NEW.status::text
      WHEN 'pending' THEN status_text := 'قيد الانتظار';
      WHEN 'confirmed' THEN status_text := 'مؤكد';
      WHEN 'in_progress' THEN status_text := 'قيد التنفيذ';
      WHEN 'completed' THEN status_text := 'مكتمل';
      WHEN 'cancelled' THEN status_text := 'ملغي';
      WHEN 'refunded' THEN status_text := 'مسترد';
      WHEN 'partial' THEN status_text := 'جزئي';
      WHEN 'processing' THEN status_text := 'قيد المعالجة';
      ELSE status_text := NEW.status::text;
    END CASE;

    -- Insert notification for the order owner
    INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
    VALUES (
      NEW.user_id,
      'تحديث حالة الطلب',
      'تم تحديث حالة طلبك رقم ' || NEW.order_number || ' إلى: ' || status_text,
      CASE 
        WHEN NEW.status = 'completed' THEN 'success'
        WHEN NEW.status = 'cancelled' THEN 'error'
        WHEN NEW.status = 'refunded' THEN 'warning'
        ELSE 'info'
      END,
      NEW.id
    );

    -- Insert notifications for all admins
    FOR admin_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      -- Don't notify if admin is the order owner
      IF admin_record.user_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
        VALUES (
          admin_record.user_id,
          'تغيير حالة طلب',
          'تم تغيير حالة الطلب رقم ' || NEW.order_number || ' من ' || 
            CASE OLD.status::text
              WHEN 'pending' THEN 'قيد الانتظار'
              WHEN 'confirmed' THEN 'مؤكد'
              WHEN 'in_progress' THEN 'قيد التنفيذ'
              WHEN 'completed' THEN 'مكتمل'
              WHEN 'cancelled' THEN 'ملغي'
              WHEN 'refunded' THEN 'مسترد'
              WHEN 'partial' THEN 'جزئي'
              WHEN 'processing' THEN 'قيد المعالجة'
              ELSE OLD.status::text
            END || ' إلى ' || status_text,
          'info',
          NEW.id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;