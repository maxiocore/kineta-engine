-- جدول سجل نشاط طلبات التمويل (Activity Log)
CREATE TABLE IF NOT EXISTS public.financing_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('customer', 'system', 'reviewer', 'admin')),
  actor_id UUID,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  is_visible_to_customer BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_financing_activity_application 
  ON public.financing_activity_log(application_id, created_at DESC);

CREATE INDEX idx_financing_activity_event_type 
  ON public.financing_activity_log(event_type);

-- تفعيل RLS
ALTER TABLE public.financing_activity_log ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين: قراءة الأحداث المرئية لطلباتهم فقط
CREATE POLICY "Users can view visible activity for their applications"
  ON public.financing_activity_log
  FOR SELECT
  USING (
    is_visible_to_customer = true
    AND EXISTS (
      SELECT 1 FROM public.financing_applications fa
      WHERE fa.id = financing_activity_log.application_id
        AND fa.user_id = auth.uid()
    )
  );

-- سياسة للأدمن: قراءة جميع الأحداث
CREATE POLICY "Admins can view all activity logs"
  ON public.financing_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- سياسة إدخال: فقط النظام (عبر Edge Functions بـ service role)
CREATE POLICY "System can insert activity logs"
  ON public.financing_activity_log
  FOR INSERT
  WITH CHECK (true);

-- إضافة عمود email_template_id للربط مع القوالب
ALTER TABLE public.financing_email_queue 
  ADD COLUMN IF NOT EXISTS email_template_id TEXT,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.financing_activity_log(id);

-- فهرس للربط
CREATE INDEX IF NOT EXISTS idx_email_queue_event 
  ON public.financing_email_queue(event_id);

-- إضافة حقل email_bounced للمستخدمين
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_bounce_reason TEXT;

-- فهرس للبريد المرتد
CREATE INDEX IF NOT EXISTS idx_profiles_email_bounced 
  ON public.profiles(email_bounced) WHERE email_bounced = true;

-- تفعيل Realtime للـ Activity Log
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_activity_log;