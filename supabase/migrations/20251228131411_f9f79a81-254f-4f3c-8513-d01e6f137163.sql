-- Create storage bucket for financing documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('financing-documents', 'financing-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own financing documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'financing-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can view their own financing documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'financing-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all financing documents
CREATE POLICY "Admins can view all financing documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'financing-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);