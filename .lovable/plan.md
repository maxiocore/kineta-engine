# Customer End-to-End Provisioning Test — build the runner (no paid run yet)

Test customer: your current account (ali6c205@gmail.com, wallet ≈ 5,258.12 SAR). Nothing opens to other customers; global live provisioning stays OFF; maximum one VPS.

## Already verified (read-only)
- Previous Advanced test record is `cleaned_up`: server, 2 snapshots and temporary SSH key recorded as deleted and verified gone.
- The runner's first step re-checks this live at Hetzner (no labelled servers, keys, snapshots, active tests) and STOPS if anything remains.

## What gets built
1. **Private test access** — a scoped grant tying *your account + one test order* to plan "سحابي S" (CX23), fsn1, Ubuntu 24.04. The plan stays hidden for everyone else; the order function refuses any other user.
2. **Scoped auto-provisioning override** — the order is marked `E2E_TEST`; only that one order may call Hetzner automatically after payment. The global switch is untouched.
3. **Customer flow** — the order goes through the real customer order function (plan → location → OS → review → VAT → wallet debit → order → provisioning job). No admin direct-create.
4. **Automatic provisioning worker** — after payment, the job starts on its own and reuses the Advanced-test safeguards: encrypted SSH key, cloud-init boot-finished, valid non-zero host keys, `sshd -t`, sync, graceful reboots only. Status flow: paid → queued → provisioning → configuring → active (active only once running + IPv4 + IPv6 + first boot + SSH pass).
5. **Customer actions** — Restart / Stop / Start via the customer action path with ownership check, queue, provider call, verification, audit log; plus a check that another account is refused.
6. **Notifications** — payment successful, provisioning started, server ready (no provider details).
7. **Billing record** — subscription row with renewal date and a billing record linked to the order; snapshots of VAT, cost, exchange rate and margin verified against the plan.
8. **Cancellation** — "Cancel immediately" by the customer: active → cancellation_pending → terminating → terminated, Hetzner server deleted and verified gone.
9. **Test refund** — one refund of the exact charged amount through the standard refund path, with a ledger entry; all records kept and tagged `E2E_TEST`.
10. **Final cleanup check** — 0 servers, 0 temp keys, 0 snapshots, 0 orphans, 0 pending jobs/actions; then the full report and "CUSTOMER END-TO-END TEST PASSED" only if every criterion passes. Any failure stops immediately, no replacement VPS.
11. **Admin panel** — new "Customer E2E" tab showing preflight, a single Run button (requires typing a confirmation), live stage progress and the final report.

## Expected charges
- Wallet: 49.00 SAR + 7.35 VAT = **56.35 SAR**, fully refunded at the end.
- Hetzner: CX23 + IPv4 billed hourly (~€0.0095/h). Hard cap: runner auto-stops and deletes after 3 hours → **max ≈ €0.03** (worst case one billed month ≈ €5.99 if deletion failed, which the runner reports).

## After building
I will show "READY TO RUN CUSTOMER E2E TEST". Nothing paid starts until you press Run once.

## Technical details
- Migration: `cloud_e2e_customer_grants` (user_id, plan_id, location, image, order_id, used_at), `cloud_subscriptions` (order_id, server_id, renewal_at, status, e2e flag), `cloud_billing_records`; add `is_e2e_test` to `cloud_orders`; extend server statuses with configuring / cancellation_pending / terminating / terminated. GRANTs + admin/owner RLS.
- `order_cloud_server`: allow hidden plan only when an unused grant matches the caller; mark order E2E; idempotency key reused for the duplicate-submit test.
- New edge function `cloud-customer-e2e` (admin-only orchestration that signs in as the test customer via a minted session for customer-path calls, stage machine stored in `cloud_e2e_tests` with `test_key = customer-e2e-01`, one-shot atomic claim). Shared first-boot helpers moved to `_shared/` from `cloud-advanced-test`.
- `cloud-api`: provisioning allowed when `LIVE_PROVISIONING_ENABLED` OR order has a valid unused E2E grant; add customer `cancel` and `refund` (admin) actions; power actions verified against provider state.
- Refund uses the existing balance credit path with `balance_logs` entry; idempotent by order id.
