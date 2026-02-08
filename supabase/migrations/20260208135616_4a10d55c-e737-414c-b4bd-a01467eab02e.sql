-- Drop old check constraint and recreate with ALL needed statuses
ALTER TABLE public.financing_applications DROP CONSTRAINT IF EXISTS financing_applications_status_check;

ALTER TABLE public.financing_applications ADD CONSTRAINT financing_applications_status_check
CHECK (status = ANY (ARRAY[
  -- Legacy lowercase statuses
  'draft', 'pending', 'under_review', 'documents_required', 'awaiting_contract',
  'contract_signed', 'awaiting_signature', 'approved', 'active', 'rejected', 'completed', 'cancelled',
  -- V2 uppercase statuses
  'DRAFT', 'REQUEST_SUBMITTED', 'UNDER_REVIEW', 'ADMIN_SETUP',
  'OFFER_READY', 'ACK_SENT', 'ACK_SIGNED',
  'CONTRACT_PRESENTED', 'CONTRACT_SENT', 'CONTRACT_SIGNED', 'CONTRACT_ACCEPTED', 'CONTRACT_FINALIZED',
  'SIGNING_OTP_SENT', 'PROMISSORY_SIGNED',
  'BOND_ISSUING', 'BOND_ISSUED', 'BOND_SENT_TO_CLIENT', 'BOND_SIGNED_BY_CLIENT', 'BOND_VERIFIED_BY_ADMIN',
  'CREDIT_DEPOSITED', 'FIN_CREDIT_DEPOSITED', 'FIN_CONTRACT_FINALIZED',
  'CREDIT_ACTIVE', 'ORDER_PAYMENT_IN_PROGRESS', 'FULLY_UTILIZED', 'FINANCING_COMPLETED',
  'APPROVED', 'APPROVED_WITH_LIMITS',
  'DECLINED', 'CANCELLED', 'REJECTED', 'EXPIRED',
  'IN_USE', 'COMPLETED'
]));