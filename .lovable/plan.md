# Servers & Cloud section — Phase 1 (foundation)

The request covers ~30 areas. Building all at once would be fragile, so this plan delivers a working foundation now and leaves provider-dependent features for when real provider access is connected.

## What the customer will see now
- New sidebar item "الخوادم والبنية السحابية / Servers & Cloud" (existing design kept, Arabic RTL + English LTR).
- **Overview**: real counts (total / active / stopped / suspended, VPS vs dedicated, IPv4/IPv6, snapshots, monthly spend), quick actions, latest activity. Empty states when the customer has nothing yet — no fake numbers.
- **My Servers**: search (name / IP / ID), filters, cards/rows, actions with confirmation dialogs for risky ones.
- **Server details**: header (name, status, IP, location, OS) with Start/Stop/Restart, tabs for Overview, Metrics, Networking, Backups, Snapshots, Rebuild, Rescue, Access, Activity, Billing, Settings. Metrics show "available after activation" until the provider is connected.
- **Order Server wizard** (7 steps): type → location → plan → OS → configuration → review with VAT 15% → payment from wallet balance (existing system). Plans, locations and images come from the database managed by admin.
- **SSH Keys**: add / delete keys (fully working).
- **Networking, Backups, Snapshots, Images, Usage, Billing, Activity log**: pages reading real data, with clear empty states.
- **Support**: links to existing support tickets with the server preselected.
- No provider name or logo shown anywhere.

## Admin (preparation)
- Manage plans, locations, OS images, and pricing; view customer servers and change their status manually until automation is connected.

## Not in this phase (needs real provider access)
- Actual server creation, power actions, live metrics, console, rescue, rebuild, real snapshots/backups. Actions are recorded as requests (status "pending") so admin can fulfil them manually meanwhile.

## Technical details
- Tables: `cloud_plans`, `cloud_locations`, `cloud_images`, `cloud_servers`, `cloud_server_ips`, `cloud_ssh_keys`, `cloud_snapshots`, `cloud_backups`, `cloud_server_actions` (state machine: requested → provisioning → active / failed), `cloud_activity_logs`. RLS: customers see own rows; admin via `has_role`. GRANTs per rules.
- Edge function `cloud-api` with a provider interface (`CloudProvider`: createServer, power, listLocations…) and a `ManualProvider` implementation now; a real provider adapter plugs in later via server-side secrets only.
- Order payment: server-side function deducts wallet balance (balance + total_spent) atomically and creates the server record.
- Routes under `/dashboard/cloud/*`, lazy-loaded; new components in `src/components/cloud/`.
