# Release 467 Build 633 — Product Form Guided Validation & Mobile Entry Polish

## Purpose

Make ordinary Product entry easier without changing the canonical Product/price schema, server validation, Etsy/Meta authority or the Build 632 uncertain-save lock. The owner still explicitly selects **Save Product**; there is no background save or external channel dispatch.

## Operator journey

1. Open the saved or new Product Editor and use the four normal areas: Details, Recipe, Photos, Destinations.
2. Under Details, enter Product name and category, then a CAD price. The inline help explains which facts are required for local Save and which compare-at price is optional. Free ($0.00) still needs the existing explicit confirmation.
3. On a missing required field or invalid CAD amount, Save does not send a Product POST. The Details area is shown, the affected input is outlined and focused, and the inline hint explains what to correct. When the field becomes valid, its error outline and message clear.
4. On a phone-sized viewport (600px or narrower), the four area buttons form a 2×2 touch-friendly grid. Form controls have at least 46px height and 16px fonts; the Save button and confirmation review remain reachable without horizontal clipping.

## Security boundaries

- The existing HTML `required` rules for name/category and the Product currency format are used. The inline guide adds no server requirement, bypass, or request-time schema mutation.
- Native HTML invalid events are handled in the capture phase so an invalid control shows the same owner-friendly guidance even when the browser blocks the submit event.
- Validation uses only already-entered browser values. There is no validation endpoint, extra D1/R2 read, telemetry, storage, provider API, or automatic submission.
- Build 632's saved/unsaved/uncertain states, one-post hold, source readback and explicit recovery remain untouched. Etsy/Meta publication, customer messaging and physical-product approval still need their separate authority.
- Existing single H1, four Product sections, source assets, owner sign-off and optional advanced controls are preserved.

## Evidence and release gates

- `node --test scripts/release467_build633_product_guided_entry.test.mjs`: static accessible labels, mobile layout, required-field focus, invalid CAD/optional compare-at prices, native invalid event with zero POST.
- `node --test scripts/release467_build632_product_save_confidence.test.mjs`: previous save/uncertain-write regression retained.
- `node --check public/js/admin-product-editor-v163.js`: current syntax.
- `node scripts/release467_build556_admin_interface_inventory.mjs --check`: deterministic 152-route inventory byte-length pin, decisions unchanged.
- `python3 scripts/release465_performance_budget_gate.py`, `python3 scripts/current_application_quality_gate.py`, and all protected `dev`/`main` security, source, deployment and live-resource checks must pass.

### Explicit source-budget review

The Build 632 source baseline was 18,421,252 bytes. After this one-page and existing-script improvement, the runtime has 18,425,504 bytes (+4,252 bytes). `max_runtime_source_bytes` is explicitly raised from 18,422,000 to 18,426,500 (+4,500 bytes), retaining the previous headroom and keeping every per-file, file-count, inline-data and fail-closed rule untouched.

Static/VM tests are not an owner-run smartphone visual acceptance or live provider trial. The production release proves the deployed code, not an owner decision.
