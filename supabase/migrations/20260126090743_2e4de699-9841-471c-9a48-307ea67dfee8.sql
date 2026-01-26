-- ============================================
-- تحديث نظام سند الأمر المستقل
-- Independent Executive Bond Workflow System
-- ============================================

-- 1. تحديث ENUM لحالات سند الأمر مع الحالات الجديدة
DO $$ BEGIN
  -- إضافة الحالات الجديدة إذا لم تكن موجودة
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SENT_TO_CLIENT' AND enumtypid = 'public.executive_bond_status'::regtype) THEN
    ALTER TYPE public.executive_bond_status ADD VALUE IF NOT EXISTS 'SENT_TO_CLIENT' AFTER 'ISSUED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SIGNED_BY_CLIENT' AND enumtypid = 'public.executive_bond_status'::regtype) THEN
    ALTER TYPE public.executive_bond_status ADD VALUE IF NOT EXISTS 'SIGNED_BY_CLIENT' AFTER 'SENT_TO_CLIENT';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VERIFIED_BY_ADMIN' AND enumtypid = 'public.executive_bond_status'::regtype) THEN
    ALTER TYPE public.executive_bond_status ADD VALUE IF NOT EXISTS 'VERIFIED_BY_ADMIN' AFTER 'SIGNED_BY_CLIENT';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. إضافة أعمدة جديدة لجدول financing_executive_bonds
ALTER TABLE public.financing_executive_bonds
  ADD COLUMN IF NOT EXISTS sent_to_client_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_to_client_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS signed_by_client_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by_client_ip INET,
  ADD COLUMN IF NOT EXISTS signed_by_client_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS verified_by_admin_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS admin_verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_notification_status TEXT DEFAULT 'pending';

-- 3. إنشاء جدول سجل أحداث السند
CREATE TABLE IF NOT EXISTS public.executive_bond_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id UUID NOT NULL REFERENCES public.financing_executive_bonds(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL DEFAULT 'system',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. فهارس لسجل الأحداث
CREATE INDEX IF NOT EXISTS idx_bond_events_bond_id ON public.executive_bond_events(bond_id);
CREATE INDEX IF NOT EXISTS idx_bond_events_application_id ON public.executive_bond_events(application_id);
CREATE INDEX IF NOT EXISTS idx_bond_events_event_type ON public.executive_bond_events(event_type);
CREATE INDEX IF NOT EXISTS idx_bond_events_created_at ON public.executive_bond_events(created_at);

-- 5. تمكين RLS على جدول الأحداث
ALTER TABLE public.executive_bond_events ENABLE ROW LEVEL SECURITY;

-- 6. سياسات RLS لجدول أحداث السند
CREATE POLICY "Users can view their bond events"
ON public.executive_bond_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.financing_applications fa
    WHERE fa.id = application_id AND fa.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System and admins can insert bond events"
ON public.executive_bond_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR actor_role = 'customer'
);

-- 7. تمكين Realtime لجدول الأحداث
ALTER PUBLICATION supabase_realtime ADD TABLE public.executive_bond_events;

-- 8. تحديث financing_applications لإضافة executive_bond_id
ALTER TABLE public.financing_applications
  ADD COLUMN IF NOT EXISTS executive_bond_id UUID REFERENCES public.financing_executive_bonds(id);

-- 9. إنشاء فهرس للعلاقة
CREATE INDEX IF NOT EXISTS idx_applications_executive_bond ON public.financing_applications(executive_bond_id);

-- 10. تحديث دالة إنشاء السند التلقائي (إن وجدت)
CREATE OR REPLACE FUNCTION public.create_executive_bond_for_application()
RETURNS TRIGGER AS $$
DECLARE
  new_bond_id UUID;
  bond_number TEXT;
BEGIN
  -- فقط إذا كانت الحالة CONTRACT_FINALIZED أو BOND_PHASE
  IF NEW.workflow_status IN ('CONTRACT_FINALIZED', 'ACK_SIGNED', 'BOND_PHASE') 
     AND OLD.workflow_status IS DISTINCT FROM NEW.workflow_status
     AND NOT EXISTS (SELECT 1 FROM public.financing_executive_bonds WHERE application_id = NEW.id) THEN
    
    -- إنشاء رقم السند
    bond_number := 'BOND-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- إنشاء سجل السند
    INSERT INTO public.financing_executive_bonds (
      application_id,
      bond_number,
      bond_amount,
      status,
      created_at
    ) VALUES (
      NEW.id,
      bond_number,
      NEW.approved_amount,
      'NOT_ISSUED'::public.executive_bond_status,
      NOW()
    )
    RETURNING id INTO new_bond_id;
    
    -- ربط السند بالطلب
    NEW.executive_bond_id := new_bond_id;
    
    -- تسجيل الحدث
    INSERT INTO public.executive_bond_events (
      bond_id,
      application_id,
      event_type,
      to_status,
      actor_role,
      metadata
    ) VALUES (
      new_bond_id,
      NEW.id,
      'BOND_CREATED',
      'NOT_ISSUED',
      'system',
      jsonb_build_object('bond_number', bond_number, 'amount', NEW.approved_amount)
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. إنشاء أو تحديث الـ trigger
DROP TRIGGER IF EXISTS trg_create_executive_bond ON public.financing_applications;
CREATE TRIGGER trg_create_executive_bond
  BEFORE UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.create_executive_bond_for_application();