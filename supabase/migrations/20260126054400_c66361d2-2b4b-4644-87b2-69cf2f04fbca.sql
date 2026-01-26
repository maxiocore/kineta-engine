-- Add executive bond state column to financing_applications
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS executive_bond_state TEXT DEFAULT 'NOT_ISSUED';

-- Add constraint for valid bond states
ALTER TABLE public.financing_applications 
ADD CONSTRAINT financing_applications_bond_state_check 
CHECK (executive_bond_state = ANY (ARRAY[
  'NOT_ISSUED'::text,
  'ISSUING'::text,
  'ISSUED'::text,
  'SIGNED_BY_CLIENT'::text
]));

-- Add executive_bond_sent_at timestamp
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS executive_bond_sent_at TIMESTAMPTZ;

-- Add executive_bond_signed_at timestamp
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS executive_bond_signed_at TIMESTAMPTZ;