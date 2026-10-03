- [ ] إعادة تصميم جميع قوالب البريد بهوية موحدة ومحتوى متخصص لكل قسم

## Closing internal issues (2026-10-03)
- [x] Current password verification (server-side) + tests A–F
- [x] True wallet concurrency (5 rounds + refund/charge combos)
- [x] Real invoice isolation
- [x] Test accounts sec-test-a/b removed via admin tool
- [x] Full English customer portal (LTR) + desktop/tablet/mobile test
- [x] Final report incl. 22 warnings classification

## Next: Replace Paylink with white-label online payment (processor hidden from customers)
- [x] Inventory Paylink usage, stop new Paylink payments, keep history
- [x] Payment service (provider abstraction, processor adapter, checkout, callback, webhook, verification, wallet/invoice/order, refunds, admin)
- [x] Live keys supported, LIVE_PAYMENTS_ENABLED=false gate, pre-live report
- [ ] First production payment test — waiting for owner approval
- [ ] Payment provider architecture + white-label customer UI (see upload)

## Cloud production hardening (2026-10-03)
- [x] Lifecycle, renewals, grace, suspension, termination, jobs, reconciliation, simulation A–R
- [x] Phase 2: real provider actions (dry-verified), scheduler, emails, backup cancel
- [ ] Real lifecycle test on a dedicated test VPS — waiting for owner approval

## Limited Cloud Launch activation + Cloud email (2026-10-03, two uploads)
- [ ] SSH public key required at checkout (saved or new), validated server-side, no passwords, customer key on server
- [ ] Scheduler secret + server-side cron for all queues; one scheduler cycle test
- [ ] Cloud email: cloud@/billing@ routing, unified template AR/EN, email jobs table (idempotent, retries), admin Email Delivery tab
- [ ] Domain auth check SPF/DKIM/DMARC + sender verification (report only, no DNS changes)
- [ ] Cloud email tests A–I to admin only
- [ ] Verify Moyasar health/methods; enable switches (scheduler, renewals, suspensions, payments, provisioning; terminations stay false)
- [ ] Make only "سحابي S" visible; verify 5 image mappings and 3 locations
- [ ] Server details customer view (root, SSH key shown, no provider data)
- [ ] CV upload check (stop if unrestricted); medium findings to backlog
- [ ] Final read-only check + two reports
