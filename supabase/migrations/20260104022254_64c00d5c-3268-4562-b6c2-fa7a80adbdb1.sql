-- Create invoices table for order invoicing system
CREATE TABLE public.dev_order_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.dev_orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dev_order_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all invoices" 
ON public.dev_order_invoices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own order invoices" 
ON public.dev_order_invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM dev_orders 
  WHERE dev_orders.id = dev_order_invoices.order_id 
  AND dev_orders.user_id = auth.uid()
));

CREATE POLICY "Users can update their own order invoices for payment" 
ON public.dev_order_invoices 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM dev_orders 
  WHERE dev_orders.id = dev_order_invoices.order_id 
  AND dev_orders.user_id = auth.uid()
));

-- Add invoice status to dev_orders status options
-- The 'invoice_sent' status will be added to the application code

-- Create index for faster lookups
CREATE INDEX idx_dev_order_invoices_order_id ON public.dev_order_invoices(order_id);
CREATE INDEX idx_dev_order_invoices_status ON public.dev_order_invoices(status);

-- Enable realtime for invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.dev_order_invoices;