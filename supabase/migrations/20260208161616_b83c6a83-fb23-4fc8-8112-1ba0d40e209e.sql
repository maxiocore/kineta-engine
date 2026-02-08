
-- Allow users to INSERT acknowledgment records for their own applications
CREATE POLICY "Users can create acknowledgments for their applications"
ON public.financing_acknowledgments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM financing_applications fa
    WHERE fa.id = financing_acknowledgments.application_id
    AND fa.user_id = auth.uid()
  )
);

-- Allow users to UPDATE (sign) acknowledgments for their own applications
CREATE POLICY "Users can sign their own acknowledgments"
ON public.financing_acknowledgments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM financing_applications fa
    WHERE fa.id = financing_acknowledgments.application_id
    AND fa.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM financing_applications fa
    WHERE fa.id = financing_acknowledgments.application_id
    AND fa.user_id = auth.uid()
  )
);
