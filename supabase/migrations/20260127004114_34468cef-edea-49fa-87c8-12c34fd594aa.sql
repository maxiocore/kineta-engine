-- إسقاط القيد القديم وإضافته مع جميع الحالات المطلوبة
ALTER TABLE financing_applications DROP CONSTRAINT IF EXISTS financing_applications_status_check;

ALTER TABLE financing_applications ADD CONSTRAINT financing_applications_status_check 
CHECK (status = ANY (ARRAY[
  -- الحالات الأساسية (lowercase)
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
  'cancelled'::text,
  -- حالات V2 State Machine (UPPERCASE)
  'DRAFT'::text,
  'REQUEST_SUBMITTED'::text,
  'ADMIN_SETUP'::text,
  'OFFER_READY'::text,
  'ACK_SENT'::text,
  'ACK_SIGNED'::text,
  'CONTRACT_PRESENTED'::text,
  'CONTRACT_SIGNED'::text,
  'CONTRACT_FINALIZED'::text,
  'BOND_ISSUING'::text,
  'BOND_SENT_TO_CLIENT'::text,
  'BOND_SIGNED_BY_CLIENT'::text,
  'BOND_VERIFIED_BY_ADMIN'::text,
  'CREDIT_DEPOSITED'::text,
  'CREDIT_ACTIVE'::text,
  'ORDER_PAYMENT_IN_PROGRESS'::text,
  'FULLY_UTILIZED'::text,
  'FINANCING_COMPLETED'::text,
  'CANCELLED'::text,
  'REJECTED'::text,
  'EXPIRED'::text,
  -- حالات توافقية إضافية
  'FIN_CONTRACT_FINALIZED'::text,
  'APPROVED'::text,
  'APPROVED_WITH_LIMITS'::text,
  'CONTRACT_ACCEPTED'::text
]));