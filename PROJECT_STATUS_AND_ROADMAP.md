# Devil n Dove Project Status and Roadmap — Build 243

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture/deployment authority. This file owns current progress, risks and ordered next actions.

## Build 243 completed work — backend-pressure resilience and lower-case inventory authority

1. Added a shared authenticated JSON transport with in-flight GET deduplication so identical admin reads share one promise instead of multiplying Worker/D1 pressure.
2. Added bounded automatic retry/backoff for temporary safe-read failures (500/502/503/504/408/429-style conditions) while never auto-retrying writes.
3. Added short-lived session cache plus stale-on-temporary-error fallback for safe admin reads, with explicit response metadata rather than false success.
4. Centralized non-JSON/Cloudflare HTML failure handling with HTTP status and Ray-ID diagnostics so the Inventory Operations page no longer surfaces raw `JSON.parse` errors.
5. Deduplicated cached/authenticated `dd:admin-ready` emissions so cached auth plus `/auth/me` verification does not start the same admin loaders twice.
6. Split the former heavy Product Resources GET into lightweight product/link bootstrap and bounded resource-search endpoints.
7. Removed the 1,200-row private Amazon registry expansion from normal Product Resources reads; Amazon matching is now invoked only by the explicit Amazon workflow that needs it.
8. Debounced Product Resources search and made product/link refreshes targeted instead of reloading the complete resource universe.
9. Made Site Inventory startup one-shot, independent and concurrent-safe; seed options and inventory rows no longer recursively trigger each other.
10. Added browser draft persistence for a new/edited inventory item so a temporary Cloudflare/D1 outage does not discard an Amazon/manual inventory form.
11. Disabled Save during an active inventory write and retained the draft on failure, preventing accidental duplicate submits during a slow/503 period.
12. Removed request-time table/index/ALTER/PRAGMA work from routine Site Inventory, Purchase Lots and Product Stock routes; current migrations now own those schemas.
13. Deferred noncritical admin route-usage telemetry and stopped admin pages from loading public social-feed and automatic visitor tracking during critical startup.
14. Hardened every script loaded by `/admin/inventory-operations/` to use the shared JSON/error boundary instead of direct `response.json()` parsing.
15. Added a structured Site Inventory runtime boundary and migration-required response so a genuine schema mismatch is distinguishable from a temporary backend-pressure failure.
16. Normalized controlled product/catalog/inventory classifications and catalog-option values to lower case on write/read paths to stop `Rings`/`rings`-style duplicates.
17. Added Build 243 D1 cleanup that non-destructively merges active inventory identities differing only by `source_type` case, preserving duplicate IDs as inactive history rows.
18. Added a case-insensitive active inventory identity index plus bounded inventory/catalog/product search indexes to keep growing inventory reads predictable.
19. Added high-contrast Inventory Operations buttons plus phone-width full-row action controls to correct light-on-light action text and mobile crowding.
20. Added Build 243 resilience/case audits, synchronized the current-pass plus all three schema files according to their supported scopes, and promoted Build 243 to the current D1 migration boundary. Static public SEO audit remains 36/36 passed with zero missing local `/assets/` references (120 references checked).

## Build 242 completed work — inventory-create production repair

1. Repaired the manual Site Inventory create SQL parameter mismatch that caused the live `/api/admin/site-item-inventory` POST to throw before it could return JSON.
2. Added an admin-safe JSON error boundary around inventory schema checks and manual inventory creation so future D1/runtime failures return structured JSON rather than a Cloudflare HTML 500 page.
3. Added runtime incident capture for inventory schema-check and create failures with bounded diagnostics and no credential payloads.
4. Hardened the Inventory Operations client so a non-JSON/HTML 500 response reports HTTP status and Cloudflare Ray ID instead of surfacing a raw `JSON.parse` exception.
5. Added `scripts/build242_inventory_create_regression.py` to lock the manual create statement to 27 SQL placeholders and verify the error-contract markers.
6. Re-synchronized the three aggregate schema files and schema reference. Build 242 is code-only; Build 241 remains the D1 migration boundary.

## Build 241 completed work — twenty advances

