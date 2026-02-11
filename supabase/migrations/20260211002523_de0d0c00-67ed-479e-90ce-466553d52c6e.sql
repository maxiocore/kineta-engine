
-- Drop financing-related tables (order matters due to foreign keys)
DROP TABLE IF EXISTS executive_bond_events CASCADE;
DROP TABLE IF EXISTS financing_executive_bonds CASCADE;
DROP TABLE IF EXISTS contract_signing_otps CASCADE;
DROP TABLE IF EXISTS financing_acknowledgments CASCADE;
DROP TABLE IF EXISTS financing_admin_audit CASCADE;
DROP TABLE IF EXISTS financing_activity_log CASCADE;
DROP TABLE IF EXISTS financing_installments CASCADE;
DROP TABLE IF EXISTS eligibility_audit_logs CASCADE;
DROP TABLE IF EXISTS finance_webhook_events CASCADE;
DROP TABLE IF EXISTS financing_applications CASCADE;
DROP TABLE IF EXISTS financing_plans CASCADE;
