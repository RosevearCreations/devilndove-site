# Release 467 Build 632 — Product Editor Save Confidence & Error Recovery

## What changed

The Product Editor already preserved browser drafts, checked server readback and blocked repeat POSTs after uncertain outcomes. However, the large primary Save toolbar could show a generic status while those safeguards were active. Build 632 adds a persistent, accessible status underneath the existing Save controls.

Visible save states:

| State | Meaning and operator action |
| --- | --- |
| New / loaded | A Product has not yet been created, or the verified server copy is loaded with no unsaved edits. |
| Unsaved | Browser edits differ from the loaded copy. Review and click Save Product once. |
| Saving | One explicit Product POST is pending. Wait; no automatic retry. |
| Saved | Product fields and CAD price have the required saved confirmation. Etsy/Meta publication remains separate. |
| Partial | Product was saved, but optional destination preference confirmation is incomplete. Review destination choices separately; do not repeat Product Save. |
| Invalid | Required name, price or policy prerequisites need correction. A verified no-write response is not a completed Product save. |
| Hold | Product write may have committed, or its readback does not match. Use **Review unconfirmed Save** to reach the existing one-GET server comparison, then deliberately keep the server version or restore browser edits. Another Product POST remains blocked. |
| Blocked | Authoritative Product load failed; Save remains blocked until an explicit successful reload. |

The new shortcut only scrolls and focuses the preexisting recovery section. It performs **no** GET, POST, provider call or implicit approval. The underlying review button is an explicit, read-only GET. Statuses use a live region, high-contrast edge and color-independent plain language. Toolbar Save describes that status for assistive technology.

## Preserved security boundaries

- No new endpoints, credentials, tenant/role grants, D1 migration, R2 action or provider dispatch.
- Existing canonical Product create/save routes, price and field readback, browser recovery, uncertain-write lock, and manual owner review remain authoritative.
- The original Product POST is never automatically retried, including after 503, 1102, timeout, stale copy or price-readback mismatch.
- Etsy drafts, Meta Marketplace, soap formula approvals, publication and customer communications remain separately authorized operations.

## Acceptance

- `node --test scripts/release467_build632_product_save_confidence.test.mjs` covers new Product / validation / dirty / pending / confirmed, saved Product / no provider POST, uncertain write lock and review shortcut, destination failure without repeat, and known-no-write correction.
- `node --check public/js/admin-product-editor-v163.js` checks syntax.
- `node scripts/release467_build556_admin_interface_inventory.mjs --check` checks the exact reviewed Admin route source inventory (152 routes, dispositions unchanged).
- `python3 scripts/release465_performance_budget_gate.py` enforces all per-file, file-count and inline-data limits plus bounded source-byte cap growth.
- `python3 scripts/current_application_quality_gate.py` and every protected `dev`/`main` required workflow remain mandatory.

### Explicit source budget review

Build 631's baseline was 18,416,206 runtime bytes. The updated Product Editor page/script measures 18,421,252 runtime bytes (+5,046 bytes). Only `max_runtime_source_bytes` increased from 18,417,000 to 18,422,000 (+5,000 bytes, using 46 bytes of the previous budget's headroom); per-file ceilings, number of runtime source files, inline-data limit, and fail-closed policy are unchanged. No extra request or runtime file was introduced.

The code release does not claim owner visual acceptance on a signed-in device or a genuine Etsy/Meta provider trial. These are distinct from required automated release checks.
