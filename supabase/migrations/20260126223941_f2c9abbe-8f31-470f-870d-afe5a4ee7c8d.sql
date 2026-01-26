-- ============================================================
-- Internal Transfer System: Financing Credit → Platform Wallet
-- ============================================================

-- 1. Create internal_transfers table for tracking all internal transfers
CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('financing_credit', 'platform_wallet')),
    destination_type TEXT NOT NULL CHECK (destination_type IN ('financing_credit', 'platform_wallet')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    application_id UUID REFERENCES public.financing_applications(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
    idempotency_key TEXT NOT NULL UNIQUE,
    source_balance_before NUMERIC(12,2),
    source_balance_after NUMERIC(12,2),
    destination_balance_before NUMERIC(12,2),
    destination_balance_after NUMERIC(12,2),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id ON internal_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_application_id ON internal_transfers(application_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_status ON internal_transfers(status);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_idempotency ON internal_transfers(idempotency_key);

-- Enable RLS
ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_transfers
CREATE POLICY "Users can view own transfers" ON internal_transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transfers" ON internal_transfers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage transfers" ON internal_transfers
    FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_transfers;

-- 2. Ensure user_balances has all needed fields
-- Add created_at if not exists (for wallet creation tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_balances' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.user_balances ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 3. Create or replace the atomic transfer function
CREATE OR REPLACE FUNCTION public.execute_internal_transfer(
    p_user_id UUID,
    p_amount NUMERIC(12,2),
    p_application_id UUID,
    p_idempotency_key TEXT,
    p_device_info JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer_id UUID;
    v_financing_balance_before NUMERIC(12,2);
    v_financing_balance_after NUMERIC(12,2);
    v_wallet_balance_before NUMERIC(12,2);
    v_wallet_balance_after NUMERIC(12,2);
    v_service_credit RECORD;
    v_user_wallet RECORD;
    v_application RECORD;
    v_processing_start TIMESTAMPTZ := now();
BEGIN
    -- Check for existing transfer with same idempotency key
    SELECT * INTO v_transfer_id FROM internal_transfers 
    WHERE idempotency_key = p_idempotency_key AND status = 'completed';
    
    IF v_transfer_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'transfer_id', v_transfer_id,
            'message', 'تم تنفيذ هذا التحويل مسبقاً'
        );
    END IF;

    -- Lock the application record
    SELECT * INTO v_application FROM financing_applications
    WHERE id = p_application_id AND user_id = p_user_id
    FOR UPDATE;

    IF v_application IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'APPLICATION_NOT_FOUND',
            'message', 'طلب التمويل غير موجود'
        );
    END IF;

    -- Verify application is in deposited state
    IF v_application.credit_deposit_status NOT IN ('FIN_CREDIT_DEPOSITED', 'CREDIT_DEPOSITED') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_STATUS',
            'message', 'لا يمكن التحويل - حالة التمويل غير صالحة'
        );
    END IF;

    -- Get service credit balance
    SELECT * INTO v_service_credit FROM service_credits
    WHERE user_id = p_user_id AND is_active = true AND is_frozen = false
    FOR UPDATE;

    IF v_service_credit IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NO_SERVICE_CREDIT',
            'message', 'لا يوجد رصيد خدمات متاح'
        );
    END IF;

    -- Calculate available financing balance from ledger
    v_financing_balance_before := calculate_service_credit_balance(p_user_id);

    IF v_financing_balance_before < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_BALANCE',
            'message', 'الرصيد غير كافٍ',
            'available_balance', v_financing_balance_before,
            'requested_amount', p_amount
        );
    END IF;

    -- Create the transfer record
    INSERT INTO internal_transfers (
        user_id, source_type, destination_type, amount, application_id,
        status, idempotency_key, source_balance_before, device_info, 
        ip_address, user_agent, processing_started_at
    ) VALUES (
        p_user_id, 'financing_credit', 'platform_wallet', p_amount, p_application_id,
        'processing', p_idempotency_key, v_financing_balance_before, p_device_info,
        p_ip_address, p_user_agent, v_processing_start
    ) RETURNING id INTO v_transfer_id;

    -- STEP 1: Debit from service credit (financing credit)
    INSERT INTO service_credit_transactions (
        user_id, credit_id, transaction_type, amount, status,
        description, description_ar, reference_type, reference_id, metadata
    ) VALUES (
        p_user_id, v_service_credit.id, 'debit', p_amount, 'completed',
        'Internal transfer to platform wallet', 'تحويل داخلي إلى رصيد المنصة',
        'internal_transfer', v_transfer_id,
        jsonb_build_object(
            'transfer_id', v_transfer_id,
            'application_id', p_application_id,
            'destination', 'platform_wallet'
        )
    );

    -- Update service credits used amount
    UPDATE service_credits
    SET total_used = total_used + p_amount, updated_at = now()
    WHERE id = v_service_credit.id;

    v_financing_balance_after := calculate_service_credit_balance(p_user_id);

    -- STEP 2: Credit to user_balances (platform wallet)
    -- Get or create user wallet
    SELECT * INTO v_user_wallet FROM user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_user_wallet IS NULL THEN
        -- Create wallet if not exists
        INSERT INTO user_balances (user_id, balance, total_deposited, total_spent)
        VALUES (p_user_id, 0, 0, 0)
        RETURNING * INTO v_user_wallet;
    END IF;

    v_wallet_balance_before := v_user_wallet.balance;
    v_wallet_balance_after := v_wallet_balance_before + p_amount;

    -- Update user balance
    UPDATE user_balances
    SET 
        balance = v_wallet_balance_after,
        total_deposited = total_deposited + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Log to balance_logs
    INSERT INTO balance_logs (
        user_id, action_type, amount, balance_before, balance_after,
        reference_type, reference_id, notes, created_by
    ) VALUES (
        p_user_id, 'financing_transfer_in', p_amount, v_wallet_balance_before, v_wallet_balance_after,
        'internal_transfer', v_transfer_id::text, 
        'تحويل من رصيد التمويل إلى رصيد الخدمات داخل المنصة', p_user_id
    );

    -- STEP 3: Finalize transfer record
    UPDATE internal_transfers SET
        status = 'completed',
        source_balance_after = v_financing_balance_after,
        destination_balance_before = v_wallet_balance_before,
        destination_balance_after = v_wallet_balance_after,
        processing_completed_at = now(),
        updated_at = now()
    WHERE id = v_transfer_id;

    -- STEP 4: Log audit
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id, 
        old_value, new_value, ip_address, user_agent
    ) VALUES (
        p_user_id, 'internal_transfer', 'internal_transfers', v_transfer_id::text,
        jsonb_build_object(
            'financing_balance', v_financing_balance_before,
            'wallet_balance', v_wallet_balance_before
        ),
        jsonb_build_object(
            'financing_balance', v_financing_balance_after,
            'wallet_balance', v_wallet_balance_after,
            'transfer_amount', p_amount
        ),
        p_ip_address, p_user_agent
    );

    RETURN jsonb_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'amount', p_amount,
        'source_balance_before', v_financing_balance_before,
        'source_balance_after', v_financing_balance_after,
        'destination_balance_before', v_wallet_balance_before,
        'destination_balance_after', v_wallet_balance_after,
        'message', 'تم التحويل بنجاح'
    );

