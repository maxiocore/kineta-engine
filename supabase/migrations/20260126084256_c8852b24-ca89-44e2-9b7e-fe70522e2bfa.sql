-- =============================================
-- نظام تمويل الخدمات المحدث - MaxioCore
-- Complete Financing Workflow Schema
-- =============================================

-- 1. Enum للحالات الرئيسية للطلب
DO $$ BEGIN
  CREATE TYPE public.financing_application_status AS ENUM (
    'DRAFT',                    -- مسودة
    'REQUEST_SUBMITTED',        -- طلب مقدم (بدون تفاصيل نهائية)
    'UNDER_REVIEW',             -- قيد المراجعة
    'INFO_REQUIRED',            -- مطلوب معلومات إضافية
    'ADMIN_SETUP',              -- الأدمن يضبط التفاصيل
    'OFFER_READY',              -- العرض جاهز
    'CONTRACT_PHASE',           -- مرحلة العقد
    'ACK_PHASE',                -- مرحلة الإقرار
    'BOND_PHASE',               -- مرحلة سند الأمر
    'CREDIT_PENDING',           -- قيد إضافة الرصيد
    'CREDIT_ACTIVE',            -- رصيد الخدمات نشط
    'IN_USE',                   -- جاري الاستخدام
    'COMPLETED',                -- مكتمل
    'DECLINED',                 -- مرفوض
    'CANCELLED',                -- ملغي
    'EXPIRED'                   -- منتهي الصلاحية
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Enum لحالات العقد
DO $$ BEGIN
  CREATE TYPE public.contract_document_status AS ENUM (
    'NOT_SENT',       -- لم يُرسل بعد
    'SENT',           -- تم الإرسال
    'VIEWED',         -- تم الاطلاع
    'SIGNED',         -- تم التوقيع
    'FINALIZED',      -- معتمد
    'EXPIRED',        -- منتهي
    'REJECTED'        -- مرفوض
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Enum لحالات الإقرار
DO $$ BEGIN
  CREATE TYPE public.acknowledgment_status AS ENUM (
    'NOT_SENT',       -- لم يُرسل بعد
    'SENT',           -- تم الإرسال
    'VIEWED',         -- تم الاطلاع
    'SIGNED'          -- تم التوقيع
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Enum لحالات سند الأمر
DO $$ BEGIN
  CREATE TYPE public.executive_bond_status AS ENUM (
    'NOT_ISSUED',     -- لم يصدر بعد
    'ISSUING',        -- جاري الإصدار (نافذ)
    'ISSUED',         -- تم الإصدار
    'SENT',           -- تم إرسال الإشعار
    'SIGNED'          -- موقّع من العميل
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. جدول ضبط العرض الإداري (Admin Offer Setup)
CREATE TABLE IF NOT EXISTS public.financing_offer_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  
  -- البيانات التي يضبطها الأدمن
  approved_amount NUMERIC(12,2) NOT NULL,
  installments_count INTEGER NOT NULL DEFAULT 3,
  installment_amount NUMERIC(12,2),
  first_installment_date DATE,
  
  -- الاسم الكامل كما في الهوية (يُدخل إدارياً)
  full_name_from_id TEXT NOT NULL,
  national_id_verified BOOLEAN DEFAULT FALSE,
  
  -- ملاحظات إدارية
  admin_notes TEXT,
  
  -- التتبع
  setup_by UUID REFERENCES auth.users(id),
  setup_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_id)
);

-- 6. جدول العقود (Contracts)
CREATE TABLE IF NOT EXISTS public.financing_contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  
  -- حالة العقد
  status public.contract_document_status DEFAULT 'NOT_SENT',
  
  -- بيانات العقد
  contract_number TEXT NOT NULL,
  pdf_url TEXT,
  pdf_hash TEXT,
  
  -- تتبع الإجراءات
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ,
  viewed_count INTEGER DEFAULT 0,
  
  -- بيانات التوقيع
  signed_at TIMESTAMPTZ,
  signature_ip INET,
  signature_user_agent TEXT,
  signature_device_info JSONB,
  reading_time_seconds INTEGER,
  scroll_percentage INTEGER,
  acceptance_checkbox BOOLEAN DEFAULT FALSE,
  
  -- الاعتماد
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES auth.users(id),
  
  -- الانتهاء/الرفض
  expired_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_id),
  UNIQUE(contract_number)
);

-- 7. جدول الإقرارات (Acknowledgments)
CREATE TABLE IF NOT EXISTS public.financing_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  
  -- حالة الإقرار
  status public.acknowledgment_status DEFAULT 'NOT_SENT',
  
  -- بيانات الإقرار
  acknowledgment_number TEXT NOT NULL,
  pdf_url TEXT,
  pdf_hash TEXT,
  acknowledgment_type TEXT DEFAULT 'terms_conditions', -- نوع الإقرار
  
  -- تتبع الإجراءات
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ,
  viewed_count INTEGER DEFAULT 0,
  
  -- بيانات التوقيع
  signed_at TIMESTAMPTZ,
  signature_ip INET,
  signature_user_agent TEXT,
  signature_device_info JSONB,
  reading_time_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_id, acknowledgment_type),
  UNIQUE(acknowledgment_number)
);

