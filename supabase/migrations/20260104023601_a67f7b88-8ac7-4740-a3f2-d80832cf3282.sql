-- Drop existing constraint and add new one with invoice_sent status
ALTER TABLE public.dev_orders DROP CONSTRAINT IF EXISTS dev_orders_status_check;

ALTER TABLE public.dev_orders ADD CONSTRAINT dev_orders_status_check 
CHECK (status IN (
  'draft', 
  'pending_email_verification', 
  'under_review', 
  'need_info', 
  'invoice_sent',
  'accepted', 
  'in_progress', 
  'testing', 
  'completed', 
  'rejected', 
  'cancelled'
));