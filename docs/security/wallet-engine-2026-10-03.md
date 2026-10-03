# Wallet Payment Engine — 2026-10-03
Rollback: docs/security/rollback-2026-10-03-wallet-engine.sql (previous: rollback-2026-10-03-hardening-1.sql kept).
Flows moved server-side: DesignServiceOrder (/dashboard/design-order), ProfessionalOrderForm (design/dev/marketing/hosting dashboards), ServiceOrderDialog (/services, favorites, featured offers), InvoicePaymentCard (dev order details), points redemption (rewards pages), admin credit/debit (AdminWallets, AdminFinancialHub).
Removed unused legacy forms: EmbeddedOrderForm, CustomServiceOrderForm.
Attack tests A–N executed in a rolled-back transaction: all blocked / single debit as expected.
Remaining HIGH: profiles PII readable by signed-in users, referral fraud, cloud_orders cost/margin columns visible to owner, leaked-password protection off, deposit webhooks write balances non-atomically (service role).
