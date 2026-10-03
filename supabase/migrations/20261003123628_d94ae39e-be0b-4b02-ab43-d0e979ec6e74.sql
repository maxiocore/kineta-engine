-- Batch 1: rescope permissive "system" policies to service_role / owner / admin (service_role bypasses RLS anyway).
DROP POLICY "System can manage rate limits" ON public.rate_limit_records;
CREATE POLICY "System manages rate limits" ON public.rate_limit_records FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY "System can read blacklists" ON public.fraud_blacklists;
CREATE POLICY "System reads blacklists" ON public.fraud_blacklists FOR SELECT TO service_role USING (true);
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins or owner insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY "Anyone can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins or self insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());
DROP POLICY "Anyone can view ticket attachments" ON storage.objects;
CREATE POLICY "Owner or admin view ticket attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ticket-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
DROP POLICY "Anyone can view settings" ON public.financing_settings;
CREATE POLICY "Signed-in users can view settings" ON public.financing_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY "Admins can view all admin notifications" ON public.admin_notifications;
DROP POLICY "Admins can update admin notifications" ON public.admin_notifications;
DROP POLICY "Admins can delete admin notifications" ON public.admin_notifications;
DROP POLICY "System can insert admin notifications" ON public.admin_notifications;
CREATE POLICY "Signed-in users insert admin notifications" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY "System can insert fingerprints" ON public.device_fingerprints;
CREATE POLICY "System inserts fingerprints" ON public.device_fingerprints FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY "System can insert fraud signals" ON public.fraud_signals;
CREATE POLICY "System inserts fraud signals" ON public.fraud_signals FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY "Anyone can insert verification audit logs" ON public.verification_audit_logs;
CREATE POLICY "Self insert verification audit logs" ON public.verification_audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY "System can insert service credits" ON public.service_credits;
DROP POLICY "System can update service credits" ON public.service_credits;
CREATE POLICY "System inserts service credits" ON public.service_credits FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "System updates service credits" ON public.service_credits FOR UPDATE TO service_role USING (true);
DROP POLICY "System can insert credit transactions" ON public.service_credit_transactions;
CREATE POLICY "System inserts credit transactions" ON public.service_credit_transactions FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY "System can insert credit reviews" ON public.service_credit_reviews;
CREATE POLICY "System inserts credit reviews" ON public.service_credit_reviews FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY "Service role can insert deposit ledger" ON public.financing_deposit_ledger;
DROP POLICY "Service role can update deposit ledger" ON public.financing_deposit_ledger;
CREATE POLICY "System inserts deposit ledger" ON public.financing_deposit_ledger FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "System updates deposit ledger" ON public.financing_deposit_ledger FOR UPDATE TO service_role USING (true);
DROP POLICY "Service role can manage transfers" ON public.internal_transfers;
CREATE POLICY "System manages transfers" ON public.internal_transfers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Money / admin functions that take a user id or act on any account: server-side only.
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY[
    'atomic_credit_deposit(uuid,uuid,text)','calculate_service_credit_balance(uuid)','can_admin_action(uuid,text)','can_execute_internal_transfer(uuid,uuid)',
    'check_email_rate_limit(text,integer,integer)','check_transfer_rate_limit(uuid,integer,integer)','cleanup_email_rate_limits()',
    'create_contract_new_version(uuid,jsonb,text)','deduct_service_credit(uuid,numeric,uuid,text,uuid,inet,text)',
    'execute_internal_transfer(uuid,numeric,uuid,text,jsonb,inet,text)','freeze_service_credit(uuid,text,uuid)','get_user_role(uuid)',
    'increment_email_rate_limit(text)','reconcile_credit_deposits()','retry_failed_deposits()','update_overdue_installments()','withdraw_cashback(uuid,numeric)']
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
  REVOKE EXECUTE ON FUNCTION public.withdraw_cashback(numeric) FROM PUBLIC, anon;
END $$;