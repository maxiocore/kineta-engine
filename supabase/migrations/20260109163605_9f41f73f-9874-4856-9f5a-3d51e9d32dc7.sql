-- جدول رصيد الخدمات (غير نقدي - للاستخدام داخل المنصة فقط)
CREATE TABLE public.service_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- الرصيد
  total_credited DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(12,2) GENERATED ALWAYS AS (total_credited - total_used) STORED,
  
  -- مصدر الرصيد
  source_type TEXT NOT NULL DEFAULT 'financing', -- financing, promotion, referral
  source_reference_id UUID, -- financing_application_id or contract_id
  contract_id UUID REFERENCES public.financing_contracts(id),
  application_id UUID REFERENCES public.financing_applications(id),
  
  -- القيود
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_frozen BOOLEAN NOT NULL DEFAULT false, -- تجميد في حالة مشكلة
  freeze_reason TEXT,
  
  -- الصلاحية
  expires_at TIMESTAMPTZ, -- تاريخ انتهاء الصلاحية (اختياري)
  
  -- التدقيق
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- قيود
  CONSTRAINT positive_credited CHECK (total_credited >= 0),
  CONSTRAINT positive_used CHECK (total_used >= 0),
  CONSTRAINT used_not_exceed_credited CHECK (total_used <= total_credited)
);

