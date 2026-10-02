CREATE TABLE public.email_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_login_codes TO service_role;
ALTER TABLE public.email_login_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_email_login_codes_email ON public.email_login_codes(email, created_at DESC);