# Build 258 Changed Files — CSP-safe Media Studio page inspection

## Changed

- `public/js/admin-media-content-studio.js`
  - Replaced live-page iframe navigation with same-origin HTML fetch + sanitized script-free `srcdoc` inspection.
  - Removes scripts, forms, nested frames, objects/embeds and noscript content before inspection.
  - Preserves linked CSS/image resolution with a `<base>` URL.
  - Caps fetched page HTML at 2 MB and keeps existing product/inventory/tool/supply exclusions.
  - Cache-bumps the Media Studio page directory fetch to `v=258`.
- `admin/media-content-studio/index.html`
  - Cache-bumps Media Studio JS/CSS to `v=258`.
  - Clarifies that scanning uses a script-free read-only copy and does not embed the live page.
- `public/data/media-content-page-catalog.json`
  - Version metadata advanced to Build 258; curated page scope is unchanged.
- `scripts/build258_media_csp_safe_inspection_regression.py`
  - New focused regression for CSP-safe inspection and unchanged anti-framing headers.
- `scripts/build257_media_static_scope_regression.py`
  - Historical compatibility assertions accept the newer Build 258 cache tag.
- `AI_HANDOFF.md` / `PROJECT_STATUS_AND_ROADMAP.md`
  - Build 258 becomes current release; D1 migration boundary remains Build 256.
- `docs/archive/build-history/BUILD257_*`
  - Prior release notes archived.

## Not changed

- `_headers` remains strict: `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`.
- No D1 schema or migration changes.
- Product, inventory, supply and tool exclusion rules remain unchanged.
- Public Media Studio manifest/runtime behavior remains unchanged.
