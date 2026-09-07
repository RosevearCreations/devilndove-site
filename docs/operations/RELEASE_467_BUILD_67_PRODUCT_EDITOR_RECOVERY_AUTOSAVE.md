# Release 467 Build 67 — Product Editor Recovery & Autosave

Build 67 starts from the exact fully-green Build 66 Production/Development source boundary:

- base SHA: `697c57db3497f502b4fc04e0e6c3a9127e7fa1fb`
- base tree: `b2a2e3ca0d2285a3875d2d523d3941823144da08`
- canonical D1 migration authority: `0001`–`0004` only

## Purpose

Build 67 hardens the shared Product Editor so a slow secondary service, accidental navigation, browser reload, autosave failure, or another editor changing the same Product cannot silently destroy the operator's work.

The build keeps the existing Product API authority and adds a small recovery/preflight layer rather than creating a second Product data model.

## Product-scoped browser recovery

`public/js/admin-product-editor-recovery.js` stores unsaved form state under a Product-scoped browser key:

`dd_admin_product_editor_recovery_v2:<product-id|new>`

This prevents one Product's recovery copy from being applied to a different Product. New drafts use the `new` slot until the first Product id is created, then recovery follows that Product id.

The Editor exposes explicit controls to:

- recover local edits;
- discard the local recovery copy;
- reload the current live Product after a stale-copy conflict.

Recovery stores editable form values plus the Product version that was current when those edits began. It does not store files, credentials, authentication tokens, or provider secrets.

## Unsaved-change protection

Build 67 tracks a stable editor fingerprint after Product load/save. Input and change events mark the editor dirty only when its current form state differs from that accepted baseline.

While dirty:

- a browser recovery copy is refreshed with a short debounce;
- browser/tab unload activates the native unsaved-change warning;
- loading another Product, clearing the editor, or cancelling an edit requires explicit confirmation;
- choosing to switch preserves the local recovery copy before the existing Product-load path continues.

## Stale-copy handling

`GET /api/admin/product-save-preflight?product_id=...` performs one primary-key Product row read and returns only the version projection used by the editor guard. It performs no joins, counts, PRAGMA scans, R2 reads, pricing reads, provider calls, or writes.

The Product Editor wraps the existing authenticated `apiFetch` transport for `/api/admin/update-product` only:

1. verify the live Product version;
2. compare it with the version that the current editor copy was based on;
3. if they differ, fail closed with `stale_product_copy` and preserve browser recovery;
4. if the preflight itself is unavailable, fail closed with `product_preflight_unavailable` and preserve browser recovery;
5. only forward the existing Product update when the version check passes.

The same guard applies to manual Update Product and draft autosave calls, so autosave cannot silently overwrite a Product that changed after this editor copy was loaded.

Build 67 does not claim a database transaction-level compare-and-swap lock; it is an editor-side stale-copy preflight using the canonical current Product row. A later schema-neutral or schema-backed revision token may strengthen this further if concurrent multi-operator editing becomes common.

## Secondary services never block editing authority

The canonical Product detail response remains the primary edit authority. As soon as `/api/admin/product-detail` returns successfully, Build 67 primes the form's Product id and edit mode before optional pricing guidance and other secondary Product services finish their own work.

Pricing guidance, replay queues, media coaching, social shortcuts, and other secondary systems remain useful enhancements, but they do not own Product load/save authority and cannot turn a successfully loaded Product back into a create-mode form.

## Save completion

For successful Product updates, Build 67 records the returned Product version as the new baseline.

If the form did not change while the request was in flight, local recovery is cleared. If newer edits were made while the save was running, the successful server save becomes the baseline while the newer browser edits remain marked dirty and protected for the next autosave/manual save.

## D1 read budget

The stale-copy preflight is intentionally one Product primary-key read:

- Product rows read per preflight: **1**
- secondary-service rows read: **0**
- counts/scans: **0**
- writes: **0**

No preflight polling timer is added. A recheck occurs only before Product update/autosave, when a dirty editor becomes visible again, or when the operator explicitly calls the recovery API's verify method.

## Authority boundary

Build 67 is schema-neutral:

- canonical D1 migration stream: unchanged (`0001`–`0004`)
- D1 business-data mutation added by Build 67: **NONE**
- R2 mutation added by Build 67: **NONE**
- provider execution/publication added by Build 67: **NONE**
- Product write authority: existing `/api/admin/update-product`
- stale-copy preflight: read-only
- Production promotion: only after the exact Development SHA is fully green

## Acceptance

Build 67 is accepted only when the exact Development SHA passes the current System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development deployment/smoke acceptance, Build 62–66 carried-forward contracts, and the Build 67 Product Editor Recovery & Autosave source contract.

Production may then be promoted only by non-force fast-forward of that exact fully-green Development commit.

## Next planned build

After Build 67 is fully green and promoted, continue with **Build 68 — Catalog Options Authority**.
