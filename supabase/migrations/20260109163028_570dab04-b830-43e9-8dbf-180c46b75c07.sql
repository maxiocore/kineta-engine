-- ═══════════════════════════════════════════════════════════
-- جدول حالات العقود
-- Contract Status Enumeration
-- ═══════════════════════════════════════════════════════════

-- إنشاء Enum لحالات العقد
CREATE TYPE public.contract_status AS ENUM ('draft', 'presented', 'accepted', 'finalized');

-- ═══════════════════════════════════════════════════════════
-- جدول العقود
-- Financing Contracts Table
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.financing_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- معلومات الربط
    application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- رقم العقد والإصدار
    contract_number TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    parent_contract_id UUID REFERENCES public.financing_contracts(id),
    
    -- حالة العقد
    status public.contract_status NOT NULL DEFAULT 'draft',
    
    -- بيانات العقد
    contract_data JSONB NOT NULL DEFAULT '{}',
    
    -- PDF والتوقيع
    pdf_url TEXT,
    pdf_hash TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- سجل المشاهدة
    viewed_at TIMESTAMP WITH TIME ZONE,
    viewed_count INTEGER NOT NULL DEFAULT 0,
    
    -- سجل القبول
    accepted_at TIMESTAMP WITH TIME ZONE,
    acceptance_checkbox BOOLEAN NOT NULL DEFAULT false,
    acceptance_button_clicked BOOLEAN NOT NULL DEFAULT false,
    
    -- معلومات الجهاز عند القبول
    acceptance_ip_address INET,
    acceptance_user_agent TEXT,
    acceptance_device_info JSONB,
    
    -- الاعتماد النهائي
    finalized_at TIMESTAMP WITH TIME ZONE,
    finalized_by UUID,
    
    -- إلغاء/رفض
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- جدول سجل أحداث العقد (Audit Trail)
-- Contract Events Log
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.financing_contract_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.financing_contracts(id) ON DELETE CASCADE,
    
    -- نوع الحدث
    event_type TEXT NOT NULL,
    -- 'created', 'viewed', 'presented', 'accepted', 'finalized', 'new_version_created', 'cancelled'
    
    -- الحالة قبل وبعد
    old_status public.contract_status,
    new_status public.contract_status,
    
    -- بيانات إضافية
    metadata JSONB,
    
    -- معلومات المستخدم
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- التاريخ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- الفهارس
-- Indexes
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_financing_contracts_application_id ON public.financing_contracts(application_id);
CREATE INDEX idx_financing_contracts_user_id ON public.financing_contracts(user_id);
CREATE INDEX idx_financing_contracts_status ON public.financing_contracts(status);
CREATE INDEX idx_financing_contracts_contract_number ON public.financing_contracts(contract_number);
CREATE INDEX idx_financing_contract_events_contract_id ON public.financing_contract_events(contract_id);
CREATE INDEX idx_financing_contract_events_event_type ON public.financing_contract_events(event_type);

-- ═══════════════════════════════════════════════════════════
-- تسلسل رقم العقد
-- Contract Number Sequence
-- ═══════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS public.financing_contract_number_seq START 1;

-- ═══════════════════════════════════════════════════════════
-- دالة توليد رقم العقد
-- Generate Contract Number Function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
        NEW.contract_number := 'CNT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('financing_contract_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_contract_number
    BEFORE INSERT ON public.financing_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_contract_number();

-- ═══════════════════════════════════════════════════════════
-- دالة التحقق من انتقال الحالة
-- Status Transition Validation Function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validate_contract_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- التحقق من انتقالات الحالة المسموحة
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- لا يمكن التغيير بعد finalized
        IF OLD.status = 'finalized' THEN
            RAISE EXCEPTION 'لا يمكن تعديل عقد تم اعتماده نهائياً. يجب إنشاء نسخة جديدة.';
        END IF;
        
        -- التحقق من الانتقالات المسموحة
        CASE OLD.status
            WHEN 'draft' THEN
                IF NEW.status NOT IN ('presented', 'draft') THEN
                    RAISE EXCEPTION 'انتقال غير مسموح: من draft يجب أن يكون إلى presented';
                END IF;
            WHEN 'presented' THEN
                IF NEW.status NOT IN ('accepted', 'draft', 'presented') THEN
                    RAISE EXCEPTION 'انتقال غير مسموح: من presented يجب أن يكون إلى accepted أو draft';
                END IF;
            WHEN 'accepted' THEN
                IF NEW.status NOT IN ('finalized', 'draft', 'accepted') THEN
                    RAISE EXCEPTION 'انتقال غير مسموح: من accepted يجب أن يكون إلى finalized أو draft';
                END IF;
            ELSE
                NULL;
        END CASE;
        
        -- متطلبات finalized
        IF NEW.status = 'finalized' THEN
            -- يجب أن يكون العقد قد شوهد
            IF NEW.viewed_at IS NULL THEN
                RAISE EXCEPTION 'لا يمكن اعتماد العقد: لم تتم مشاهدته بعد';
            END IF;
            
            -- يجب الموافقة على الشروط
            IF NEW.acceptance_checkbox = false THEN
                RAISE EXCEPTION 'لا يمكن اعتماد العقد: لم يتم قبول الشروط';
            END IF;
            
            IF NEW.acceptance_button_clicked = false THEN
                RAISE EXCEPTION 'لا يمكن اعتماد العقد: لم يتم الضغط على زر الموافقة';
            END IF;
            
            -- يجب توليد PDF
            IF NEW.pdf_hash IS NULL THEN
                RAISE EXCEPTION 'لا يمكن اعتماد العقد: لم يتم توليد نسخة PDF';
            END IF;
            
            -- تعيين تاريخ الاعتماد
            NEW.finalized_at := now();
        END IF;
    END IF;
    
    -- منع تعديل البيانات بعد finalized
    IF OLD.status = 'finalized' AND (
        OLD.contract_data IS DISTINCT FROM NEW.contract_data OR
        OLD.pdf_hash IS DISTINCT FROM NEW.pdf_hash
    ) THEN
        RAISE EXCEPTION 'لا يمكن تعديل بيانات عقد تم اعتماده نهائياً';
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_contract_status
    BEFORE UPDATE ON public.financing_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_contract_status_transition();

