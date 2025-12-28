-- Create financing plans table (خطط التمويل المتاحة)
CREATE TABLE public.financing_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    installments_count INTEGER NOT NULL DEFAULT 1,
    duration_months INTEGER NOT NULL DEFAULT 1,
    min_amount NUMERIC NOT NULL DEFAULT 100,
    max_amount NUMERIC,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financing applications table (طلبات التمويل)
CREATE TABLE public.financing_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES public.financing_plans(id),
    
    -- معلومات مقدم الطلب
    full_name TEXT NOT NULL,
    national_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    
    -- معلومات الشركة (اختياري)
    company_name TEXT,
    commercial_register TEXT,
    tax_number TEXT,
    
    -- تفاصيل التمويل
    requested_amount NUMERIC NOT NULL,
    approved_amount NUMERIC,
    service_id UUID REFERENCES public.services(id),
    service_description TEXT,
    
    -- حالة الطلب
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'active', 'completed', 'defaulted', 'cancelled')),
    
    -- تواريخ مهمة
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    
    -- ملاحظات
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- معلومات العقد
    contract_number TEXT,
    contract_signed_at TIMESTAMP WITH TIME ZONE,
    contract_document_url TEXT,
    promissory_note_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financing installments table (أقساط التمويل)
CREATE TABLE public.financing_installments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    late_fee NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financing settings table (إعدادات نظام التمويل)
CREATE TABLE public.financing_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.financing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financing_plans
CREATE POLICY "Anyone can view active plans" ON public.financing_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.financing_plans
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for financing_applications
CREATE POLICY "Users can view their own applications" ON public.financing_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON public.financing_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications" ON public.financing_applications
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for financing_installments
CREATE POLICY "Users can view their installments" ON public.financing_installments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financing_applications
            WHERE id = financing_installments.application_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all installments" ON public.financing_installments
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for financing_settings
CREATE POLICY "Anyone can view settings" ON public.financing_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.financing_settings
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create sequence for application numbers
CREATE SEQUENCE IF NOT EXISTS financing_application_seq START 1000;

-- Function to generate application number
CREATE OR REPLACE FUNCTION public.generate_financing_application_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.application_number := 'FIN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('financing_application_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

-- Trigger for auto-generating application number
CREATE TRIGGER generate_financing_application_number_trigger
    BEFORE INSERT ON public.financing_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_financing_application_number();

-- Function to check overdue installments
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.financing_installments
    SET status = 'overdue', updated_at = now()
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- Insert default financing plans
INSERT INTO public.financing_plans (name, name_ar, description, description_ar, installments_count, duration_months, min_amount, max_amount, display_order)
VALUES 
    ('Pay in 30 Days', 'ادفع خلال 30 يوم', 'Get your services now and pay within 30 days', 'احصل على خدماتك الآن وادفع خلال 30 يوم بدون فوائد', 1, 1, 100, 5000, 1),
    ('2 Monthly Installments', 'قسطين شهريين', 'Split your payment into 2 equal installments', 'قسّم مبلغك على قسطين متساويين بدون فوائد', 2, 2, 200, 10000, 2),
    ('3 Monthly Installments', '3 أقساط شهرية', 'Split your payment into 3 easy installments', 'قسّم مبلغك على 3 أقساط سهلة بدون فوائد', 3, 3, 300, 15000, 3),
    ('6 Monthly Installments', '6 أقساط شهرية', 'Flexible 6-month payment plan', 'خطة دفع مرنة على 6 أشهر بدون فوائد', 6, 6, 500, 30000, 4);

-- Insert default settings
INSERT INTO public.financing_settings (key, value)
VALUES 
    ('general', '{"is_enabled": true, "require_contract": true, "require_promissory_note": true, "contract_terms_ar": "بموجب هذا العقد يلتزم الطرف الثاني (العميل) بسداد المبلغ المتفق عليه وفقاً لجدول الأقساط المحدد. يعتبر هذا العقد سنداً تنفيذياً وفقاً لنظام التنفيذ السعودي.", "late_payment_grace_days": 3}'),
    ('notifications', '{"notify_on_application": true, "notify_on_approval": true, "notify_before_due": true, "days_before_due_notification": 3}');

-- Create indexes for better performance
CREATE INDEX idx_financing_applications_user_id ON public.financing_applications(user_id);
CREATE INDEX idx_financing_applications_status ON public.financing_applications(status);
CREATE INDEX idx_financing_installments_application_id ON public.financing_installments(application_id);
CREATE INDEX idx_financing_installments_due_date ON public.financing_installments(due_date);
CREATE INDEX idx_financing_installments_status ON public.financing_installments(status);