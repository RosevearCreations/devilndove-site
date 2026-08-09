# Build 243 Validation

Validation record for the Inventory Operations pressure/resilience, lower-case classification and contrast pass. This file records local/static/synthetic evidence only; it does not claim a live Cloudflare browser, production Worker-limit, or production D1 load test.

## Automated regression results

- Build 239 public visual regression: **PASS** — 18 routes and 7 item-specific fallback paths retained.
- Build 240 Operational Continuity/schema/Startup/fallback/public SEO regression: **PASS**.
- Build 241 CAIP private-media/schema/immutability/processing/promotion regression: **PASS**.
- Build 242 inventory-create regression: **PASS** — 27 INSERT placeholders/binds retained; JSON/HTML error boundary and runtime incident capture present.
- Build 243 Inventory Operations resilience regression: **PASS** — startup request dedupe, bounded retry/backoff, stale-read fallback, form draft recovery, write protection, safe HTML/JSON handling, and critical-path no-request-time-DDL checks present.
- Build 243 database case audit: **PASS** — 2,436 current database object identifiers checked; 0 mixed-case object identifiers. Controlled classification defaults are lower-case. Human-facing names, URLs, ASINs/SKUs, order numbers and currencies intentionally preserve case.
- Public SEO/static page audit: **PASS** — 36/36 indexable pages passed; 0 warnings; 0 failures; one H1 per audited page.
- Local asset reference audit: **PASS** — 120 `/assets/...` references; 0 missing.
- Predeploy sanity: **PASS** — 109 pages checked; 0 issues.
- Deployment preflight: **READY** — 0 blockers; 0 warnings.
- Final deployment blocker check: **PASS**.
- Dark-theme regression: **PASS**.

## Migration validation

- `database_build243_inventory_resilience_case_normalization.sql` and `database_upgrade_current_pass.sql`: **byte-identical PASS**.
- Build 243 migration applied twice against a fresh in-memory database initialized from `database_full_schema.sql`: **PASS**.
- Repeat-application ledger rows for `build243_inventory_resilience_case_normalization`: **1**.
- Repeat-application lower-case active inventory identity index count: **1**.
- Synthetic case-only inventory duplicate merge: **PASS** — the oldest active inventory identity is retained as canonical, quantities are consolidated, duplicate IDs are retained inactive for audit/history, and the new active identity index prevents future source-type case-only duplicates.
- Aggregate schema scope: `database_full_schema.sql` includes the complete executable Build 243 normalization block. `database_schema.sql` and `database_store_schema.sql` carry the current Build 243 marker/scope note rather than executing Site Inventory statements against aggregates that do not define the complete Site Inventory authority.

## Runtime-pressure changes validated statically

The Inventory Operations critical startup path now uses one-shot loaders and in-flight request coalescing instead of issuing duplicate `product-resources` and `site-item-inventory` calls. Stable GET data can use session cache/stale fallback, temporary read failures use bounded exponential backoff, and writes are never silently retried. The heavy Amazon registry is no longer expanded by the routine Product Resources bootstrap/search path.

The critical Inventory Operations, Product Resources, Inventory Lots and Product Stock read paths no longer run request-time schema DDL/PRAGMA migration work. Some older specialist/import routes elsewhere in the repository still contain historical schema helpers and remain on the ordered follow-up roadmap; Build 243 does not claim repository-wide elimination of every legacy runtime schema helper.

All JavaScript files directly loaded by `/admin/inventory-operations/` use the shared safe response boundary for relevant API calls, so a Cloudflare HTML 503 is surfaced as a temporary service error with status/Ray information rather than being blindly parsed as JSON. Inventory form drafts are preserved locally across temporary failures.

## Lower-case policy

Build 243 lower-cases database object identifiers and controlled classification authorities such as inventory source/category/unit/reuse values and catalog/product classification options. It intentionally does **not** force lower-case onto product/display names, supplier names, notes, URLs, Amazon ASINs, SKUs, external order numbers, currency codes or other case-sensitive/readability-sensitive external values.

## Required deployment evidence

Build 243 is a migration release. The production sequence is:

1. Back up production D1.
2. Confirm the Build 241 CAIP migration ledger entry `build241_caip_large_media_intake` exists and that the earlier Build 241 migration completed successfully.
3. Apply **one** Build 243 migration file: `database_build243_inventory_resilience_case_normalization.sql` (do not also run the byte-identical `database_upgrade_current_pass.sql`).
4. Confirm the ledger entry `build243_inventory_resilience_case_normalization` exists.
5. Deploy the matching Build 243 application code.
6. Hard-refresh/reload so service-worker shell v20 and current scripts/CSS are active.
7. Cold-load `/admin/inventory-operations/`, test Amazon URL preview, manual create/save, searches and list refreshes, and review Cloudflare Workers/D1 observability for any remaining 5xx/Ray IDs.

Production Cloudflare resource-limit behavior can only be proven by the deployed test in step 7. Build 243 materially reduces self-generated request pressure and provides bounded fallbacks, but this local validation does not claim that an external Cloudflare/D1 capacity event can never return a 503.
