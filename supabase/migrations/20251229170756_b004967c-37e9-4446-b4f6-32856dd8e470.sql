-- Add delete policy for user notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow admins to delete admin notifications
CREATE POLICY "Admins can delete all notifications" 
ON public.notifications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));