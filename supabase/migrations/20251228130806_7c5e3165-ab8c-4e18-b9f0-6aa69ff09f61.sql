-- Drop the existing check constraint
ALTER TABLE public.financing_applications DROP CONSTRAINT IF EXISTS financing_applications_status_check;

-- Add new check constraint with all status values including new ones
ALTER TABLE public.financing_applications ADD CONSTRAINT financing_applications_status_check 
CHECK (status IN ('pending', 'under_review', 'documents_required', 'awaiting_contract', 'awaiting_signature', 'approved', 'active', 'rejected', 'completed', 'cancelled'));