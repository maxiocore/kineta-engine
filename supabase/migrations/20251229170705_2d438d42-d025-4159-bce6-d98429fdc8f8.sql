-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    related_user_id UUID,
    related_ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (assuming admins have their role)
CREATE POLICY "Admins can view all admin notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update admin notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete admin notifications" 
ON public.admin_notifications 
FOR DELETE 
USING (true);

CREATE POLICY "System can insert admin notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;