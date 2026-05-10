# AI Context — Fresh Handoff

Current sync: 2026-05-10 cleanup/refoundation pass.

## What just happened
- Archived old Markdown into `/archive/markdown-snapshot-2026-05-10/`.
- Moved retired root docs into `/archive/retired-markdown/`.
- Archived old current-pass SQL into `/archive/sql/`.
- Reset `database_upgrade_current_pass.sql` for the next migration batch.
- Removed duplicate/stale API, data, movie, and supply files from active build.
- Updated code paths so active fallbacks no longer point to removed duplicate folders.
- Fixed supplies health duplicate-report paths.
- Fixed malformed admin Movies footer HTML.

## Current priorities
1. Backend accounting maturity.
2. Safer D1 migration workflow.
3. Reconciliation and payment application.
4. Period close and accountant export.
5. Product/catalog/media migration from JSON bridges to D1.
6. Mobile admin quick actions.
7. SEO/local landing page expansion.

## Do not restore
- Root-level duplicate API `.js` files.
- `/data/data/` nested duplicate exports.
- `/assets/movies/` duplicate movie JSON.
- Duplicate supply data files under `/supplies/`.

## Keep doing
- One clear H1 per exposed page.
- Markdown and schema updates every pass.
- CSS drift checks every pass.
- Clear local SEO wording every pass.
