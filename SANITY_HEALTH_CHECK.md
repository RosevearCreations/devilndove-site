# Build 206 sanity checkpoint

- Catalog featured media has a read-only three-layer resolver and visible source label.
- Tax rate display is normalized at API and UI boundaries; no D1 rate migration is required.
- Catalog Media has one product-context selector and mobile-first fallback layout.
- CAIP receives optional product context but remains reference-only.
- Outstanding separate incident: login POST 500 needs the safe response/log detail; current D1 `users`/`sessions` schema is already confirmed.

---

# Sanity Health Check — Build 201

## Local static/implementation status

- Build 201 adds CAIP as a reference-only intelligence/control layer between Content Studio and public release/rendering work.
- CAIP stores no duplicate source media and provides no file delete, move, copy, reorder, feature, publish, or automatic permission-elevation mechanism.
- CAIP sync requests are integrated into product-approval, Content Studio creation/refresh, and Content Studio media-review flows. A CAIP sync failure is recorded without rolling back an existing product approval or Content Studio package.
- The CAIP workspace supports desktop/mobile review, asset status/notes, evidence, story segments, policy signals, candidate roles, internal approval, and manifest export.
- Build 201 intentionally uses local deterministic metadata review aids only. No external AI, renderer, platform publisher, signed R2 media transfer, or provider connection is claimed.
- The CAIP seed documents are expanded into the authoritative architecture, schema, storage, governance, ingestion, intelligence, orchestration, API, operations, roadmap, migration, and acceptance design set.

## Local validation completed

- 458 JavaScript files passed `node --check`.
- 48 public HTML files passed the exactly-one-H1 check; the new CAIP admin page has one H1 and is `noindex,nofollow`.
- `css/styles.css` braces are balanced (1,539 opening and 1,539 closing braces).
- Build 199 → Build 200 → Build 201 migrations ran twice in a fresh SQLite test, leaving exactly one ledger row for each build and all nine CAIP tables/indexes present.
- The fresh `database_full_schema.sql` run contains the Build 201 ledger entry and all nine CAIP tables.
- A D1-compatible CAIP runtime test created one project from two source references, generated evidence/segments/recommendations, blocked rights elevation from an upstream needs-review asset, and exported a reference-only/non-publishing manifest.
- `scripts/predeploy_sanity_check.py .` passed: 90 HTML pages checked, 0 issues.
- The service-worker shell cache is now `devilndove-shell-v6`.

## Required deployment proof

- Run Build 201 migration and record the ledger row.
- Prove one product causes exactly one Content Studio and one CAIP project across approval/refresh retries.
- Prove source media rows/URLs/order/featured image remain unchanged before and after CAIP sync/review/manifest/export/internal approval.
- Prove CAIP cannot elevate an upstream needs-review/blocked source to public use.
- Prove CAIP does not publish a public page or platform item after internal approval.
- Inspect Cloudflare logs for Content Studio and CAIP route errors, especially isolated sync-warning records.
- Verify mobile layout/actions, noindex admin pages, visible public H1s, factual content/media schema alignment, and external source URLs on the deployed site.

## Explicit gaps

- No remote technical media probe/hash, derivative generation, private signed access, retention/lifecycle/hold rules, or R2 transfer worker.
- No actual AI vision/transcription/LLM provider execution, prompted content generation, or automated accessibility descriptions.
- No video/thumbnail renderer, output verification, brand templates, disclosure injection, or cost/timeout enforcement.
- No OAuth direct social/YouTube/GBP publishing, publish ledger, platform metrics ingestion, or automated replies.
- No server-rendered per-story public page/sitemap expansion, automatic analytics attribution, or detail-job/custom-order source adapter.


## Build 202 CAIP media-operations note

CAIP now records safe metadata/R2-header observations, immutable future-output plans, and short-lived administrator-bound internal review grants. It still does not create derivatives or publish media; source-media preservation remains mandatory.
