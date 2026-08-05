# Build 206 Validation Notes

## Completed automated checks

- `node --check` passed for all Build 206 modified browser scripts and Pages Function modules.
- Tax normalization smoke test passed for `0.13`, `13`, `tax_rate=0 + rate_percent=13`, `5%`, and `0%` cases.
- CSS brace balance is zero.
- 90 HTML files were scanned: no file contains more than one `<h1` marker.
- Catalog and Catalog Media pages retain exactly one H1 each.
- Confirmed the new product-media context script, placeholder SVG, featured-image source hint, and picker filter controls are referenced by their HTML pages.

## Manual deployed checks still required

These require the real Cloudflare Pages / D1 / R2 environment and an admin session:

1. Featured image fallback for an actual `media_assets`-only product.
2. Product save/reopen persistence of the resolved featured URL.
3. Tax labels against the live D1 tax classes.
4. Media workspace context synchronization across every child panel.
5. CAIP product-ID selection against a live linked creative project.
6. Real mobile/touch layout and weak-network behavior.
7. Separate login `POST /api/auth/login` 500 capture using safe response/log details.
