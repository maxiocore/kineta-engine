-- ═══════════════════════════════════════════════════════════════════════════════
-- إصلاح نظام إيداع رصيد التمويل - Financing Credit Deposit Reliability Fix
-- Migration الكامل المدمج
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. جدول منع التكرار مع مفتاح فريد (Idempotency Keys)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.financing_deposit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مفتاح الإيداع الفريد (application_id + contract_version)
  deposit_key TEXT NOT NULL UNIQUE,
  application_id UUID NOT NULL REFERENCES financing_applications(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES financing_contracts(id),
  contract_version INTEGER NOT NULL DEFAULT 1,
  
  -- بيانات الإيداع
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'PROCESSING', 'DEPOSITED', 'FAILED', 'RETRY_SCHEDULED'
  )),
  
  -- تفاصيل التنفيذ
  credit_id UUID,
  transaction_id UUID,
  ledger_entry_id UUID,
  
  -- معلومات الفشل
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- التدقيق
  initiated_by UUID,
  initiated_by_role TEXT DEFAULT 'system' CHECK (initiated_by_role IN ('admin', 'system')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  
  -- Checksums للتحقق
  balance_before NUMERIC(12,2),
  balance_after NUMERIC(12,2),
  ledger_checksum TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_deposit_ledger_app ON financing_deposit_ledger(application_id);
CREATE INDEX IF NOT EXISTS idx_deposit_ledger_status ON financing_deposit_ledger(status);
CREATE INDEX IF NOT EXISTS idx_deposit_ledger_retry ON financing_deposit_ledger(status, next_retry_at) 
  WHERE status = 'RETRY_SCHEDULED';
CREATE INDEX IF NOT EXISTS idx_deposit_ledger_pending ON financing_deposit_ledger(status, created_at) 
  WHERE status IN ('PENDING', 'PROCESSING');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. إضافة حقول حالة الإيداع للتطبيق
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financing_applications' AND column_name = 'credit_deposit_status') 
  THEN
    ALTER TABLE public.financing_applications 
    ADD COLUMN credit_deposit_status TEXT DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financing_applications' AND column_name = 'deposit_ledger_id') 
  THEN
    ALTER TABLE public.financing_applications 
    ADD COLUMN deposit_ledger_id UUID REFERENCES financing_deposit_ledger(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financing_applications' AND column_name = 'last_deposit_attempt_at') 
  THEN
    ALTER TABLE public.financing_applications 
    ADD COLUMN last_deposit_attempt_at TIMESTAMPTZ;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.financing_deposit_ledger ENABLE ROW LEVEL SECURITY;

-- الأدمن يرى كل شيء (باستخدام user_roles)
CREATE POLICY "Admins can view all deposit ledger entries"
ON public.financing_deposit_ledger FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- المستخدم يرى سجلاته فقط
CREATE POLICY "Users can view own deposit ledger entries"
ON public.financing_deposit_ledger FOR SELECT
USING (user_id = auth.uid());

-- Service role يمكنه الإدراج والتحديث (للـ Edge Functions)
CREATE POLICY "Service role can insert deposit ledger"
ON public.financing_deposit_ledger FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update deposit ledger"
ON public.financing_deposit_ledger FOR UPDATE
USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Trigger لتحديث updated_at
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_financing_deposit_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_deposit_ledger_timestamp ON financing_deposit_ledger;
CREATE TRIGGER trigger_update_deposit_ledger_timestamp
  BEFORE UPDATE ON financing_deposit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_financing_deposit_ledger_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. دالة حساب الرصيد من Ledger (مصدر الحقيقة الوحيد)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.calculate_service_credit_balance(p_user_id UUID)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC(12,2);
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN transaction_type = 'credit' AND status = 'completed' THEN amount
        WHEN transaction_type = 'debit' AND status = 'completed' THEN -amount
        WHEN transaction_type = 'reversal' AND status = 'completed' THEN -amount
        ELSE 0
      END
    ), 0
  )
  INTO v_balance
  FROM service_credit_transactions
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. دالة الإيداع الذرية (Atomic Deposit Transaction)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.atomic_credit_deposit(
  p_application_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_contract RECORD;
  v_deposit_key TEXT;
  v_existing_deposit RECORD;
  v_existing_credit RECORD;
  v_credit_id UUID;
  v_transaction_id UUID;
  v_balance_before NUMERIC(12,2);
  v_balance_after NUMERIC(12,2);
  v_deposit_ledger_id UUID;
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_processing_ms INTEGER;
BEGIN
  -- STEP 1: جلب بيانات الطلب والعقد مع قفل
  SELECT 
    fa.id, fa.user_id, fa.application_number, fa.status, 
    fa.approved_amount, fa.full_name, fa.email, fa.phone,
    fa.credit_deposit_status, fa.deposit_ledger_id
  INTO v_app
  FROM financing_applications fa
  WHERE fa.id = p_application_id
  FOR UPDATE;

  IF v_app IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 'action', 'failed',
      'error_code', 'APP_NOT_FOUND', 'message_ar', 'الطلب غير موجود'
    );
  END IF;

  -- جلب أحدث عقد
  SELECT id, contract_number, version INTO v_contract
  FROM financing_contracts
  WHERE application_id = p_application_id AND status = 'finalized'
  ORDER BY version DESC LIMIT 1;

  -- STEP 2: إنشاء مفتاح الإيداع الفريد
  v_deposit_key := p_application_id::TEXT || ':v' || COALESCE(v_contract.version, 1)::TEXT;

  -- STEP 3: فحص Idempotency
  SELECT * INTO v_existing_deposit FROM financing_deposit_ledger WHERE deposit_key = v_deposit_key;

  IF v_existing_deposit IS NOT NULL THEN
    IF v_existing_deposit.status = 'DEPOSITED' THEN
      RETURN jsonb_build_object(
        'success', true, 'action', 'already_deposited',
        'deposit_ledger_id', v_existing_deposit.id,
        'credit_id', v_existing_deposit.credit_id,
        'transaction_id', v_existing_deposit.transaction_id,
        'message_ar', 'تم إيداع الرصيد مسبقاً'
      );
    ELSIF v_existing_deposit.status = 'PROCESSING' THEN
      RETURN jsonb_build_object(
        'success', false, 'action', 'processing',
        'error_code', 'DEPOSIT_IN_PROGRESS', 'message_ar', 'جاري معالجة الإيداع حالياً'
      );
    END IF;
    v_deposit_ledger_id := v_existing_deposit.id;
  END IF;

  -- STEP 4: التحقق من أهلية الإيداع
  IF v_app.status NOT IN (
    'FIN_CONTRACT_FINALIZED', 'CONTRACT_FINALIZED', 'CONTRACT_ACCEPTED',
    'APPROVED', 'APPROVED_WITH_LIMITS', 'awaiting_signature', 'contract_signed'
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 'action', 'ineligible',
      'error_code', 'INVALID_STATUS', 'current_status', v_app.status,
      'message_ar', 'حالة الطلب غير مؤهلة للإيداع'
    );
  END IF;

  IF v_app.approved_amount IS NULL OR v_app.approved_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false, 'action', 'failed',
      'error_code', 'INVALID_AMOUNT', 'message_ar', 'المبلغ المعتمد غير صالح'
    );
  END IF;

  -- STEP 5: إنشاء/تحديث سجل الإيداع (PROCESSING)
  IF v_deposit_ledger_id IS NULL THEN
    INSERT INTO financing_deposit_ledger (
      deposit_key, application_id, contract_id, contract_version,
      user_id, amount, status, initiated_by, initiated_by_role, processing_started_at
    ) VALUES (
      v_deposit_key, p_application_id, v_contract.id, COALESCE(v_contract.version, 1),
      v_app.user_id, v_app.approved_amount, 'PROCESSING', p_actor_id, p_actor_role, clock_timestamp()
    ) RETURNING id INTO v_deposit_ledger_id;
  ELSE
    UPDATE financing_deposit_ledger
    SET status = 'PROCESSING', processing_started_at = clock_timestamp(),
        retry_count = retry_count + 1, updated_at = now()
    WHERE id = v_deposit_ledger_id;
  END IF;

  -- ربط سجل الإيداع بالطلب
  UPDATE financing_applications
  SET deposit_ledger_id = v_deposit_ledger_id,
      credit_deposit_status = 'CREDIT_DEPOSIT_PENDING',
      last_deposit_attempt_at = now()
  WHERE id = p_application_id;

  -- STEP 6: حساب الرصيد الحالي من Ledger
  v_balance_before := calculate_service_credit_balance(v_app.user_id);
  v_balance_after := v_balance_before + v_app.approved_amount;

  -- STEP 7: إنشاء/تحديث سجل رصيد الخدمات
  SELECT * INTO v_existing_credit FROM service_credits
  WHERE user_id = v_app.user_id AND is_active = true LIMIT 1;

  IF v_existing_credit IS NOT NULL THEN
    UPDATE service_credits
    SET total_credited = total_credited + v_app.approved_amount, updated_at = now()
    WHERE id = v_existing_credit.id;
    v_credit_id := v_existing_credit.id;
  ELSE
    INSERT INTO service_credits (
      user_id, total_credited, total_used, application_id,
      source_type, source_reference_id, is_active, expires_at
    ) VALUES (
      v_app.user_id, v_app.approved_amount, 0, p_application_id,
      'financing', p_application_id, true, now() + INTERVAL '12 months'
    ) RETURNING id INTO v_credit_id;
  END IF;

  -- STEP 8: إنشاء قيد Ledger
  INSERT INTO service_credit_transactions (
    credit_id, user_id, transaction_type, amount,
    balance_before, balance_after, reference_type, reference_id,
    description, description_ar, status, metadata
  ) VALUES (
    v_credit_id, v_app.user_id, 'credit', v_app.approved_amount,
    v_balance_before, v_balance_after, 'financing', p_application_id,
    'Service financing credit - Application #' || v_app.application_number,
    'رصيد تمويل خدمات - طلب رقم ' || v_app.application_number, 'completed',
    jsonb_build_object(
      'event', 'WALLET_CREDITED', 'deposit_key', v_deposit_key,
      'deposit_ledger_id', v_deposit_ledger_id, 'atomic_transaction', true
    )
  ) RETURNING id INTO v_transaction_id;

  -- STEP 9: تحديث حالة الطلب
  UPDATE financing_applications
  SET status = 'FIN_CREDIT_DEPOSITED', credit_deposit_status = 'CREDIT_DEPOSITED', updated_at = now()
  WHERE id = p_application_id;

  -- STEP 10: تحديث سجل الإيداع (DEPOSITED)
  v_processing_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
  
  UPDATE financing_deposit_ledger
  SET status = 'DEPOSITED', credit_id = v_credit_id, transaction_id = v_transaction_id,
      ledger_entry_id = v_transaction_id, balance_before = v_balance_before,
      balance_after = v_balance_after, processing_completed_at = clock_timestamp(),
      processing_duration_ms = v_processing_ms,
      ledger_checksum = md5(v_deposit_key || v_app.approved_amount::TEXT || v_balance_after::TEXT),
      updated_at = now()
  WHERE id = v_deposit_ledger_id;

  -- STEP 11: تسجيل في Activity Log
  INSERT INTO financing_activity_log (
    application_id, event_type, from_status, to_status,
    triggered_by, actor_id, is_visible_to_customer, reason, metadata
  ) VALUES (
    p_application_id, 'status_change', v_app.status, 'FIN_CREDIT_DEPOSITED',
    p_actor_role, p_actor_id, true, 'تم إيداع رصيد الخدمات بنجاح',
    jsonb_build_object('credit_id', v_credit_id, 'transaction_id', v_transaction_id,
      'amount', v_app.approved_amount, 'atomic_transaction', true)
  );

  -- STEP 12: تسجيل في Audit Log
  INSERT INTO audit_logs (action, table_name, record_id, user_id, processing_time_ms, new_value, metadata)
  VALUES ('ATOMIC_CREDIT_DEPOSITED', 'financing_deposit_ledger', v_deposit_ledger_id, v_app.user_id,
    v_processing_ms, jsonb_build_object('event', 'WALLET_CREDITED', 'amount', v_app.approved_amount,
      'balance_after', v_balance_after), jsonb_build_object('triggered_by', p_actor_role, 'atomic', true));

  RETURN jsonb_build_object(
    'success', true, 'action', 'deposited',
    'deposit_ledger_id', v_deposit_ledger_id, 'credit_id', v_credit_id,
    'transaction_id', v_transaction_id, 'amount', v_app.approved_amount,
    'balance_before', v_balance_before, 'balance_after', v_balance_after,
    'processing_ms', v_processing_ms, 'deposit_key', v_deposit_key,
    'message_ar', 'تم إيداع رصيد الخدمات بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    IF v_deposit_ledger_id IS NOT NULL THEN
      UPDATE financing_deposit_ledger
      SET status = 'FAILED', failure_reason = SQLERRM, failure_code = SQLSTATE,
          next_retry_at = CASE WHEN retry_count < max_retries THEN now() + INTERVAL '5 minutes' ELSE NULL END,
          updated_at = now()
      WHERE id = v_deposit_ledger_id;
    END IF;

    UPDATE financing_applications
    SET credit_deposit_status = 'CREDIT_DEPOSIT_FAILED', last_deposit_attempt_at = now()
    WHERE id = p_application_id;

    INSERT INTO audit_logs (action, table_name, record_id, metadata)
    VALUES ('ATOMIC_CREDIT_DEPOSIT_FAILED', 'financing_deposit_ledger', v_deposit_ledger_id,
      jsonb_build_object('error', SQLERRM, 'state', SQLSTATE, 'application_id', p_application_id));

    RETURN jsonb_build_object('success', false, 'action', 'failed',
      'error_code', SQLSTATE, 'error', SQLERRM, 'message_ar', 'فشل إيداع الرصيد: ' || SQLERRM);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. دالة التدقيق والمصالحة (Reconciliation)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.reconcile_credit_deposits()
RETURNS TABLE (
  application_id UUID, application_number TEXT, expected_amount NUMERIC,
  ledger_balance NUMERIC, deposit_status TEXT, discrepancy_type TEXT, recommended_action TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH expected_deposits AS (
    SELECT fa.id AS app_id, fa.application_number AS app_no, fa.user_id,
           fa.approved_amount AS expected, fa.status, fa.credit_deposit_status
    FROM financing_applications fa
    WHERE fa.status IN ('FIN_CREDIT_DEPOSITED', 'CREDIT_DEPOSITED', 'FIN_CONTRACT_FINALIZED', 
                        'CONTRACT_FINALIZED', 'APPROVED', 'APPROVED_WITH_LIMITS')
      AND fa.approved_amount > 0
  ),
  actual_deposits AS (
    SELECT sct.reference_id AS app_id,
           SUM(CASE WHEN sct.transaction_type = 'credit' THEN sct.amount ELSE 0 END) AS credited,
           SUM(CASE WHEN sct.transaction_type = 'debit' THEN sct.amount ELSE 0 END) AS debited
    FROM service_credit_transactions sct
    WHERE sct.reference_type = 'financing' AND sct.status = 'completed'
    GROUP BY sct.reference_id
  ),
  deposit_ledger_status AS (
    SELECT fdl.application_id AS app_id, fdl.status AS ledger_status
    FROM financing_deposit_ledger fdl
  )
  SELECT ed.app_id, ed.app_no, ed.expected,
         COALESCE(ad.credited, 0) - COALESCE(ad.debited, 0),
         COALESCE(dls.ledger_status, 'NOT_FOUND'),
         CASE
           WHEN ad.credited IS NULL THEN 'MISSING_DEPOSIT'
           WHEN ed.expected != COALESCE(ad.credited, 0) THEN 'AMOUNT_MISMATCH'
           WHEN ed.credit_deposit_status != 'CREDIT_DEPOSITED' AND ad.credited IS NOT NULL THEN 'STATUS_MISMATCH'
           ELSE 'OK'
         END,
         CASE
           WHEN ad.credited IS NULL AND dls.ledger_status IS NULL THEN 'RETRY_DEPOSIT'
           WHEN ad.credited IS NULL AND dls.ledger_status = 'FAILED' THEN 'MANUAL_REVIEW'
           WHEN ed.expected != COALESCE(ad.credited, 0) THEN 'INVESTIGATE'
           ELSE 'NONE'
         END
  FROM expected_deposits ed
  LEFT JOIN actual_deposits ad ON ed.app_id = ad.app_id
  LEFT JOIN deposit_ledger_status dls ON ed.app_id = dls.app_id
  WHERE ad.credited IS NULL OR ed.expected != COALESCE(ad.credited, 0)
        OR ed.credit_deposit_status != 'CREDIT_DEPOSITED';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. دالة إعادة المحاولة التلقائية
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.retry_failed_deposits()
RETURNS TABLE (application_id UUID, result JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_deposit RECORD; v_result JSONB;
BEGIN
  FOR v_deposit IN 
    SELECT fdl.application_id FROM financing_deposit_ledger fdl
    WHERE fdl.status IN ('FAILED', 'RETRY_SCHEDULED')
      AND fdl.retry_count < fdl.max_retries
      AND (fdl.next_retry_at IS NULL OR fdl.next_retry_at <= now())
    ORDER BY fdl.created_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED
  LOOP
    v_result := atomic_credit_deposit(v_deposit.application_id, NULL, 'system');
    application_id := v_deposit.application_id;
    result := v_result;
    RETURN NEXT;
  END LOOP;
END;
$$;