-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to send notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_text TEXT;
  order_num TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get status text in Arabic
    CASE NEW.status
      WHEN 'pending' THEN status_text := 'قيد الانتظار';
      WHEN 'confirmed' THEN status_text := 'مؤكد';
      WHEN 'in_progress' THEN status_text := 'قيد التنفيذ';
      WHEN 'completed' THEN status_text := 'مكتمل';
      WHEN 'cancelled' THEN status_text := 'ملغي';
      WHEN 'refunded' THEN status_text := 'مسترد';
      ELSE status_text := NEW.status;
    END CASE;

    -- Insert notification
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
CREATE TRIGGER trigger_order_status_notification
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();