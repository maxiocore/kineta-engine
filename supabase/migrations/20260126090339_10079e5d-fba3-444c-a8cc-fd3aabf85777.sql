-- ════════════════════════════════════════════════════════════════════════════════
-- جدول رموز التحقق لتوقيع العقود - Contract Signing OTPs Table
-- ════════════════════════════════════════════════════════════════════════════════

-- جدول تخزين رموز OTP لتوقيع العقود
CREATE TABLE IF NOT EXISTS public.contract_signing_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'locked')),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ,
  idempotency_key TEXT,
  reading_time_seconds INTEGER,
  scroll_percentage INTEGER,
  signature_ip INET,
  signature_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_contract_signing_otps_contract_id ON public.contract_signing_otps(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signing_otps_application_id ON public.contract_signing_otps(application_id);
CREATE INDEX IF NOT EXISTS idx_contract_signing_otps_status ON public.contract_signing_otps(status);
CREATE INDEX IF NOT EXISTS idx_contract_signing_otps_idempotency ON public.contract_signing_otps(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_signing_otps_expires_at ON public.contract_signing_otps(expires_at) WHERE status = 'pending';

-- تفعيل RLS
ALTER TABLE public.contract_signing_otps ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "Users can view their own signing OTPs"
  ON public.contract_signing_otps
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage signing OTPs"
  ON public.contract_signing_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إضافة عمود status جديد لـ financing_contract_documents إذا لم يكن موجوداً
DO $$
BEGIN
  -- إضافة حالة SIGNING_OTP_SENT للـ contract_document_status enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SIGNING_OTP_SENT' 
    AND enumtypid = 'public.contract_document_status'::regtype
  ) THEN
    ALTER TYPE public.contract_document_status ADD VALUE IF NOT EXISTS 'SIGNING_OTP_SENT' AFTER 'VIEWED';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- الـ enum غير موجود
END $$;

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contract_signing_otps;

-- تعليق توضيحي
COMMENT ON TABLE public.contract_signing_otps IS 'جدول تخزين رموز OTP للتحقق الثنائي عند توقيع العقود';