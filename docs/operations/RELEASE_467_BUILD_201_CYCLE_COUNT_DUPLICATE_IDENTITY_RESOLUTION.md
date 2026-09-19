# Release 467 Build 201 — Cycle Count & Duplicate Identity Resolution + Creation Image Edit

## Goal

Provide safe, operator-driven cycle-count and duplicate-identity work while fixing the owner-reported Creations preview gap where dynamic creation cards showed Representative preview fallback images but offered no exact per-card image edit action.

## Exact starting boundary

- Build 200 Development: `9ecdc7f864bdf7260b297285bfcf480d4ed66cae`.
- Build 200 Production `main`: `b07e020fa23668b9689565fd7c16f36ef12f0a21`.
- Exact Build 200 source tree: `4862d59b8d247c820b061ab1fe09e4afa104e0a0`.
- Build 200 Development: 24/24 SUCCESS.
- Build 200 Production: 23/23 SUCCESS.
- Build 200 supplier/source proof: 3,879 provider-metered D1 rows read / 12,500.
- `dev` was synchronized non-force to the exact Build 200 Production SHA before Build 201 began.

## Planned Build 201 Inventory scope

- Keep the physical-count authority explicit, audited and concurrency-protected.
- Make the count-due queue and manual next-count navigation obvious.
- Keep duplicate identity evidence bounded and read-only until Full Edit is deliberately opened.
- Add a direct duplicate-identity queue and manual next-duplicate navigation.
- No automatic duplicate merge.
- No automatic count.
- No background stock rewrite.
- A deliberately saved physical count may update on-hand stock through the existing audited physical-count authority; merely opening/navigating the queue never does.
- Existing Build 244 classification consolidation remains the mutation authority when an operator deliberately corrects a Tool/Supply classification in Full Edit.

## Owner-requested Creations image acceptance

The reported page is `/creations/`. Its cards are dynamic creation catalog records, not static Media Studio page slots.

Build 201 therefore adds a specialist Creation Image Editor instead of creating fake static slots:

- `/api/creations` exposes the exact `catalog_item_id` and `source_key` when a live creation row is available.
- Each dynamic creation card image carries that exact identity.
- Only an authenticated admin preview with **Editing ON** receives an inline **Edit image** action.
- Edit image opens `/admin/creation-media/` for the exact creation.
- The editor shows the current creation image plus a bounded managed public-media library.
- The operator may choose an existing managed image or upload a new image with `upload_scope=creation`.
- Uploads are not attached to a Product.
- Assignment is explicit and stale-safe using the creation's expected `updated_at`.
- The write is limited to that creation row's `catalog_items.image_url`.
- The selected managed asset is re-read and verified before the creation update is accepted.
- Product, Inventory, Tool and Supply media are rejected by the creation authority.
- Media Studio archive/delete checks include creation-card use, so an actively used creation image cannot be removed from the managed library.
- When a card exists only in JSON fallback and no live creation catalog row can be resolved, editing fails closed with a catalog-recovery message rather than mutating the fallback JSON.

## D1 budget

The exact Development Build 201 proof is read-only and covers:

- active Inventory rows;
- physical count due / never-counted / stale-count totals;
- duplicate Tool/Supply identity rows and duplicate keys;
- live creation catalog rows and missing creation-image rows.

Provider-metered rows read must be **<= 12,500**. The retained 20,000 hard ceiling is not raised. If the Build 201 proof exceeds 12,500, optimize the query rather than increasing the limit.

## Safety boundary

No request-time DDL, no automatic duplicate merge, no automatic physical count, no implicit stock correction, no Product/Product-image mutation, no Inventory mutation from the Creation Image Editor, no bucket-wide R2 listing, no R2 delete from the creation assignment endpoint, no provider scraping, no purchase/reorder action, no payment execution and no Production business-data copy.

Production promotion remains code-only through the existing zero-D1 path.

## Acceptance

Build 201 passes only when an operator can manually move through count-due records, deliberately save an audited count, inspect duplicate-group evidence before Full Edit, manually advance duplicate records, and—on the Creations page—turn Editing ON and use **Edit image** on the exact creation card to choose/upload and explicitly verify a replacement image.

Build 202 — Catalog Reference & Media Reconciliation — remains next after Build 201 is fully GREEN.
