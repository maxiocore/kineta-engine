-- Rollback for "HIGH findings" migration (2026-10-03). Re-opens the HIGH issues; ledger rows are kept.
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert referral codes" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view referral codes for validation" ON public.referral_codes FOR SELECT USING (is_active = true);
CREATE POLICY "own actions request" ON public.cloud_server_actions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'requested' AND EXISTS (SELECT 1 FROM cloud_servers s WHERE s.id = cloud_server_actions.server_id AND s.user_id = auth.uid()));
GRANT SELECT ON public.cloud_orders TO authenticated;
DROP TRIGGER IF EXISTS deposits_client_guard ON public.deposits;
DROP FUNCTION IF EXISTS public.deposits_client_guard();
DROP FUNCTION IF EXISTS public.apply_referral_code(text);
DROP FUNCTION IF EXISTS public.ensure_my_referral_code();
DROP FUNCTION IF EXISTS public.admin_list_cloud_orders();
DROP FUNCTION IF EXISTS public.complete_deposit_verified(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.cloud_action_rate_check(uuid, uuid, text);
-- Trigger functions (update_balance_on_deposit, award_cashback_on_deposit, calculate_referral_commission,
-- calculate_referral_commission_on_deposit) previous bodies are stored in the migration history
-- (supabase/migrations) and in docs/security/audit-2026-10-03.md references; restore from there if needed.
-- Auth: leaked-password protection was enabled via auth settings (password_hibp_enabled=true); disable there if required.