1. Rewrote the supplied Rosie Dazzlers DAIP large-media architecture into Devil n Dove CAIP terminology, media roles, storage prefixes, privacy rules and creative-output goals.
2. Added the dedicated private raw-media design around optional production binding `CAIP_PRIVATE_MEDIA_BUCKET` while retaining `PRODUCT_MEDIA_BUCKET` for reviewed public/product media.
3. Added D1 settings, upload-session, upload-file and upload-part tables so metadata/state stays in D1 and large binary files stay in R2.
4. Added deterministic generated object keys under `projects/{creative_project_id}/raw/*` instead of using personal/customer names as storage authority.
5. Added supported image/video/audio validation and Devil n Dove-specific media roles: before/during/after/material/tool/process/mistake/repair/finished product/packaging/narration/B-roll/reference.
6. Added adaptive multipart sizing with a 32 MiB default, conservative parallelism and R2 part-count/size safety boundaries.
7. Added authenticated same-origin multipart initiation, per-part upload, ETag recording, completion verification and unfinished-upload abort.
8. Added interruption recovery so completed R2 parts remain recorded; the UI explicitly explains that a local file may need reselection after a full browser restart.
9. Added private raw-original immutability: completed raw uploads have no intake delete/overwrite control and transformations must target new derivative namespaces.
10. Added private `media_assets` + CAIP `creative_assets` registration after verified R2 completion with no public URL.
11. Added CAIP technical observation evidence for completed private uploads and updated R2 probe/review resolution so private assets use the private binding.
12. Added planned metadata/thumbnail/proxy/frame/audio/transcript jobs while retaining `not_configured` provider status—no false claims that processing ran.
13. Added governance editing for privacy/consent/rights and review-only public-promotion requests that create no public copy.
14. Extended portable CAIP manifests with sanitized private-intake sessions/files/jobs/promotion requests while excluding raw R2 multipart upload IDs.
15. Added responsive `/admin/creative-assets/` private-media UI with drag/drop, batches, per-file progress, pause/resume/retry, duplicate warnings, offline copy and a visual hero.
16. Removed request-time CAIP schema creation from retained intelligence/operations helpers; Build 241 migration now owns installation.
17. Synchronized `database_build241_caip_large_media_intake.sql`, byte-identical current-pass SQL and all three aggregate schema files, including an idempotent shared `media_assets` dependency for fresh/scoped aggregates.
18. Added the 21st Operational Continuity workstream and 46th Startup gate with twelve production tests for private R2, recovery, immutability, secure review, processing honesty and promotion boundaries.
19. Added CAIP unit/integration regression, Build 241 public-page audit and full `/assets/` reference audit. Current static SEO result is 36/36 public pages passed with one H1 and zero missing local assets.
20. Rewrote CAIP storage/ingestion/governance/API/reliability/roadmap/testing documents and consolidated current cross-project direction back to `AI_HANDOFF.md` + this file.

## Retained Build 240 foundation

Operational Continuity remains active with production evidence cases, idempotency claims, packaging inventory reservations, verified formula links, packaging release locks/prepress checks, provider/notification reconciliation, mobile evidence recovery, deployed-asset checks, product media roles, support history, accounting close checklist, controlled batch approvals, local SEO observations, public-page audit records, route fallback policies and seven mobile operations cards.

Build 241 adds one CAIP workstream rather than duplicating these authorities, bringing active workstreams to 21.

## Current position

Devil n Dove now has broad storefront/catalog, inventory, orders/payments/refunds, packaging, Creative Process, CAIP, Content Studio, publication governance, visual evidence, SEO operations, launch control and accounting/support continuity foundations.

Build 243 specifically changes the production-read posture: Inventory Operations no longer assumes every component may independently reload heavyweight catalog data or repair schema during a request. Critical admin reads are deduplicated/bounded, temporary 503 responses can back off to a clearly marked stale browser copy, user-entered inventory data has a local recovery draft, and mutable classifications have one lower-case canonical policy.

Status remains **production-evidence and controlled-opening preparation**. Build 243 should materially reduce self-inflicted Worker/D1 pressure, but only deployed Cloudflare observability can prove whether any remaining 503 originates from Worker CPU/memory, D1 overload, networking or another route.

## Known gaps and risks

- Build 243 requires a production D1 backup and one migration run after Build 241; deploying code that assumes current inventory columns before the migration can produce `migration_required` responses.
- The case cleanup intentionally normalizes controlled classifications only. Human-facing names, supplier data, URLs, ASIN/SKUs, order numbers, currencies and notes remain case-preserving.
- Request deduplication/backoff lowers application-created pressure but cannot remove Cloudflare platform limits; capture Ray IDs and Workers/D1 observability for any remaining 503 cluster.
- Stale-browser fallback is read-only continuity evidence, not database truth; writes still require a live successful JSON response.
- The broader repository still contains historical routes with request-time schema helpers outside the Inventory Operations critical path; retire them incrementally as those areas are touched.
- `CAIP_PRIVATE_MEDIA_BUCKET` must be created/bound and kept private before raw-media production evidence can close.
- Direct browser→R2 multipart signing, proxy/thumbnail/frame/transcript providers and reviewed public-promotion execution remain future CAIP work.
- Payment webhook exact-once/refund/concurrency, transactional email, restore rehearsal and production login/session evidence remain open.
- Soap formula/INCI/bilingual and physical print/wrap proof, plus candle-top dimensions/material/laser proof, remain product-specific launch evidence.
- Exact product photography remains required where a launch/evidence role calls for the real item; representative imagery cannot close that gate. Mutable exact-image evidence remains managed through `/admin/image-manifest/`.
- First-page local Google placement cannot be guaranteed; relevance, distance and prominence must be measured rather than promised.

