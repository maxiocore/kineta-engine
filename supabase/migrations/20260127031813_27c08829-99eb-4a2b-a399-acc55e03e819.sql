-- ═══════════════════════════════════════════════════════════════════════════════
-- MaxioCore Financing System v2 - Role-Based Access Control Enhancement
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Add 'client' value to existing app_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'client';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2) Create or Replace Security Functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- 3) Create Financing Admin Actions Audit Log (if not exists)
CREATE TABLE IF NOT EXISTS public.financing_admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'UPDATE_AMOUNT',
        'UPDATE_DURATION', 
        'UPDATE_NAME',
        'RESEND_CONTRACT',
        'RESEND_ACKNOWLEDGMENT',
        'CANCEL_FINANCING',
        'APPROVE_OFFER',
        'ISSUE_BOND',
        'ACTIVATE_CREDIT',
        'VERSION_CONTRACT'
    )),
    old_value JSONB,
    new_value JSONB,
    reason TEXT NOT NULL,
    contract_version INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK if table was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'financing_admin_audit_application_id_fkey'
    ) THEN
        ALTER TABLE public.financing_admin_audit
        ADD CONSTRAINT financing_admin_audit_application_id_fkey
        FOREIGN KEY (application_id) REFERENCES public.financing_applications(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on audit log
ALTER TABLE public.financing_admin_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.financing_admin_audit;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.financing_admin_audit;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.financing_admin_audit
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.financing_admin_audit
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financing_admin_audit_application ON public.financing_admin_audit(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_admin_audit_admin ON public.financing_admin_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_financing_admin_audit_action ON public.financing_admin_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_financing_admin_audit_created ON public.financing_admin_audit(created_at DESC);

-- 5) Add cancellation and versioning fields to financing_applications
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS contract_version INTEGER DEFAULT 1;

-- Add FK for cancelled_by if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'financing_applications_cancelled_by_fkey'
    ) THEN
        ALTER TABLE public.financing_applications
        ADD CONSTRAINT financing_applications_cancelled_by_fkey
        FOREIGN KEY (cancelled_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- 6) Function to get user role for frontend
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 7) Function to check if user can perform admin action
CREATE OR REPLACE FUNCTION public.can_admin_action(_user_id UUID, _action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can perform any admin action
  RETURN public.is_admin(_user_id);
END;
$$;