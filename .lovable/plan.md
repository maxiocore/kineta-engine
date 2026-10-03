# Admin Cloud Infrastructure — Phase 2

No test servers, no fake prices or plans. Customer portal stays as is. Provider name visible in admin only; credentials server-side only.

## What gets built

**Admin → Cloud Infrastructure** section (RTL/LTR, responsive, same look as current admin), with tabs:
Overview · Servers · Orders · Cloud VPS plans · Dedicated plans · Locations · Operating systems · Networks & IPs · Backups · Snapshots · Provisioning jobs · Providers · Billing · Suspensions/cancellations · Activity log · Settings.

- **Overview**: real counts only (total/active/provisioning/suspended/failed, VPS vs dedicated), monthly revenue, infra cost, gross margin, pending orders, failed jobs, pending actions, upcoming renewals, provider health, recent activity, quick actions. Zeros / empty states when no data.
- **Servers**: table with filters + search (ID, customer, email, IP, hostname); details page with tabs (Overview, Provider, Networking, Backups, Snapshots, Billing, Actions, Activity, Security) and admin actions (start/stop/restart/rebuild/rescue/snapshot/backup/suspend/unsuspend/terminate) with confirmation on destructive ones.
- **Plans**: full VPS plan editor (AR/EN names, code, provider type mapping, specs, locations, cost, retail price, setup fee, billing cycles, status, featured, order) and separate Dedicated plans. Pricing engine shows cost / retail / VAT / profit / margin % to admin only; manual pricing default.
- **Locations & OS**: manage what customers see; provider IDs hidden from customers.
- **Providers**: multiple providers (Hetzner Cloud, Hetzner Robot, custom), status, health, last success/error. **Test Connection** button (Connected / Auth failed / Unavailable / Configuration missing). **Sync** server types, locations, images, servers into an internal **Provider Catalog** only; admin clicks "Create Retail Plan" to publish.
- **Orders**: statuses pending payment → paid → queued → provisioning → active / failed / cancelled / refunded, with amount, VAT, payment, provisioning status; Retry / Cancel / Refund on failures.

## Technical details

- DB migration: `cloud_providers`, `cloud_provider_catalog`, `cloud_dedicated_plans`, `cloud_provisioning_jobs`, `cloud_orders` (unique `idempotency_key`, unique `transaction_reference`), `cloud_billing_settings` (VAT 15%, editable); extend plans/locations/images/servers with provider mapping, cost, status fields. Admin-only RLS on cost/provider columns; customer-safe views keep provider fields hidden.
- Rewrite `order_cloud_server` to be atomic with idempotency key (row lock on balance, single debit, single order/job), VAT read from settings.
- `cloud-api`: add real `HetznerCloudProvider` adapter (`https://api.hetzner.cloud/v1`) reading `HETZNER_CLOUD_API_TOKEN` server-side; admin endpoints for test/sync/provision/retry/actions; safe error messages only, token never logged/returned. Robot adapter stubbed behind same interface. Falls back to manual provider when token missing.
- Provisioning flow and pending customer actions executed by backend jobs, never the browser; job checks `provider_resource_id` before creating to prevent duplicates.
- Hetzner token requested via secure form only after the admin pages are ready.
- Split `AdminCloud.tsx` into per-tab components under `src/components/admin/cloud/`.
