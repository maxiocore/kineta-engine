
CREATE OR REPLACE FUNCTION atomic_credit_deposit(
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
    fa.approved_amount, fa.requested_amount, fa.full_name, fa.email, fa.phone,
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

  -- STEP 4: التحقق من أهلية الإيداع (تشمل حالات السند والعقد)
  IF v_app.status NOT IN (
    'FIN_CONTRACT_FINALIZED', 'CONTRACT_FINALIZED', 'CONTRACT_ACCEPTED',
    'APPROVED', 'APPROVED_WITH_LIMITS', 'awaiting_signature', 'contract_signed',
    'BOND_SIGNED', 'BOND_SIGNED_BY_CLIENT', 'BOND_VERIFIED_BY_ADMIN',
    'BOND_ISSUING', 'BOND_ISSUED', 'BOND_SENT_TO_CLIENT'
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 'action', 'ineligible',
      'error_code', 'INVALID_STATUS', 'current_status', v_app.status,
      'message_ar', 'حالة الطلب غير مؤهلة للإيداع: ' || v_app.status
    );
  END IF;

  -- Use approved_amount, fallback to requested_amount
  IF v_app.approved_amount IS NULL OR v_app.approved_amount <= 0 THEN
    IF v_app.requested_amount IS NOT NULL AND v_app.requested_amount > 0 THEN
      v_app.approved_amount := v_app.requested_amount;
      -- Also update the application record
      UPDATE financing_applications SET approved_amount = v_app.requested_amount WHERE id = p_application_id;
    ELSE
      RETURN jsonb_build_object(
        'success', false, 'action', 'failed',
        'error_code', 'INVALID_AMOUNT', 'message_ar', 'المبلغ المعتمد غير صالح'
      );
    END IF;
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
    SET total_credited = total_credited + v_app.approved_amount,
        available_balance = available_balance + v_app.approved_amount,
        updated_at = now()
    WHERE id = v_existing_credit.id
    RETURNING id INTO v_credit_id;
  ELSE
    INSERT INTO service_credits (
      user_id, total_credited, total_used, available_balance,
      source_type, source_reference_id, application_id,
      is_active, is_frozen
    ) VALUES (
      v_app.user_id, v_app.approved_amount, 0, v_app.approved_amount,
      'FINANCING', p_application_id, p_application_id,
      true, false
    ) RETURNING id INTO v_credit_id;
  END IF;

  -- STEP 8: إنشاء سجل الحركة
  INSERT INTO service_credit_transactions (
    user_id, credit_id, transaction_type, amount,
    balance_before, balance_after,
    reference_type, reference_id,
    description, description_ar,
    metadata
  ) VALUES (
    v_app.user_id, v_credit_id, 'CREDIT', v_app.approved_amount,
    v_balance_before, v_balance_after,
    'FINANCING_APPLICATION', p_application_id,
    'Service credit from financing application ' || v_app.application_number,
    'رصيد خدمات من طلب التمويل ' || v_app.application_number,
    jsonb_build_object(
      'application_id', p_application_id,
      'application_number', v_app.application_number,
      'contract_id', v_contract.id,
      'contract_number', v_contract.contract_number,
      'deposit_ledger_id', v_deposit_ledger_id
    )
  ) RETURNING id INTO v_transaction_id;

  -- STEP 9: تحديث سجل الإيداع (DEPOSITED)
  v_processing_ms := EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  UPDATE financing_deposit_ledger
  SET status = 'DEPOSITED',
      credit_id = v_credit_id,
      transaction_id = v_transaction_id,
      balance_before = v_balance_before,
      balance_after = v_balance_after,
      processing_completed_at = clock_timestamp(),
      processing_duration_ms = v_processing_ms,
      updated_at = now()
  WHERE id = v_deposit_ledger_id;

  -- STEP 10: تحديث حالة الطلب
  UPDATE financing_applications
  SET credit_deposit_status = 'CREDIT_DEPOSITED',
      status = 'CREDIT_DEPOSITED',
      updated_at = now()
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'deposited',
    'deposit_ledger_id', v_deposit_ledger_id,
    'credit_id', v_credit_id,
    'transaction_id', v_transaction_id,
    'amount', v_app.approved_amount,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'processing_ms', v_processing_ms,
    'message_ar', 'تم إيداع رصيد الخدمات بنجاح'
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback: تحديث حالة سجل الإيداع
  IF v_deposit_ledger_id IS NOT NULL THEN
    UPDATE financing_deposit_ledger
    SET status = 'FAILED',
        failure_code = SQLSTATE,
        failure_reason = SQLERRM,
        processing_completed_at = clock_timestamp(),
        processing_duration_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER,
        updated_at = now()
    WHERE id = v_deposit_ledger_id;
  END IF;

  -- تحديث حالة الطلب
  UPDATE financing_applications
  SET credit_deposit_status = 'CREDIT_DEPOSIT_FAILED',
      updated_at = now()
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', false, 'action', 'failed',
    'error_code', SQLSTATE, 'error', SQLERRM,
    'message_ar', 'فشل إيداع الرصيد: ' || SQLERRM
  );
END;
$$;
