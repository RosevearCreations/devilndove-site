# Build 211 Validation

## Social preflight

1. Open `/admin/social-publishing/` while signed in as admin.
2. Confirm Platform Preview & Media Preflight appears before the automation settings.
3. Test Instagram with a public `.jpg` URL. Confirm dimensions and aspect ratio are reported.
4. Test a private/broken image URL. Confirm the tool reports an access failure.
5. Test X with more than 280 characters. Confirm it reports a caption-length failure.
6. Confirm no queue item, product, Content Studio, CAIP, consent, or Release Board record changes.

## Mobile menu

1. Test at 360px, 390px, 430px, and 768px widths.
2. Tap Menu. Confirm the navigation appears as a dropdown panel, not an inline list.
3. Open Essentials, then Shop & Browse. Confirm Essentials closes.
4. Confirm the panel scrolls internally and page content does not scroll behind it.
5. Confirm Close, Escape, and selecting a link close the panel.

## Regression

- Run JavaScript syntax checks.
- Confirm one H1 or fewer per HTML page.
- Confirm CSS braces balance.
- Confirm `index.html`, `_routes.json`, `wrangler.toml`, and `functions/` are at archive root.
