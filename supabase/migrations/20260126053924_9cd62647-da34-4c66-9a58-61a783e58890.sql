-- Drop the old constraint and add the new one with contract_signed status
ALTER TABLE public.financing_applications 
DROP CONSTRAINT financing_applications_status_check;

ALTER TABLE public.financing_applications 
ADD CONSTRAINT financing_applications_status_check 
CHECK (status = ANY (ARRAY[
  'draft'::text,
  'pending'::text, 
  'under_review'::text, 
  'documents_required'::text, 
  'awaiting_contract'::text, 
  'contract_signed'::text,
  'awaiting_signature'::text, 
  'approved'::text, 
  'active'::text, 
  'rejected'::text, 
  'completed'::text, 
  'cancelled'::text
]));