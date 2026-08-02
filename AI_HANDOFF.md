# Devil n Dove AI Handoff — Build 231

This is the first of two canonical current-status files. Read it first for architecture, authority, safety and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for completed work, risks and ordered next steps. Historical Build Markdown remains evidence only.

## Build 231 outcome

1. Startup Readiness preserves all 42 Build 228 gates and adds `missing_launch_images` as a distinct Critical blocker. Exactly 43 gates are expected.
2. The Startup browser rejects HTML, empty, malformed or incomplete API success responses and renders the full built-in 43-gate guide. It never turns a service failure into “No readiness items match these filters.” Browser-only changes are visibly Unsynced.
3. `/admin/prelaunch/` shows the seven separate prelaunch/release stages. `PRELAUNCH_PROCESS_PLAYBOOKS.md` gives click-by-click tests, correction, evidence and pass rules.
4. `/admin/creative-automation/` is the master Creative Automation Studio. It combines Creative Process, materials/cost, CAIP, Content Studio, channel approvals, Release Board and measure/repurpose stages without deleting specialist features or duplicating their source facts.
5. Build 229 adds only `packaging_reference_sources`; existing Creative Process, packaging, inventory, CAIP, Content Studio, publication, social, catalog and analytics tables remain authoritative for their facts.
6. New and changed admin layouts stack on mobile, contain table overflow, preserve touch targets and expose direct specialist/fallback paths.
7. Deployment Preflight now blocks a current D1 migration containing explicit `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`, and requires the numbered/current migration files to be identical.
8. The exact supplied packaging specification, guide PDF and master SVG are retained with SHA-256 values and exposed in Labeling & Packaging; `PACKAGING_REFERENCE_BASELINE.md` documents their collective authority and dimensional conflict.
9. Public SEO policy remains: one H1 per exposed page, clear titles/descriptions/canonical/visible facts, truthful local language and approved media. Admin routes are `noindex,nofollow`.
10. `/admin/image-manifest/` is now the mutable visual-status authority. It seeds 20 requirements and stores owner, status, rights, public-use, final URL, alternative text, phone/desktop review and append-only history in D1.
11. The manifest API rejects incomplete approvals, audits saves and records runtime incidents. Its browser fallback shows all 20 requirements as visibly Unsynced and read-only instead of implying an empty or complete result.
12. Three responsive editorial illustrations now enrich the homepage, general handmade-jewelry guide and gift-card page. Prompts, intended roles, dimensions and hashes are preserved in `GENERATED_VISUAL_ASSET_REGISTER.md`.
13. Generated art never satisfies a real-product, process, condition, packaging or local-business photo requirement and must not enter Product/Offer structured data or launch-product galleries.
14. Changed public pages keep one H1, truthful editorial disclosure, intrinsic image dimensions and responsive phone/desktop sources; the manifest stacks safely with touch-sized actions.
15. Product Draft autosave now carries an explicit autosave intent so create/update routes omit approval/content/social preparation and repetitive update/media audits while retaining deliberate Save/Update audits and automation.
16. Unapproved products exit social automation before schema/settings inspection, and unchanged image rows are not rewritten on text-only autosaves.
17. Autosave allows one request in flight, queues the newest edit, stores a browser recovery copy before the request and clears it only after the matching server save succeeds.
18. Product reload, autosave and update use one safe response parser. A Cloudflare HTML/1102 page becomes a short retryable message; raw HTML/CSS and `JSON.parse` exceptions are never shown to the operator.
19. `/api/admin/product-detail` now uses one core product read plus three bounded optional editor reads, performs no request-time schema introspection, returns at most seven images and identifies its JSON as `editor_compact_v1`.
20. Build 231 is code-only. The current D1 migration remains Build 230 and must not be reapplied merely because the application build number changed.

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
- Packaging sources: `packaging_reference_sources` and `PACKAGING_REFERENCE_BASELINE.md`; the adopted files remain unchanged at their registered repository paths.
- Issued client documents: immutable `customer_documents.source_snapshot_json`; corrections use void/new document, never history rewriting.
- Static templates/public read-only defaults may remain JSON. Mutable business status, evidence, money, stock, approvals and audit history belong in D1.
- Image requirements/status/history: D1 `image_manifest_items` and `image_manifest_history`; `IMAGES_REQUIRED.md` is the human capture standard and `GENERATED_VISUAL_ASSET_REGISTER.md` is generated-asset provenance.

## Current operating routes

