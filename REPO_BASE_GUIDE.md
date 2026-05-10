# Repo Base Guide — Active Map

Current sync: 2026-05-10 cleanup pass.

## Active top-level areas
- `/` public static pages and route folders.
- `/admin/` admin department HTML pages only.
- `/functions/api/` Cloudflare Pages Functions backend.
- `/public/js/` browser-side page/admin/member scripts.
- `/css/styles.css` shared styling.
- `/data/` approved JSON bridges and templates.
- `/archive/` retired docs and archived migration snapshots.

## Important data paths
- `/data/itemsforsale/itemsforsale_items_master.json`
- `/data/movies/movie_catalog_enriched.v2.json`
- `/data/supplies/supplies_items_master.json`
- `/data/toolshed/toolshed_items_master.json`
- `/data/site/featured-items.json`
- `/data/site/social-feed.json`
- `/data/finished_products_import_template.csv`

## Removed active clutter
Old duplicate API files outside `/functions/api/`, nested duplicate `/data/data/`, duplicate `/assets/movies/`, and duplicate supply data under `/supplies/` were removed from active use.

## Future structure goal
Keep public pages light, move operational state into D1, keep admin work grouped by department, and keep every pass documented with matching schema notes.
