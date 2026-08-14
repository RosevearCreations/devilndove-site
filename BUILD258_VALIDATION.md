# Build 258 Validation — CSP-safe Media Studio Inspection

## Reported production symptom

Browser console: Media Studio page inspection was blocked by the site Content Security Policy because the scanner navigated a hidden iframe to the live public page while the site globally sends `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

## Resolution

The scanner no longer embeds the live page. It fetches the selected same-origin static HTML, removes executable/embedded/form content, inserts a base URL for stylesheet/image resolution, and inspects a hidden sandboxed `srcdoc` copy with scripts disabled. The global anti-framing policy remains unchanged.

## Focused validation

- Build 258 CSP-safe inspection regression: **14/14 PASS**
- Build 257 static-directory/scope regression: **37/37 PASS**
- Build 256 Media/Packaging regression: **52/52 PASS**
- Build 255 Packaging Material Library regression: **38/38 PASS**
- Build 254 Startup/Smoke regression: **16/16 PASS**
- Build 253 linked-item/reset regression: **18/18 PASS**
- Build 252 inventory runtime regression: **10/10 PASS**
- Build 251 Product Editor image regression: **9/9 PASS**
- Build 250 product media/per-use regression: **14/14 PASS**
- Build 249 kit/component regression: **25/25 PASS**
- Public page audit: **36/36 PASS, 0 warnings**
- Asset reference audit: **121/121 present**

## Security assertions

- `_headers` still contains `X-Frame-Options: DENY`.
- `_headers` still contains CSP `frame-ancestors 'none'`.
- Scanner does not use `frame.src = path`.
- Sanitized inspection iframe does not allow scripts.
- Fetched HTML is capped at 2 MB.
- Existing route/product/inventory/tool/supply exclusions remain enforced by Build 257.

## Database

No Build 258 D1 migration exists or is required. `database_upgrade_current_pass.sql` remains byte-identical to `database_build256_media_content_studio.sql`.
