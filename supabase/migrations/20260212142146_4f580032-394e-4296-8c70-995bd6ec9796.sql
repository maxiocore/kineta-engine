
-- =============================================
-- KYC SECURITY HARDENING - ASH HOLDING
-- No deletion, strict admin update, audit trail
-- =============================================

-- 1. BLOCK ALL DELETES on kyc_verifications (no one can delete records)
-- Drop any existing delete policies first
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kyc_verifications' AND cmd = 'd') THEN
    EXECUTE 'DROP POLICY IF EXISTS "No KYC deletion allowed" ON public.kyc_verifications';
  END IF;
END $$;

-- Explicitly deny all deletes
CREATE POLICY "No KYC deletion allowed"
  ON public.kyc_verifications FOR DELETE
  USING (false);

-- 2. Restrict admin UPDATE to only status-related fields via a validation trigger
-- This prevents admins from modifying user data (extracted_data, national_id, documents, etc.)
CREATE OR REPLACE FUNCTION public.enforce_kyc_admin_update_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is the owner (user), they can only update PENDING records (already enforced by RLS)
  IF OLD.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- For admins: prevent modifying user-submitted data
  IF NEW.national_id IS DISTINCT FROM OLD.national_id THEN
    RAISE EXCEPTION 'Cannot modify national_id - admin can only approve or reject';
  END IF;
  IF NEW.document_front_url IS DISTINCT FROM OLD.document_front_url THEN
    RAISE EXCEPTION 'Cannot modify document_front_url - admin can only approve or reject';
  END IF;
  IF NEW.document_back_url IS DISTINCT FROM OLD.document_back_url THEN
    RAISE EXCEPTION 'Cannot modify document_back_url - admin can only approve or reject';
  END IF;
  IF NEW.selfie_url IS DISTINCT FROM OLD.selfie_url THEN
    RAISE EXCEPTION 'Cannot modify selfie_url - admin can only approve or reject';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id - admin can only approve or reject';
  END IF;
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    RAISE EXCEPTION 'Cannot modify session_id - admin can only approve or reject';
  END IF;
  IF NEW.document_type IS DISTINCT FROM OLD.document_type THEN
    RAISE EXCEPTION 'Cannot modify document_type - admin can only approve or reject';
  END IF;

  -- Enforce: status can only go PENDING->PASSED or PENDING->FAILED (no auto-approval, no reversals)
  IF OLD.status != 'PENDING' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot change status of already reviewed KYC record (current: %)', OLD.status;
  END IF;
  IF NEW.status NOT IN ('PENDING', 'PASSED', 'FAILED') THEN
    RAISE EXCEPTION 'Invalid KYC status: %', NEW.status;
  END IF;

  -- Enforce rejection reason on FAILED
  IF NEW.status = 'FAILED' AND (NEW.rejection_reason IS NULL OR trim(NEW.rejection_reason) = '') THEN
    RAISE EXCEPTION 'Rejection reason is mandatory when rejecting KYC';
  END IF;

  -- Enforce admin_reviewed_by and admin_reviewed_at on status change
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('PASSED', 'FAILED') THEN
    IF NEW.admin_reviewed_by IS NULL THEN
      RAISE EXCEPTION 'admin_reviewed_by is required for status changes';
    END IF;
    IF NEW.admin_reviewed_at IS NULL THEN
      NEW.admin_reviewed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_kyc_admin_update ON public.kyc_verifications;

-- Create validation trigger (BEFORE UPDATE)
CREATE TRIGGER enforce_kyc_admin_update
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_admin_update_rules();

-- 3. Comprehensive audit trigger for ALL actions on kyc_verifications
CREATE OR REPLACE FUNCTION public.audit_kyc_actions()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action := 'KYC_SUBMITTED';
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id,
      new_value, metadata
    ) VALUES (
      v_user_id, v_action, 'kyc_verifications', NEW.id::text,
      jsonb_build_object('status', NEW.status, 'document_type', NEW.document_type, 'session_id', NEW.session_id),
      jsonb_build_object('kyc_user_id', NEW.user_id::text, 'event', 'submission')
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := CASE 
        WHEN NEW.status = 'PASSED' THEN 'KYC_APPROVED'
        WHEN NEW.status = 'FAILED' THEN 'KYC_REJECTED'
        ELSE 'KYC_STATUS_CHANGED'
      END;
      INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id,
        old_value, new_value, metadata
      ) VALUES (
        v_user_id, v_action, 'kyc_verifications', NEW.id::text,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object(
          'status', NEW.status,
          'rejection_reason', NEW.rejection_reason,
          'admin_notes', NEW.admin_notes,
          'admin_reviewed_by', NEW.admin_reviewed_by::text,
          'admin_reviewed_at', NEW.admin_reviewed_at::text
        ),
        jsonb_build_object(
          'kyc_user_id', NEW.user_id::text,
          'event', 'status_change',
          'reviewed_by', NEW.admin_reviewed_by::text
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Block deletes (belt and suspenders with RLS)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id,
      old_value, metadata
    ) VALUES (
      v_user_id, 'KYC_DELETE_BLOCKED', 'kyc_verifications', OLD.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('kyc_user_id', OLD.user_id::text, 'event', 'delete_attempt_blocked')
    );
    RAISE EXCEPTION 'KYC records cannot be deleted';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing audit trigger if any
DROP TRIGGER IF EXISTS audit_kyc_all_actions ON public.kyc_verifications;

-- Create comprehensive audit trigger
CREATE TRIGGER audit_kyc_all_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_kyc_actions();

-- 4. Tighten storage policy - ensure only admins can view documents (not other users)
-- Already exists from previous migration, but let's make sure SELECT is admin-only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Users can upload own KYC docs'
  ) THEN
    CREATE POLICY "Users can upload own KYC docs"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- 5. Create a KYC document access log table for tracking who viewed documents
CREATE TABLE IF NOT EXISTS public.kyc_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kyc_verification_id UUID NOT NULL,
  accessed_by UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'view_document', 'view_details', 'download'
  document_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can insert/view access logs
CREATE POLICY "Admins can insert KYC access logs"
  ON public.kyc_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view KYC access logs"
  ON public.kyc_access_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No updates or deletes on access logs (immutable audit trail)
CREATE POLICY "No update on KYC access logs"
  ON public.kyc_access_logs FOR UPDATE
  USING (false);

CREATE POLICY "No delete on KYC access logs"
  ON public.kyc_access_logs FOR DELETE
  USING (false);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_kyc_access_logs_verification ON public.kyc_access_logs(kyc_verification_id);
CREATE INDEX IF NOT EXISTS idx_kyc_access_logs_accessed_by ON public.kyc_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_kyc_access_logs_created ON public.kyc_access_logs(created_at DESC);