-- جدول سجل حركات الرصيد
CREATE TABLE public.service_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES public.service_credits(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  
  -- نوع العملية
  transaction_type TEXT NOT NULL, -- credit, debit, reversal, freeze, unfreeze
  
  -- المبلغ
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  
  -- مرجع العملية
  reference_type TEXT, -- order, service, refund, manual_review
  reference_id UUID,
  
  -- تفاصيل
  description TEXT,
  description_ar TEXT,
  
  -- بيانات الخدمة المشتراة
  service_id UUID REFERENCES public.services(id),
  service_name TEXT,
  order_id UUID REFERENCES public.orders(id),
  
  -- التدقيق
  created_by UUID,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'completed', -- pending, completed, failed, reversed
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول طلبات المراجعة اليدوية
CREATE TABLE public.service_credit_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES public.service_credits(id),
  user_id UUID NOT NULL,
  
  -- سبب المراجعة
  review_type TEXT NOT NULL, -- unauthorized_attempt, suspicious_activity, limit_exceeded
  description TEXT NOT NULL,
  
  -- البيانات المرتبطة
  attempted_action TEXT,
  attempted_amount DECIMAL(12,2),
  metadata JSONB,
  
  -- حالة المراجعة
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, resolved
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  resolution TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX idx_service_credits_user_id ON public.service_credits(user_id);
CREATE INDEX idx_service_credits_contract_id ON public.service_credits(contract_id);
CREATE INDEX idx_service_credits_application_id ON public.service_credits(application_id);
CREATE INDEX idx_service_credits_active ON public.service_credits(is_active, is_frozen);

CREATE INDEX idx_service_credit_transactions_credit_id ON public.service_credit_transactions(credit_id);
CREATE INDEX idx_service_credit_transactions_user_id ON public.service_credit_transactions(user_id);
CREATE INDEX idx_service_credit_transactions_type ON public.service_credit_transactions(transaction_type);
CREATE INDEX idx_service_credit_transactions_created_at ON public.service_credit_transactions(created_at DESC);

CREATE INDEX idx_service_credit_reviews_status ON public.service_credit_reviews(status);
CREATE INDEX idx_service_credit_reviews_user_id ON public.service_credit_reviews(user_id);

-- تفعيل RLS
ALTER TABLE public.service_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_credit_reviews ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - المستخدم يرى رصيده فقط
CREATE POLICY "Users can view their own service credits"
ON public.service_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credit transactions"
ON public.service_credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- سياسات الأمان - المسؤول فقط يمكنه الإضافة والتعديل
CREATE POLICY "System can insert service credits"
ON public.service_credits FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update service credits"
ON public.service_credits FOR UPDATE
USING (true);

CREATE POLICY "System can insert credit transactions"
ON public.service_credit_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert credit reviews"
ON public.service_credit_reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own reviews"
ON public.service_credit_reviews FOR SELECT
USING (auth.uid() = user_id);

-- دالة إنشاء رصيد خدمات عند اعتماد العقد
CREATE OR REPLACE FUNCTION create_service_credit_on_finalize()
RETURNS TRIGGER AS $$
DECLARE
  v_approved_amount DECIMAL(12,2);
  v_credit_id UUID;
BEGIN
  -- فقط عند التغيير إلى FINALIZED
  IF NEW.status = 'finalized' AND OLD.status != 'finalized' THEN
    -- الحصول على المبلغ المعتمد من طلب التمويل
    SELECT approved_amount INTO v_approved_amount
    FROM public.financing_applications
    WHERE id = NEW.application_id;
    
    -- التحقق من عدم وجود رصيد مسبق لهذا العقد
    IF NOT EXISTS (
      SELECT 1 FROM public.service_credits 
      WHERE contract_id = NEW.id
    ) THEN
      -- إنشاء رصيد الخدمات
      INSERT INTO public.service_credits (
        user_id,
        total_credited,
        source_type,
        source_reference_id,
        contract_id,
        application_id
      ) VALUES (
        NEW.user_id,
        COALESCE(v_approved_amount, 0),
        'financing',
        NEW.id,
        NEW.id,
        NEW.application_id
      ) RETURNING id INTO v_credit_id;
      
      -- تسجيل عملية الإيداع
      INSERT INTO public.service_credit_transactions (
        credit_id,
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        reference_type,
        reference_id,
        description,
        description_ar,
        status
      ) VALUES (
        v_credit_id,
        NEW.user_id,
        'credit',
        COALESCE(v_approved_amount, 0),
        0,
        COALESCE(v_approved_amount, 0),
        'financing',
        NEW.application_id,
        'Service credit from approved financing',
        'رصيد خدمات من تمويل معتمد',
        'completed'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تفعيل المشغل
CREATE TRIGGER trigger_create_service_credit_on_finalize
AFTER UPDATE ON public.financing_contracts
FOR EACH ROW
EXECUTE FUNCTION create_service_credit_on_finalize();

-- دالة خصم الرصيد عند شراء خدمة
CREATE OR REPLACE FUNCTION deduct_service_credit(
  p_user_id UUID,
  p_amount DECIMAL(12,2),
  p_service_id UUID,
  p_service_name TEXT,
  p_order_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_credit RECORD;
  v_new_balance DECIMAL(12,2);
  v_transaction_id UUID;
BEGIN
  -- الحصول على رصيد المستخدم النشط
  SELECT * INTO v_credit
  FROM public.service_credits
  WHERE user_id = p_user_id
    AND is_active = true
    AND is_frozen = false
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;
  
  -- التحقق من وجود رصيد
  IF v_credit IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_credit',
      'message_ar', 'لا يوجد رصيد خدمات نشط'
    );
  END IF;
  
  -- التحقق من كفاية الرصيد
  IF v_credit.available_balance < p_amount THEN
    -- تسجيل محاولة غير مصرح بها
    INSERT INTO public.service_credit_reviews (
      credit_id,
      user_id,
      review_type,
      description,
      attempted_action,
      attempted_amount,
      metadata
    ) VALUES (
      v_credit.id,
      p_user_id,
      'limit_exceeded',
      'محاولة استخدام مبلغ أكبر من الرصيد المتاح',
      'deduct',
      p_amount,
      jsonb_build_object(
        'available_balance', v_credit.available_balance,
        'service_id', p_service_id,
        'order_id', p_order_id
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message_ar', 'رصيد الخدمات غير كافٍ',
      'available_balance', v_credit.available_balance,
      'requested_amount', p_amount
    );
  END IF;
  
  -- حساب الرصيد الجديد
  v_new_balance := v_credit.available_balance - p_amount;
  
  -- تحديث الرصيد
  UPDATE public.service_credits
  SET 
    total_used = total_used + p_amount,
    updated_at = now()
  WHERE id = v_credit.id;
  
  -- تسجيل العملية
  INSERT INTO public.service_credit_transactions (
    credit_id,
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    reference_type,
    reference_id,
    description,
    description_ar,
    service_id,
    service_name,
    order_id,
    ip_address,
    user_agent,
    status
  ) VALUES (
    v_credit.id,
    p_user_id,
    'debit',
    p_amount,
    v_credit.available_balance,
    v_new_balance,
    'order',
    p_order_id,
    'Service purchase: ' || COALESCE(p_service_name, 'Unknown'),
    'شراء خدمة: ' || COALESCE(p_service_name, 'غير محدد'),
    p_service_id,
    p_service_name,
    p_order_id,
    p_ip_address,
    p_user_agent,
    'completed'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount,
    'message_ar', 'تم خصم المبلغ بنجاح'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة تجميد الرصيد
CREATE OR REPLACE FUNCTION freeze_service_credit(
  p_credit_id UUID,
  p_reason TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_credit RECORD;
BEGIN
  SELECT * INTO v_credit FROM public.service_credits WHERE id = p_credit_id;
  
  IF v_credit IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.service_credits
  SET 
    is_frozen = true,
    freeze_reason = p_reason,
    updated_at = now()
  WHERE id = p_credit_id;
  
  -- تسجيل العملية
  INSERT INTO public.service_credit_transactions (
    credit_id,
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    description_ar,
    created_by,
    status
  ) VALUES (
    p_credit_id,
    v_credit.user_id,
    'freeze',
    0,
    v_credit.available_balance,
    v_credit.available_balance,
    'Credit frozen: ' || p_reason,
    'تم تجميد الرصيد: ' || p_reason,
    p_admin_id,
    'completed'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تفعيل Realtime للتحديثات الفورية
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_credit_transactions;