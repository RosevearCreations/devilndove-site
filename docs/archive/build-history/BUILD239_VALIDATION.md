# Build 239 Validation

## Automated results

1. Repository `/assets/...` reference scan — **PASS**: zero missing asset files.
2. Public page static H1/image-alt audit — **PASS** across the 18 audited routes.
3. `scripts/build239_public_visual_test.py` — **PASS**: 18 routes and seven item-keyed local representative fallbacks.
4. Chromium desktop/mobile audit — **PASS**: 36 route/viewport checks at 1440×1000 and 390×844.
   - one H1 on every audited route;
   - zero document-level horizontal overflow;
   - zero broken images;
   - zero missing image alternative text;
   - Gallery and Creations safely exposed seven visibly labelled representative previews when remote originals were unavailable during the local audit.
5. `scripts/predeploy_sanity_check.py` — **PASS**: 108 pages, zero issues.
6. `scripts/deployment_preflight_static_check.py` — **READY**: zero blockers and zero warnings.
7. `scripts/dark_theme_regression_check.py` — **PASS**.
8. `scripts/build235_creative_readiness_test.mjs` — **PASS** with service-worker shell v17.
9. `node --check sw.js` — **PASS**.
10. Release package manifest generation — **PASS**: `data/site/release-package-manifest.json` generated for Build 239.

The browser audit summary is retained in `data/site/build239-public-browser-audit.json`. Route-by-route findings and visual decisions are documented in `PUBLIC_VISUAL_AUDIT_BUILD239.md`.

## Manual deployed checks still required

- Confirm Cloudflare Pages Functions and D1-backed product/gallery APIs after deployment.
- Confirm the R2 original item images load in production and that the local representative fallbacks appear only when needed.
- Hard-refresh the deployed site and confirm service-worker shell v17 replaces the earlier cache.
- Complete authentication/session, payments/refunds, transactional email and social-provider permission evidence.
- Complete physical soap/candle packaging and laser/print proof.
- Replace representative preview imagery with exact item photography whenever approved product-specific photographs become available.

## Packaging note

The distributable ZIP and its SHA-256 checksum are generated only after the repository files and release manifest are finalized. The checksum is delivered beside the ZIP to avoid a circular checksum change inside the archive itself.
