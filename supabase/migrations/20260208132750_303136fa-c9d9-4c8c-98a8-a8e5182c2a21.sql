-- ============================================================
-- Fix all FK constraints pointing to auth.users
-- Add ON DELETE CASCADE for ownership tables
-- Add ON DELETE SET NULL for reference/admin columns
-- This prevents "Database error deleting user" permanently
-- ============================================================

-- OWNERSHIP tables (CASCADE - delete data when user is deleted)

ALTER TABLE public.api_keys DROP CONSTRAINT api_keys_user_id_fkey;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.deposits DROP CONSTRAINT deposits_user_id_fkey;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.email_verifications DROP CONSTRAINT email_verifications_user_id_fkey;
ALTER TABLE public.email_verifications ADD CONSTRAINT email_verifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.refill_requests DROP CONSTRAINT refill_requests_user_id_fkey;
ALTER TABLE public.refill_requests ADD CONSTRAINT refill_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets DROP CONSTRAINT support_tickets_user_id_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_messages DROP CONSTRAINT ticket_messages_sender_id_fkey;
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_balances DROP CONSTRAINT user_balances_user_id_fkey;
ALTER TABLE public.user_balances ADD CONSTRAINT user_balances_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- REFERENCE/ADMIN columns (SET NULL - preserve data but remove user reference)

ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.coupons DROP CONSTRAINT coupons_created_by_fkey;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.email_campaigns DROP CONSTRAINT email_campaigns_created_by_fkey;
ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.email_templates DROP CONSTRAINT email_templates_created_by_fkey;
ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.emails DROP CONSTRAINT emails_sent_by_fkey;
ALTER TABLE public.emails ADD CONSTRAINT emails_sent_by_fkey 
  FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.executive_bond_events DROP CONSTRAINT executive_bond_events_actor_id_fkey;
ALTER TABLE public.executive_bond_events ADD CONSTRAINT executive_bond_events_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_acknowledgments DROP CONSTRAINT financing_acknowledgments_sent_by_fkey;
ALTER TABLE public.financing_acknowledgments ADD CONSTRAINT financing_acknowledgments_sent_by_fkey 
  FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_applications DROP CONSTRAINT financing_applications_cancelled_by_fkey;
ALTER TABLE public.financing_applications ADD CONSTRAINT financing_applications_cancelled_by_fkey 
  FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_contract_documents DROP CONSTRAINT financing_contract_documents_finalized_by_fkey;
ALTER TABLE public.financing_contract_documents ADD CONSTRAINT financing_contract_documents_finalized_by_fkey 
  FOREIGN KEY (finalized_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_contract_documents DROP CONSTRAINT financing_contract_documents_sent_by_fkey;
ALTER TABLE public.financing_contract_documents ADD CONSTRAINT financing_contract_documents_sent_by_fkey 
  FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_executive_bonds DROP CONSTRAINT financing_executive_bonds_sent_to_client_by_fkey;
ALTER TABLE public.financing_executive_bonds ADD CONSTRAINT financing_executive_bonds_sent_to_client_by_fkey 
  FOREIGN KEY (sent_to_client_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_executive_bonds DROP CONSTRAINT financing_executive_bonds_verified_by_admin_id_fkey;
ALTER TABLE public.financing_executive_bonds ADD CONSTRAINT financing_executive_bonds_verified_by_admin_id_fkey 
  FOREIGN KEY (verified_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_executive_bonds DROP CONSTRAINT financing_executive_bonds_issued_by_fkey;
ALTER TABLE public.financing_executive_bonds ADD CONSTRAINT financing_executive_bonds_issued_by_fkey 
  FOREIGN KEY (issued_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_executive_bonds DROP CONSTRAINT financing_executive_bonds_sent_by_fkey;
ALTER TABLE public.financing_executive_bonds ADD CONSTRAINT financing_executive_bonds_sent_by_fkey 
  FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_offer_setup DROP CONSTRAINT financing_offer_setup_setup_by_fkey;
ALTER TABLE public.financing_offer_setup ADD CONSTRAINT financing_offer_setup_setup_by_fkey 
  FOREIGN KEY (setup_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.financing_workflow_audit DROP CONSTRAINT financing_workflow_audit_actor_id_fkey;
ALTER TABLE public.financing_workflow_audit ADD CONSTRAINT financing_workflow_audit_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.system_settings DROP CONSTRAINT system_settings_updated_by_fkey;
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;