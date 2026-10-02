ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS interview_date timestamptz,
  ADD COLUMN IF NOT EXISTS interview_location text,
  ADD COLUMN IF NOT EXISTS interview_type text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS rating integer;