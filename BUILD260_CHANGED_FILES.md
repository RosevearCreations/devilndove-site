# Build 260 Changed Files

## Runtime/API

- `functions/api/admin/media-content-studio.js`
  - split GET into `page`, `media`, and `uses` modes;
  - removed all-in-one parallel bootstrap;
  - removed per-media assignment-count correlation;
  - bounded library results and added keyset pagination;
  - changed caught query/update exceptions from ambiguous 503 to structured 500 JSON so platform 503s are distinguishable.

- `public/js/admin-media-content-studio.js`
  - Home/page selection now loads slots only;
  - media library loads only after **Choose image**;
  - added **Load more site images** keyset paging;
  - selected-image uses load separately;
  - search/filter no longer reload page slots;
  - Build 260 cache bust.

- `admin/media-content-studio/index.html`
  - loads `admin-media-content-studio.js?v=260`.

## Validation / compatibility

- `scripts/build260_media_bootstrap_runtime_regression.py` — new Build 260 focused regression.
- `scripts/build259_media_static_slot_regression.py` — historical cache-bust assertion accepts the newer Build 260 admin bundle while retaining Build 259 feature checks.
- `data/site/build246-public-page-audit.json` — refreshed current audit output.
- `data/site/build246-asset-reference-audit.json` — refreshed current asset-reference output.

## Canonical documentation

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `RELEASE_NOTES.md`

## Database

No Build 260 migration. Current migration remains:

- `database_build259_media_static_slot_catalog.sql`
- `database_upgrade_current_pass.sql` (byte-identical)
