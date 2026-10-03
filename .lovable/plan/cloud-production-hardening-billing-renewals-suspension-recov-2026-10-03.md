# Cloud Production Hardening — Billing, Renewals, Suspension, Recovery

Nothing goes live in this phase. Plans stay hidden, no Hetzner server is created/stopped/deleted, no real wallet renewal, no price change, no credential change. All new automatic switches stay **false**.

## What gets built

**1. Subscription lifecycle (separate from server status)**
Statuses: pending_payment, paid, provisioning, active, renewal_due, payment_failed, grace_period, suspension_pending, suspended, reactivation_pending, cancellation_pending, termination_pending, terminated, provisioning_failed. Allowed transitions enforced in the database; every change logged.

**2. Billing & renewal price**
Each subscription stores billing cycle, period start/end, next renewal, auto-renew, payment method, and a frozen renewal snapshot (subtotal, VAT rate, VAT, total, backup add-on — all in halalas). Current plan price is never applied to an existing subscription automatically; a price change needs an explicit admin action + customer notice.

**3. Renewal engine (wallet)**
One atomic server-side function: lock subscription + wallet, check due and not already renewed for this period, check balance, debit exact amount, immutable ledger entry, separate renewal invoice, advance the period once, audit. Running it twice = one renewal. Card payments are not auto-charged (no supported recurring token) — customer gets a "Pay now" link instead.

**4. Failure, grace, retries, suspension, reactivation, termination**
- Failure → payment_failed → grace_period, storing reason, attempts, next retry.
- Admin settings: grace days, retry schedule, grace server policy (keep running / suspend immediately), termination delay, notification schedule (7/3/1 days), auto-renew default, min margin warning, provider retry policy. Temporary defaults are clearly labelled "not decided".
- After grace: suspension_pending → power-off job → suspended (never deletion).
- Full payment while suspended: settle money first → reactivation_pending → power-on → verify running → active.
- Termination only after delay + warnings, and only if still unpaid, no new payment, no hold/dispute, not protected, no pending reactivation; then delete request → verify gone → terminated.
- Admin flag "Protect from automatic termination".
- Customer cancellation: at period end (auto-renew off) or immediately (shows stop date and refund eligibility; no automatic refund).

**5. Provider reliability**
- Error classes: temporary, rate limited, auth, invalid request, resource missing, outage, unknown.
- Unified job queue (provisioning, server action, renewal, suspension, termination, reconciliation, notification) with attempts, backoff, idempotency key; after max attempts → manual_review with Retry / Resolve / Cancel.
- Lost create response: search provider by internal labels/order reference and adopt the existing server before any retry.
- Reconciliation job: flags provider-missing, internal-missing, IP/status mismatch, duplicates, orphans — alerts only, never auto-deletes.
- One destructive action per server at a time (action lock).
- Maintenance/incident notices for customers worded as "infrastructure maintenance" (no provider name).

**6. Monitoring, alerts, notifications, emails**
Admin Health panel (provider status, success rate, queue depth, failed jobs, renewal failures, suspended, pending terminations, mismatches) and admin alerts. Arabic/English customer notifications + emails for all 13 events via the shared email template — no provider names, IDs, raw errors or costs.

**7. Cost & margin**
Each renewal stores an admin-only provider cost snapshot; cost increases raise a margin alert, never a customer price change.

**8. Screens**
- Admin Cloud: new tabs Renewals, Suspensions, Terminations, Failed jobs, Reconciliation, Health, Lifecycle settings, Lifecycle simulation.
- Customer server details: subscription status, next renewal, amount, auto-renew toggle, Pay now, grace days left, suspension reason + amount due + Reactivate, termination date, cancel options.

**9. Simulation & tests**
Dry-run simulator using a mock provider and test subscriptions (no real money, no real provider). Runs tests A–R plus race tests (payment vs suspension, payment vs termination, double renewal worker, cancel vs renew) and security tests (customer cannot call workers/retries). Test data cleaned up afterwards.

**10. Final report** — the 27 items requested, then stop.

## Technical details

- Migration: extend `cloud_subscriptions` (lifecycle + period + snapshot + protection + failure fields), new `cloud_lifecycle_settings`, `cloud_jobs` (typed queue, unique idempotency_key), `cloud_subscription_events`, `cloud_renewal_invoices`, `cloud_reconciliation_findings`, `cloud_admin_alerts`, `cloud_maintenance_events`, `cloud_server_locks`. Admin-only RLS on cost/provider columns; GRANTs per table.
- DB functions: `cloud_sub_transition`, `cloud_renew_subscription` (built on `_wallet_post`, keyed by subscription+period), `cloud_settle_and_reactivate`, `cloud_request_cancel`, `cloud_acquire_server_lock`; service-role only except customer cancel/pay.
- New edge function `cloud-lifecycle-worker` (service role / admin only): renewal, grace, suspension, termination, retries, reconciliation, notifications; each stage gated by `AUTOMATIC_RENEWALS_ENABLED`, `AUTOMATIC_SUSPENSIONS_ENABLED`, `AUTOMATIC_TERMINATIONS_ENABLED` (all false) plus `LIVE_PROVISIONING_ENABLED` for any provider call. `dry_run` mode uses a `MockProvider` implementing the existing `CloudProvider` interface.
- Provider adapter gains error classification and label-based lookup for adoption/reconciliation.
- No cron schedule enabled in this phase (switches are off); AGENTS.md updated with the lifecycle/worker rules.