## Next 20 steps after Build 243

### P0 — deploy, prove and measure the resilience repair

1. Back up production D1, confirm `build241_caip_large_media_intake`, apply `database_build243_inventory_resilience_case_normalization.sql` once, and verify ledger key `build243_inventory_resilience_case_normalization`.
2. Run a post-migration duplicate audit on `site_item_inventory` and catalog option sets; confirm active case-only duplicates are gone and inactive merge-history rows remain traceable.
3. Deploy Build 243, hard refresh, and run Inventory Operations from cold load while capturing the Network panel; confirm one bootstrap/resource search and one inventory list rather than repeated startup storms.
4. Repeat Amazon URL → metadata → manual inventory save for several items, including a deliberately interrupted/failed request, and verify the browser draft survives.
5. Use Cloudflare Workers/D1 observability during a sustained inventory-entry session; correlate any 5xx with Ray ID and distinguish Worker CPU/memory, D1 overload and application exceptions.
6. Add an Operational Continuity metric/view for endpoint duration, retry count, stale-fallback usage and 5xx frequency on the highest-value admin APIs.
7. Add server-side pagination/cursoring to Site Inventory and Product Resources before row counts make even bounded 300–600 item reads unnecessarily large.
8. Add an explicit lightweight Inventory Operations bootstrap endpoint only if measured traces show remaining independent reference-data calls are still a material cost.
9. Remove request-time schema installers from Amazon import/review and the next most-used admin routes, moving their prerequisites into a numbered migration plus migration-required fallback.
10. Add case-insensitive duplicate prevention to supplier/catalog import and bulk-update paths before data reaches `site_item_inventory`.

### P1 — inventory quality, CAIP and production evidence

11. Add a D1-backed website-media-library intake that catalogs `PRODUCT_MEDIA_BUCKET/uploads/website-library/`, thumbnails it and lets an admin assign page/product/gallery roles without manual URLs.
12. Add optional duplicate-image fingerprinting/metadata checks for the public media library, keeping exact product evidence separate from representative media.
13. Complete production login/session evidence while deliberately exercising temporary 503 behavior and confirming a valid cached session is not destructively cleared.
14. Create/verify the private CAIP R2 binding and run the real image + large MOV/MP4 interrupted/resumed upload gate.
15. Build the short-lived direct browser→private-R2 multipart signing/CORS adapter while retaining Worker-streamed multipart as a bounded fallback.
16. Implement the first real CAIP processing adapter—thumbnail + proxy/frame extraction—with idempotency, retries, checksums, cost caps and honest provider-result records.
17. Prove Stripe signed webhook, duplicate-delivery rejection and exact-once order/payment/inventory settlement, including partial/full refund reconciliation.
18. Complete transactional order/receipt/refund/fulfilment email provider delivery, retry and failure evidence.
19. Finish exact launch-product photography plus soap label/print and candle-top/laser physical proofs required by Startup Readiness.
20. Run D1/R2/config restore rehearsal and one paid fulfilment plus separate refund recovery, retaining non-secret evidence before widening launch traffic.

## After those twenty

Prioritize transcription/timecodes, reviewed scene/story analysis, mobile camera-first project capture, Content Studio auto-packaging, public-promotion execution with rights revalidation, provider publication/result reconciliation, project storage/processing cost, retention/archive manifests, deeper accounting automation and progressively richer automated content without weakening evidence or review boundaries.

## SEO/local-search direction each pass

Run a public audit on every pass: one H1, concise distinctive title, useful description, canonical, crawlable descriptive links, relevant image/alt text, visible/structured fact agreement, mobile parity and no thin/duplicate indexable pages. Use natural Ontario/Southern Ontario/service language only where it matches a real offering. Maintain useful local/service pages, complete Business Profile facts/photos/services/hours and measure Search Console/Business Profile/local conversions rather than guessing rankings.

Google first-page placement is a goal, not a guarantee. Local ranking depends heavily on relevance, distance and prominence; distance cannot be engineered away.
