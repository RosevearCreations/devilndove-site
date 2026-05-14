# Known Gaps and Risks — Fresh Active List

Current sync: 2026-05-10 cleanup pass.

## Highest-priority gaps
1. Accounting workflows are still review-first, not a finished tax-filing system.
2. Statement imports need real provider sample files to tune mapping rules.
3. Reconciliation needs stronger matching confidence and manual review workflows.
4. Payment application needs tighter links between orders, deposits, processor payouts, fees, refunds, gift cards, and journal entries.
5. Period close needs lock/reopen controls with audit history.
6. Accountant export needs one package that combines ledgers, statements, taxes, attachments, and unresolved review notes.
7. Some catalog areas still use JSON as a bridge while D1 becomes the long-term source of truth.
8. Product variants/options are not complete enough for a full ecommerce app.
9. Media management still needs retire/replace/broken-link lifecycle controls.
10. Public SEO needs more service/location/product-intent landing pages and regular title/meta checks.

## Cleanup risks from this pass
- Removed files were duplicates or stale fallbacks based on current references. If an old direct URL was bookmarked, it may no longer exist.
- The previous `database_upgrade_current_pass.sql` is archived, not active. New migrations must be added to the fresh file.
- The app now relies on `/functions/api/` as the only active API code path.
- Active supply and movie data paths were simplified, so future code should not reintroduce `/data/data/` or `/assets/movies/` fallbacks.

## Guardrails
- Keep one H1 per exposed HTML page.
- Update Markdown and schema files on every code pass.
- Prefer D1 for authoritative operational data.
- Keep JSON only as fallback, seed, export, or static catalog bridge until migrated.
- Do not promise accountant/tax filing readiness until reconciliation, close, tax review, and export validation are complete.


## Amazon Purchase Import Risks — Added 2026-05-11

- Amazon order history contains mixed household/business purchases, so rows must not be auto-posted.
- Fuzzy matching can produce plausible but wrong results when item names are generic.
- High-confidence rows are still marked for review before production database updates.
- The import package intentionally excludes account user email, receiver email, and seller address.
- Production update logic still needs an admin review workflow and approval gate.


## Private Import Data Safety Note — 2026-05-11

Amazon transaction CSVs and review spreadsheets are **not** stored inside the deployable website tree because `/data/` assets may become publicly reachable after Cloudflare Pages deployment. Keep the generated Amazon import package private and load approved rows into the database through an admin/import workflow instead.
