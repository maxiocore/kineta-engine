-- Create a function to send push notifications
CREATE OR REPLACE FUNCTION public.notify_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger just ensures the notification is properly created
  -- The actual push notification is handled by the client-side listener
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_notification();

-- Create app_notifications table for admin broadcast notifications
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  action_url TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all',
  target_user_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  send_push BOOLEAN NOT NULL DEFAULT true,
  send_email BOOLEAN NOT NULL DEFAULT false,
  sent_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage
CREATE POLICY "Admins can manage app notifications" 
  ON public.app_notifications 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for users to view active notifications
CREATE POLICY "Users can view active notifications" 
  ON public.app_notifications 
  FOR SELECT 
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (target_audience = 'all' OR auth.uid() = ANY(target_user_ids))
  );

-- Create user_notification_reads table to track read status
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_notification_id UUID NOT NULL REFERENCES public.app_notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_notification_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reads
CREATE POLICY "Users can manage their notification reads" 
  ON public.user_notification_reads 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create function to update read count
CREATE OR REPLACE FUNCTION public.update_notification_read_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.app_notifications 
  SET read_count = read_count + 1 
  WHERE id = NEW.app_notification_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS on_notification_read ON public.user_notification_reads;
CREATE TRIGGER on_notification_read
  AFTER INSERT ON public.user_notification_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_read_count();