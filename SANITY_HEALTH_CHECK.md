# Sanity Health Check

Current sync: 2026-05-10 cleanup pass.

## Checks to run every pass
1. JavaScript syntax check for every `.js` file.
2. HTML check that every exposed page has exactly one `<h1>`.
3. Missing script/style reference check for all HTML pages.
4. Data-source check for active JSON fallbacks under `/data/`.
5. Schema sync check for main SQL files and the current-pass migration file.
6. CSS drift check on public pages and admin department pages.
7. SEO check for title, description, one clear H1, and locally useful wording.
8. API route check that calls point to `/api/...` backed by `/functions/api/...`.
9. Archive check so retired docs/code are not confused with active files.
10. ZIP integrity check before handoff.

## Current pass focus
- Active API source is `/functions/api/`.
- Active browser scripts are `/public/js/` and `/js/main.js`.
- Active data bridges are `/data/movies/`, `/data/supplies/`, `/data/toolshed/`, `/data/itemsforsale/`, and `/data/site/`.
- `database_upgrade_current_pass.sql` is intentionally clean and ready for the next migration batch.

## Manual browser checks still recommended
- Home, Shop, Gallery, Creations, Tools, Supplies, Movies, Members, Cart, Login, Register.
- Admin dashboard, Accounting, Catalog, Orders, Members, Analytics, Operations, Movies, Mobile admin.
- Statement import, reconciliation exceptions, journal entry review, product creation, product image review, and member login.