-- ═══════════════════════════════════════════════════════════
-- دالة تسجيل أحداث العقد تلقائياً
-- Auto-log Contract Events Function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_contract_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_type_val TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.financing_contract_events (
            contract_id, event_type, new_status, user_id, metadata
        ) VALUES (
            NEW.id, 'created', NEW.status, NEW.user_id,
            jsonb_build_object('contract_number', NEW.contract_number, 'version', NEW.version)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- تحديد نوع الحدث
        CASE NEW.status
            WHEN 'presented' THEN event_type_val := 'presented';
            WHEN 'accepted' THEN event_type_val := 'accepted';
            WHEN 'finalized' THEN event_type_val := 'finalized';
            ELSE event_type_val := 'status_changed';
        END CASE;
        
        INSERT INTO public.financing_contract_events (
            contract_id, event_type, old_status, new_status, user_id,
            ip_address, user_agent, device_info,
            metadata
        ) VALUES (
            NEW.id, event_type_val, OLD.status, NEW.status, NEW.user_id,
            NEW.acceptance_ip_address, NEW.acceptance_user_agent, NEW.acceptance_device_info,
            jsonb_build_object(
                'pdf_hash', NEW.pdf_hash,
                'viewed_count', NEW.viewed_count,
                'finalized_at', NEW.finalized_at
            )
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.viewed_count < NEW.viewed_count THEN
        INSERT INTO public.financing_contract_events (
            contract_id, event_type, user_id, metadata
        ) VALUES (
            NEW.id, 'viewed', NEW.user_id,
            jsonb_build_object('view_count', NEW.viewed_count)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_contract_event
    AFTER INSERT OR UPDATE ON public.financing_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_contract_event();

-- ═══════════════════════════════════════════════════════════
-- دالة إنشاء نسخة جديدة من العقد
-- Create New Contract Version Function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_contract_new_version(
    p_original_contract_id UUID,
    p_new_contract_data JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT 'تعديل بناءً على طلب العميل'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    original_contract RECORD;
    new_contract_id UUID;
BEGIN
    -- جلب العقد الأصلي
    SELECT * INTO original_contract
    FROM public.financing_contracts
    WHERE id = p_original_contract_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'العقد غير موجود: %', p_original_contract_id;
    END IF;
    
    -- إنشاء نسخة جديدة
    INSERT INTO public.financing_contracts (
        application_id,
        user_id,
        version,
        parent_contract_id,
        contract_data,
        status
    ) VALUES (
        original_contract.application_id,
        original_contract.user_id,
        original_contract.version + 1,
        p_original_contract_id,
        COALESCE(p_new_contract_data, original_contract.contract_data),
        'draft'
    )
    RETURNING id INTO new_contract_id;
    
    -- تسجيل الحدث
    INSERT INTO public.financing_contract_events (
        contract_id, event_type, user_id, metadata
    ) VALUES (
        new_contract_id, 'new_version_created', original_contract.user_id,
        jsonb_build_object(
            'parent_contract_id', p_original_contract_id,
            'parent_version', original_contract.version,
            'reason', p_reason
        )
    );
    
    RETURN new_contract_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contract_events ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى عقوده فقط
CREATE POLICY "Users can view own contracts"
    ON public.financing_contracts
    FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه تحديث عقوده غير المعتمدة
CREATE POLICY "Users can update own non-finalized contracts"
    ON public.financing_contracts
    FOR UPDATE
    USING (auth.uid() = user_id AND status != 'finalized');

-- إنشاء عقود جديدة
CREATE POLICY "Users can create contracts for their applications"
    ON public.financing_contracts
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.financing_applications
            WHERE id = application_id AND user_id = auth.uid()
        )
    );

-- المستخدم يرى أحداث عقوده
CREATE POLICY "Users can view own contract events"
    ON public.financing_contract_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.financing_contracts
            WHERE id = contract_id AND user_id = auth.uid()
        )
    );

-- Admin policies
CREATE POLICY "Admins can view all contracts"
    ON public.financing_contracts
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all contracts"
    ON public.financing_contracts
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all contract events"
    ON public.financing_contract_events
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_contract_events;