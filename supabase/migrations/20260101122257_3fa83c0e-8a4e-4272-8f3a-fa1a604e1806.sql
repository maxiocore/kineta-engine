-- Create financing payment receipts table
CREATE TABLE public.financing_payment_receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    installment_id UUID REFERENCES public.financing_installments(id),
    receipt_url TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bank_name TEXT NOT NULL DEFAULT 'مصرف الراجحي',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financing_payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment receipts"
ON public.financing_payment_receipts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment receipts"
ON public.financing_payment_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment receipts"
ON public.financing_payment_receipts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true);

-- Storage policies
CREATE POLICY "Users can upload payment receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their payment receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-receipts' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_financing_payment_receipts_updated_at
BEFORE UPDATE ON public.financing_payment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();