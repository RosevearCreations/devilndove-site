# Release 467 — Build 381 Production Calendar, Resource Conflicts & Availability

**Admin workspace:** [Production Calendar](https://devilndove.com/admin/project-resource-calendar/).

## Source-owned design

Canonical tool/equipment identity remains `site_item_inventory`; workstation role remains `inventory_workstation_roles`. Project operations stay in `creative_project_operations`, work status and time in `creative_work_order_events`, shared Inventory material allocations in `creative_project_material_reservations` (Build 380).

Additive canonical D1 migration `0033_release467_resource_calendar_conflicts.sql` introduces only an operator-owned `creative_resource_calendar_entries` ledger. Four entry types: project booking, shared resource hold, maintenance block and standalone project deadline. A deadline records a real manually entered target, not automatic manufacturing progress. Every active booking uses a valid UTC start/end and a real active Inventory Tool; project operations must belong to the same project. Half-open intervals [start,end) mean adjacent bookings are not conflicts. SQLite trigger checks prevent simultaneous overlapping resource reservations across projects unless a human overrides with a reason of at least 20 characters. Maintenance overlap needs a second explicit acknowledgement. The API also previews conflict records and gives 409 on missing overrides, but the database trigger is the final concurrency authority.

- UI stores UTC exact-second strings derived from the operator's local clock; timezone and daylight-saving conversions happen before submission. Never guess the user's timezone for saved values.
- Entries are append-only: cancellation changes only status and stores actor/time/reason. No modification/deletion. Rebook by cancelling and creating a new entry.
- A record-free window means **no conflict recorded in this application**; it is not proof of physical machine occupancy, an unscheduled operator, maintenance readiness or a customer SLA.
- All reads bounded: 160 resource tools, 100 projects, 100 operations, 200 calendar rows in up to a 60-day window, plus narrowly scoped conflict checks max 50 rows. Truncation removes any completeness/availability claim.
- Server requires admin session, same-origin Origin on POST, idempotent request key, operator note (12+ chars) and audited manual override/cancellation.
- No automatic task completion, stock consumption, customer-facing project progress, maintenance sign-off, supplier purchase or financial posting.
- Supports operator-maintained future project deadlines without inventing project due dates. Fine-grained equipment/maintenance coordination is per canonical Inventory item.

## Acceptance and rollback

Run `python scripts/release467_build381_regression.py`, `node --test scripts/release467_build381_calendar.test.mjs`. Prove exact Development head through System Gate, Quality, I.T. runtime, Branch Hygiene and Build 381 specific workflow. Apply migration 0033 Development-first, then Production before deploying code, verifying isolated D1 and Cloudflare Pages/live-resource integrity. Manual authenticated acceptance: create overlapping cross-project bookings and assert first fails without explicit override; place maintenance block and require distinct acknowledgement; cancel and verify the original timestamp/history persists.

Rollback the page and API to an older code build **without dropping the ledger or its owner histories**. No fabricated booking state.

**Next queued: Build 382 — Customer Requests, Quotes & Commission Lifecycle.**
