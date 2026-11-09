# Devil n Dove Build 659 — Original Product, Media & Dovlin Evidence Desk

**Scope:** A verified Storefront Admin can inspect one actual Product, its saved gallery and media-use annotations, original production runs and finished inventory lots, then record an explicit private source-version-bound owner review. The desk lives at [Admin → Products](/admin/products/) above the regular Product Browser. No automatic read, background scan, inventory correction, publication, marketplace write, safety certification, Master Shell event or completion-percentage calculation is authorized.

## Owner walkthrough

1. In **Admin → Products**, use the Product Browser to find an actual Product ID. Enter that ID under **Finished Product, Media & Dovlin Evidence Desk** and press **Inspect original evidence**. No data is loaded by this new desk on page open.
2. Review the **live Product name, category, status, price and tracked stock**, gallery image/alt-text rows, media-use annotations and consent references, latest bounded production runs and finished-product lots. The display does not silently combine lot quantities with current sellable stock. Any layer with more than 20 records is reported as *bounded/incomplete* and stays on HOLD; missing installed canonical schema returns HOLD rather than guessed data.
3. Open the existing **Product Editor** and **Media Editor** for corrections. Those original workflows own Product changes, inventory and media; the Build 659 desk never adjusts them.
4. Physically inspect the real finished sample if available, consult the actual source rights/permission documents and relevant safety/material documents, then choose what was *personally seen*. A saved image, media annotation, production run, source code or deployed page **does not** constitute independent rights or safety verification.
5. If the Product is Dovlin (or belongs to its collection), enable **Dovlin requirements**. The software flags Dovlin names/SKUs/categories automatically and will not let those Products skip the Dovlin declaration. Compare the physical 8-inch sample only with Ree and Jack's original approved reference assets. **Never change Dovlin's approved character**; approved colour variations alone are permitted. Retain **HOLD** until actual approved art, original physical sample, ages-over-3 suitability and appropriate toy/material/labelling evidence have been checked. This desk does not include those original source files or independently establish Canadian plush/toy compliance.
6. Enter a factual note and next action, acknowledge the no-release boundary and press **Record private owner review**. The receipt is versioned against an SHA-256 digest of the original Product/media/run/lot facts, stored in private `app_settings` and independently audited to `admin_action_audit` where available. An owner may make an explicit *review-only* attestation when every local checkbox/source condition is met; this is **not** independent product approval. All other decisions remain **OWNER_HOLD**.
7. If saving times out or reports an uncertain result, use **Inspect last request key** to find the original receipt. Do not retry blindly. If another Admin changed the journal or any original Product/media/run/lot facts changed, a new inspection is mandatory.

## Review states and outstanding proof

| State | Meaning | Next independent requirement |
| --- | --- | --- |
| `UNREVIEWED` | No Build 659 owner receipt | Physically inspect original Product and documents |
| `OWNER_HOLD` | Required evidence missing or owner chose HOLD | Obtain actual sample, original rights/design/safety evidence and finish any original Product/media corrections |
| `OWNER_ATTESTED_EXTERNAL_ACCEPTANCE_PENDING` | Authenticated owner said they inspected the original evidence, against a matching source version | Independent source proof and separate authorized Product/release acceptance; **not** published or safety certified |
| `STALE_SOURCE_HOLD` | Original Product/media/run/lot data changed after the owner receipt | Inspect the new original facts; do not reuse the previous signoff |

The next Master Shell consumer must independently approve event schemas, source identity, authenticated audience and owner/witness custody before a completed module score or cross-app signal is declared. Build 659 does not send events or change the Build 656 provisional module denominator. The separate customer checkout, carrier and returns acceptance in proposed **Build 660** remains unverified.

## Boundaries and release proof

- Original authorities: `products`, `product_images`, `product_image_annotations`, `product_production_runs`, `product_finished_inventory_lots`; strictly bounded to one Product and 20 rows from each evidence layer, with original total count checks.
- Private review: `app_settings` key `site.admin.product_finish.v659.<product_id>`; compare-and-swap version and exact source-revision check, append-only receipts, original request key, readback and audit. A malicious/stale actor cannot update canonical Products, media, inventory or publish from this endpoint.
- Security: Active Storefront Admin from module authority, same-origin POST, JSON-only actions, no cache, document text only, no HTML injection and no automatic retries.
- Regression: `node --test scripts/release467_build659_product_finish_review.test.mjs` includes role, same-origin, canonical write denial, actual source, incomplete media/lot, Dovlin, concurrent state, idempotency and journal public/HOLD cases. CI includes the gate; production release is GREEN only after protected `main` deployment checks pass independently.
- Runtime housekeeping: unreferenced former `admin-product-draft-checklist.js`, `admin-accounting.js` and `admin-panel-routing.js` are preserved in `docs/operations/historical/` and removed only from the active runtime tree. Their original code was not overwritten.
