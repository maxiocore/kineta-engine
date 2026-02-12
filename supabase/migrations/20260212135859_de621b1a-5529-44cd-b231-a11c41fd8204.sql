
-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc-documents bucket
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Add admin KYC review columns to kyc_verifications
ALTER TABLE public.kyc_verifications 
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS document_front_url text,
ADD COLUMN IF NOT EXISTS document_back_url text,
ADD COLUMN IF NOT EXISTS selfie_url text,
ADD COLUMN IF NOT EXISTS ai_analysis jsonb,
ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS extracted_data jsonb;

-- Admin policies for kyc_verifications
CREATE POLICY "Admins can view all KYC verifications"
ON public.kyc_verifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all KYC verifications"
ON public.kyc_verifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for KYC verifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_verifications;