- `/admin/startup-readiness/` — 43 launch gates and D1 evidence, including the distinct missing-image blocker.
- `/admin/image-manifest/` — 20 seeded static/dynamic image requirements, rights/public/device approvals, evidence and history.
- `/admin/prelaunch/` — separate process map.
- `/admin/deployment-preflight/`, `/admin/post-deploy-smoke-tests/`, `/admin/deploy-readiness/`, `/admin/go-live-execution/`, `/admin/live-ops-followthrough/` — standalone release stages.
- `/admin/creative-automation/` — master creative workflow.
- `/admin/creative-process/`, `/admin/creative-assets/`, `/admin/content-studio/`, `/admin/content-publications/`, `/admin/social-publishing/` — specialist creative authorities retained.
- `/admin/packaging-studio/` — whole-business labels, packaging BOM/cost, previews, versions, exports and print tests.
- `/admin/customer-documents/` — invoices, receipts, packing slips, credit notes and refund confirmations.
- `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/` — operational transaction authorities.

## Build 231 database boundary

Build 231 adds no D1 table, column, seed or ledger row. `database_upgrade_current_pass.sql` remains byte-identical to the Build 230 migration. Back up D1, confirm Build 229, and apply exactly one of these only when `build230_visual_image_manifest` is not already recorded:

- `database_build230_visual_image_manifest.sql`
- `database_upgrade_current_pass.sql` (byte-identical copy)

That Build 230 migration adds `image_manifest_items`, `image_manifest_history`, 20 active requirements, three generated-asset provenance rows and ledger key `build230_visual_image_manifest`. It preserves operator-editable evidence on repeat execution and contains no explicit SQL transaction statements. Do not add `BEGIN TRANSACTION` or `SAVEPOINT`; D1/Durable Object code must use `state.storage.transaction()` or `transactionSync()` when a JavaScript transaction is required.

Aggregate schema files `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` include Builds 229 and 230. Run `node scripts/sync-build230-aggregate-schema.mjs` after changing the numbered migration. Older synchronizers intentionally stop so they cannot erase the current block.

## Error/fallback rules

- An unavailable API is Blocked/Unavailable, never Passed.
- Browser fallback may preserve instructions or a visibly unsynced draft; it cannot represent server evidence.
- Payment, refund, publish, inventory, accounting, approval and document actions require an observable authoritative result.
- Runtime incidents must be sanitized and include scope/code/severity plus non-secret request/user context.
- Master creative failure must leave specialist workspaces reachable.
- Startup failure must show all built-in gates and a retry path.
- Image-manifest failure must show 20 read-only fallback requirements, an Unsynced warning and retry; saving is disabled and no fallback status is presented as approved.

## SEO/local/mobile rules

- Exactly one H1 on each exposed HTML page; do not create multiple equally prominent title-like headings.
- Use natural buyer language in title, H1, introduction, product facts, alt text and internal links. Avoid location/keyword stuffing.
- Keep canonical, Product/Offer, LocalBusiness/Organization and visible facts consistent; placeholders never enter Product schema, Open Graph or launch galleries.
- Put accurate, high-quality images near relevant visible text, preserve equivalent mobile/desktop content and alt text, and use multiple real high-resolution product views where useful; never keyword-stuff alternative text.
- Maintain accurate Business Profile name/category/contact/hours/service area/photos and real review practices. First-page placement cannot be guaranteed because local results also depend on distance and prominence.
- Test phone, tablet, laptop and wide desktop; keyboard order/focus, touch targets, overflow, dialogs and slow-image fallback are release checks.

## Deploy sequence

1. Run the complete Deployment Preflight against the exact folder/archive.
2. Record D1 recovery point; apply one Build 230 migration; verify ledger, both manifest tables, 20 active rows and three generated provenance rows.
3. Deploy the complete Build 231 archive and retain previous deployment/rollback details; hard refresh so service-worker shell v12 is active.
4. Run Post-Deploy Smoke Tests on production.
5. Confirm all 43 Startup gates load with All statuses, locate `missing_launch_images`, open the D1 manifest and confirm 20 rows rather than Unsynced fallback.
6. Link one owner-controlled Creative Project in the master studio; save one stage review with evidence and reload.
7. Run Release Sanity, Product Release Preflight, Build 231 product load/autosave/browser-recovery proof, visual-manifest phone/desktop review and read-only Meta identity/token checks.
8. Make a separate Deploy Readiness decision; execute Go-Live only after Ready; continue Live Ops reconciliation.

## Not claimed complete

Local code cannot supply production credentials, physical stock/label proof, legal/tax approval, real provider permission, customer email delivery or paid/refund evidence. Those remain Startup gates. Google ranking cannot be guaranteed; monitor Search Console, Business Profile and real local/customer evidence.
