-- Create trigger function to notify users on deposit completion
CREATE OR REPLACE FUNCTION public.notify_deposit_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'تم إيداع الرصيد بنجاح',
      'تم إضافة ' || NEW.total_credited || ' ر.س إلى رصيدك',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_notify_deposit_complete ON public.deposits;
CREATE TRIGGER trigger_notify_deposit_complete
AFTER UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.notify_deposit_complete();

-- Create trigger function to notify users on ticket reply
CREATE OR REPLACE FUNCTION public.notify_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  ticket_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get ticket info
  SELECT * INTO ticket_record FROM public.support_tickets WHERE id = NEW.ticket_id;
  
  -- Only notify if it's from admin to user
  IF NEW.is_admin = true THEN
    notification_title := 'رد جديد على تذكرتك';
    notification_message := 'تم الرد على تذكرة: ' || ticket_record.subject;
    
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      ticket_record.user_id,
      notification_title,
      notification_message,
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_ticket_reply ON public.ticket_messages;
CREATE TRIGGER trigger_notify_ticket_reply
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_reply();

-- Create trigger function to notify users on ticket status change
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_text TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get status text in Arabic
    CASE NEW.status
      WHEN 'open' THEN status_text := 'مفتوحة';
      WHEN 'in_progress' THEN status_text := 'قيد المعالجة';
      WHEN 'resolved' THEN status_text := 'تم الحل';
      WHEN 'closed' THEN status_text := 'مغلقة';
      ELSE status_text := NEW.status::text;
    END CASE;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'تحديث حالة التذكرة',
      'تم تحديث حالة تذكرتك "' || NEW.subject || '" إلى: ' || status_text,
      CASE 
        WHEN NEW.status = 'resolved' THEN 'success'
        WHEN NEW.status = 'closed' THEN 'info'
        ELSE 'info'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_ticket_status ON public.support_tickets;
CREATE TRIGGER trigger_notify_ticket_status
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_status_change();