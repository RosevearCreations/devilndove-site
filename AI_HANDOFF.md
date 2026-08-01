# Devil n Dove AI Handoff — Build 228

This is the first of two canonical current-status files. Read it first for architecture, authority, safety and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for completed work, risks and ordered next steps. Historical Build Markdown remains evidence only.

## Build 228 outcome

1. Startup Readiness now preserves all 37 previous gates and adds five standalone process gates: Deployment Preflight, Post-Deploy Smoke Tests, Deploy Readiness, Go-Live Execution and Live Ops Follow-through. Exactly 42 gates are expected.
2. The Startup browser rejects HTML, empty, malformed or incomplete API success responses and renders the full built-in 42-gate guide. It never turns a service failure into “No readiness items match these filters.” Browser-only changes are visibly Unsynced.
3. `/admin/prelaunch/` shows the seven separate prelaunch/release stages. `PRELAUNCH_PROCESS_PLAYBOOKS.md` gives click-by-click tests, correction, evidence and pass rules.
4. `/admin/creative-automation/` is the master Creative Automation Studio. It combines Creative Process, materials/cost, CAIP, Content Studio, channel approvals, Release Board and measure/repurpose stages without deleting specialist features or duplicating their source facts.
5. Build 228 adds only master orchestration tables. Existing Creative Process, inventory, CAIP, Content Studio, publication, social, catalog and analytics tables remain authoritative for their facts.
6. New and changed admin layouts stack on mobile, contain table overflow, preserve touch targets and expose direct specialist/fallback paths.
7. Deployment Preflight now blocks a current D1 migration containing explicit `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`, and requires the numbered/current migration files to be identical.
8. Public SEO policy remains: one H1 per exposed page, clear titles/descriptions/canonical/visible facts, truthful local language and approved media. Admin routes are `noindex,nofollow`.

## Data authority

- Startup status/history: D1 `startup_readiness_items` and `startup_readiness_history` at `/admin/startup-readiness/`.
- Startup instruction seed: `STARTUP_ITEMS` in `functions/api/admin/startup-readiness.js`; generate `STARTUP_GO_LIVE_GUIDE.md` with `node scripts/generate-startup-guide.mjs`.
- Creative project/process/material/output facts: existing Creative Process tables.
- Media rights/evidence/intelligence: CAIP records and referenced source media; CAIP never invents consent.
- Content packages/channel deliverables: Content Studio records.
- Public release state/history: Content Release Board records.
- Master creative ownership/stage reviews: three `creative_automation_*` tables only.
- Product/order/payment/refund/inventory/accounting facts: their existing D1 transaction/ledger records.
- Packaging: `packaging_projects`, normalized soap rows, `packaging_components`, versions, exports and print tests; `PACKAGING_STUDIO.md` is the human specification.
- Issued client documents: immutable `customer_documents.source_snapshot_json`; corrections use void/new document, never history rewriting.
- Static templates/public read-only defaults may remain JSON. Mutable business status, evidence, money, stock, approvals and audit history belong in D1.

## Current operating routes

- `/admin/startup-readiness/` — 42 launch gates and D1 evidence.
- `/admin/prelaunch/` — separate process map.
- `/admin/deployment-preflight/`, `/admin/post-deploy-smoke-tests/`, `/admin/deploy-readiness/`, `/admin/go-live-execution/`, `/admin/live-ops-followthrough/` — standalone release stages.
- `/admin/creative-automation/` — master creative workflow.
- `/admin/creative-process/`, `/admin/creative-assets/`, `/admin/content-studio/`, `/admin/content-publications/`, `/admin/social-publishing/` — specialist creative authorities retained.
- `/admin/packaging-studio/` — whole-business labels, packaging BOM/cost, previews, versions, exports and print tests.
- `/admin/customer-documents/` — invoices, receipts, packing slips, credit notes and refund confirmations.
- `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/` — operational transaction authorities.

## Build 228 database change

Back up D1 and confirm Build 227 exists. Apply exactly one:

- `database_build228_creative_automation_prelaunch_stages.sql`
- `database_upgrade_current_pass.sql` (byte-identical copy)

The migration adds `creative_automation_workflows`, `creative_automation_stage_reviews`, `creative_automation_events` and ledger key `build228_creative_automation_prelaunch_stages`. It contains no explicit SQL transaction statements. Do not add `BEGIN TRANSACTION` or `SAVEPOINT`; D1/Durable Object code must use `state.storage.transaction()` or `transactionSync()` when a JavaScript transaction is required.

Aggregate schema files `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` include the Build 228 block. Run `node scripts/sync-build228-aggregate-schema.mjs` after changing the numbered migration. The old Build 227 synchronizer intentionally stops with a retirement message so it cannot erase Build 228.

## Error/fallback rules

- An unavailable API is Blocked/Unavailable, never Passed.
- Browser fallback may preserve instructions or a visibly unsynced draft; it cannot represent server evidence.
- Payment, refund, publish, inventory, accounting, approval and document actions require an observable authoritative result.
- Runtime incidents must be sanitized and include scope/code/severity plus non-secret request/user context.
- Master creative failure must leave specialist workspaces reachable.
- Startup failure must show all built-in gates and a retry path.

## SEO/local/mobile rules

- Exactly one H1 on each exposed HTML page; do not create multiple equally prominent title-like headings.
- Use natural buyer language in title, H1, introduction, product facts, alt text and internal links. Avoid location/keyword stuffing.
- Keep canonical, Product/Offer, LocalBusiness/Organization and visible facts consistent; placeholders never enter Product schema, Open Graph or launch galleries.
- Maintain accurate Business Profile name/category/contact/hours/service area/photos and real review practices. First-page placement cannot be guaranteed because local results also depend on distance and prominence.
- Test phone, tablet, laptop and wide desktop; keyboard order/focus, touch targets, overflow, dialogs and slow-image fallback are release checks.

## Deploy sequence

1. Run the complete Deployment Preflight against the exact folder/archive.
2. Record D1 recovery point; apply one Build 228 migration; verify ledger and tables.
3. Deploy the complete archive and retain previous deployment/rollback details.
4. Run Post-Deploy Smoke Tests on production.
5. Confirm all 42 Startup gates load with All statuses and preserve older evidence.
6. Link one owner-controlled Creative Project in the master studio; save one stage review with evidence and reload.
7. Run Release Sanity, Product Release Preflight and read-only Meta identity/token checks.
8. Make a separate Deploy Readiness decision; execute Go-Live only after Ready; continue Live Ops reconciliation.

## Not claimed complete

Local code cannot supply production credentials, physical stock/label proof, legal/tax approval, real provider permission, customer email delivery or paid/refund evidence. Those remain Startup gates. Google ranking cannot be guaranteed; monitor Search Console, Business Profile and real local/customer evidence.

