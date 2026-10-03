DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes (pdf/doc/docx only)" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND lower(storage.extension(name)) IN ('pdf','doc','docx')
  AND name !~ '\.\.'
  AND name ~ '^[A-Za-z0-9._/-]{1,200}$'
);