EXCEPTION WHEN OTHERS THEN
    -- Mark transfer as failed if it was created
    IF v_transfer_id IS NOT NULL THEN
        UPDATE internal_transfers SET
            status = 'failed',
            error_message = SQLERRM,
            processing_completed_at = now(),
            updated_at = now()
        WHERE id = v_transfer_id;
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'error', 'TRANSACTION_FAILED',
        'message', 'فشل التحويل - ' || SQLERRM
    );
END;
$$;

-- 4. Function to check if transfer is allowed
CREATE OR REPLACE FUNCTION public.can_execute_internal_transfer(
    p_user_id UUID,
    p_application_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_service_credit RECORD;
    v_available_balance NUMERIC(12,2);
    v_application RECORD;
    v_has_wallet BOOLEAN;
BEGIN
    -- Check for active service credit
    SELECT * INTO v_service_credit FROM service_credits
    WHERE user_id = p_user_id AND is_active = true AND is_frozen = false
    LIMIT 1;

    IF v_service_credit IS NULL THEN
        RETURN jsonb_build_object(
            'can_transfer', false,
            'reason', 'NO_SERVICE_CREDIT',
            'message', 'لا يوجد رصيد خدمات متاح'
        );
    END IF;

    -- Check if credit is frozen
    IF v_service_credit.is_frozen THEN
        RETURN jsonb_build_object(
            'can_transfer', false,
            'reason', 'CREDIT_FROZEN',
            'message', 'رصيد الخدمات مجمد'
        );
    END IF;

    -- Get available balance from ledger
    v_available_balance := calculate_service_credit_balance(p_user_id);

    IF v_available_balance <= 0 THEN
        RETURN jsonb_build_object(
            'can_transfer', false,
            'reason', 'ZERO_BALANCE',
            'message', 'لا يوجد رصيد متاح للتحويل',
            'available_balance', 0
        );
    END IF;

    -- Check application status if provided
    IF p_application_id IS NOT NULL THEN
        SELECT * INTO v_application FROM financing_applications
        WHERE id = p_application_id AND user_id = p_user_id;

        IF v_application IS NULL THEN
            RETURN jsonb_build_object(
                'can_transfer', false,
                'reason', 'APPLICATION_NOT_FOUND',
                'message', 'طلب التمويل غير موجود'
            );
        END IF;

        IF v_application.credit_deposit_status NOT IN ('FIN_CREDIT_DEPOSITED', 'CREDIT_DEPOSITED') THEN
            RETURN jsonb_build_object(
                'can_transfer', false,
                'reason', 'INVALID_STATUS',
                'message', 'حالة التمويل غير مؤهلة للتحويل'
            );
        END IF;
    END IF;

    -- Check if user has a wallet (will be created if not)
    SELECT EXISTS(SELECT 1 FROM user_balances WHERE user_id = p_user_id) INTO v_has_wallet;

    RETURN jsonb_build_object(
        'can_transfer', true,
        'available_balance', v_available_balance,
        'has_wallet', v_has_wallet,
        'application_id', v_service_credit.application_id,
        'message', 'يمكن التحويل'
    );
END;
$$;

-- 5. Rate limiting function for transfers
CREATE OR REPLACE FUNCTION public.check_transfer_rate_limit(
    p_user_id UUID,
    p_window_minutes INTEGER DEFAULT 60,
    p_max_transfers INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer_count INTEGER;
    v_window_start TIMESTAMPTZ := now() - (p_window_minutes || ' minutes')::INTERVAL;
BEGIN
    SELECT COUNT(*) INTO v_transfer_count
    FROM internal_transfers
    WHERE user_id = p_user_id
      AND created_at > v_window_start
      AND status IN ('completed', 'processing', 'pending');

    IF v_transfer_count >= p_max_transfers THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'RATE_LIMITED',
            'message', 'تجاوزت الحد الأقصى للتحويلات. يرجى المحاولة لاحقاً',
            'transfer_count', v_transfer_count,
            'max_transfers', p_max_transfers,
            'window_minutes', p_window_minutes
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'transfer_count', v_transfer_count,
        'remaining', p_max_transfers - v_transfer_count
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.execute_internal_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_execute_internal_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_transfer_rate_limit TO authenticated;