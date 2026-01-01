-- Allow users to update their own financing applications (for signing contracts)
CREATE POLICY "Users can update their own applications" 
ON public.financing_applications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);