-- 8. جدول سند الأمر (Executive Bond)
CREATE TABLE IF NOT EXISTS public.financing_executive_bonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  
  -- حالة السند
  status public.executive_bond_status DEFAULT 'NOT_ISSUED',
  
  -- بيانات السند
  bond_number TEXT,
  nafith_reference TEXT,           -- مرجع نافذ
  bond_amount NUMERIC(12,2),
  
  -- تتبع الإجراءات
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id),
  sent_notification_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  
  -- تأكيد التوقيع
  signed_at TIMESTAMPTZ,
  signed_confirmed_by_customer BOOLEAN DEFAULT FALSE,
  customer_confirmation_ip INET,
  customer_confirmation_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_id),
  UNIQUE(bond_number)
);

-- 9. جدول سجل التدقيق المتقدم (Advanced Audit Log)
CREATE TABLE IF NOT EXISTS public.financing_workflow_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المرجع
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'application', 'contract', 'acknowledgment', 'bond', 'offer_setup'
  entity_id UUID,
  
  -- تفاصيل الحدث
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  
  -- من قام بالإجراء
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL, -- 'customer', 'admin', 'system'
  actor_email TEXT,
  
  -- البيانات
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  
  -- معلومات الجلسة
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- التوقيت
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- يظهر للعميل؟
  is_customer_visible BOOLEAN DEFAULT TRUE
);

-- 10. إضافة أعمدة جديدة لجدول الطلبات الموجود
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'application',
ADD COLUMN IF NOT EXISTS phase_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 11. Enable RLS
ALTER TABLE public.financing_offer_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_executive_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_workflow_audit ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for financing_offer_setup (Admin only)
CREATE POLICY "Admins can manage offer setup"
ON public.financing_offer_setup
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. RLS Policies for financing_contract_documents
CREATE POLICY "Users can view their contracts"
ON public.financing_contract_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.financing_applications fa
    WHERE fa.id = application_id AND fa.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage contracts"
ON public.financing_contract_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for financing_acknowledgments
CREATE POLICY "Users can view their acknowledgments"
ON public.financing_acknowledgments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.financing_applications fa
    WHERE fa.id = application_id AND fa.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage acknowledgments"
ON public.financing_acknowledgments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for financing_executive_bonds
CREATE POLICY "Users can view their bonds"
ON public.financing_executive_bonds
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.financing_applications fa
    WHERE fa.id = application_id AND fa.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage bonds"
ON public.financing_executive_bonds
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. RLS Policies for financing_workflow_audit
CREATE POLICY "Users can view visible audit logs"
ON public.financing_workflow_audit
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.financing_applications fa
      WHERE fa.id = application_id AND fa.user_id = auth.uid()
    )
    AND is_customer_visible = TRUE
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert audit logs"
ON public.financing_workflow_audit
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR actor_role = 'customer');

-- 17. Function to log workflow changes
CREATE OR REPLACE FUNCTION public.log_financing_workflow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type TEXT;
  v_application_id UUID;
BEGIN
  -- Determine entity type from table name
  v_entity_type := TG_TABLE_NAME;
  
  -- Get application_id
  IF TG_OP = 'DELETE' THEN
    v_application_id := OLD.application_id;
  ELSE
    v_application_id := NEW.application_id;
  END IF;
  
  -- Insert audit log
  INSERT INTO public.financing_workflow_audit (
    application_id,
    entity_type,
    entity_id,
    event_type,
    from_status,
    to_status,
    actor_id,
    actor_role,
    old_data,
    new_data
  ) VALUES (
    v_application_id,
    v_entity_type,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.status::TEXT ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status::TEXT ELSE NULL END,
    auth.uid(),
    CASE WHEN public.has_role(auth.uid(), 'admin') THEN 'admin' ELSE 'customer' END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 18. Triggers for auto audit logging
DROP TRIGGER IF EXISTS trg_audit_contract_documents ON public.financing_contract_documents;
CREATE TRIGGER trg_audit_contract_documents
AFTER INSERT OR UPDATE OR DELETE ON public.financing_contract_documents
FOR EACH ROW EXECUTE FUNCTION public.log_financing_workflow_change();

DROP TRIGGER IF EXISTS trg_audit_acknowledgments ON public.financing_acknowledgments;
CREATE TRIGGER trg_audit_acknowledgments
AFTER INSERT OR UPDATE OR DELETE ON public.financing_acknowledgments
FOR EACH ROW EXECUTE FUNCTION public.log_financing_workflow_change();

DROP TRIGGER IF EXISTS trg_audit_executive_bonds ON public.financing_executive_bonds;
CREATE TRIGGER trg_audit_executive_bonds
AFTER INSERT OR UPDATE OR DELETE ON public.financing_executive_bonds
FOR EACH ROW EXECUTE FUNCTION public.log_financing_workflow_change();

-- 19. Index for performance
CREATE INDEX IF NOT EXISTS idx_financing_offer_setup_application ON public.financing_offer_setup(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_contract_docs_application ON public.financing_contract_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_ack_application ON public.financing_acknowledgments(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_bonds_application ON public.financing_executive_bonds(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_audit_application ON public.financing_workflow_audit(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_audit_created ON public.financing_workflow_audit(created_at DESC);

-- 20. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_contract_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_acknowledgments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_executive_bonds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_workflow_audit;