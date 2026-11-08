# Devil n Dove Release 467 — Build 635: Catalog Filtering, Sorting and Image Readiness

## What changes for the operator

1. Open **Admin → Products**. Enter a Product ID, product number, name, SKU, slug or category prefix, then press Search.
2. Optionally choose a category, newest/recently updated/name/price order, or **Missing featured photo**. Sorting is across the matching catalog, **not just the current page**. Use Next/Previous to move through stable keyset pages; revisits reuse the same browser-session result.
3. The Product row states **Featured photo set** or **Featured photo missing** using only authoritative `products.featured_image_url`. When missing, **Recover photo** remains an explicitly triggered single-Product operation. Recovered previews are not silently persisted as featured photos.
4. For actual image descriptions, rights or completeness, open **Images** on the chosen Product. This list does not read the canonical gallery or claim approval. No media is published or uploaded by catalog filters.
5. On narrow phones, each Product is a legible card with large Edit/Images controls. Use **Clear filters** to return to the normal recent Product view, or Refresh for a fresh authorized query.

## Security and low-read contract

- One bounded, read-only `products` SELECT per newly requested page. No joins, gallery scans, role escalation, schema migration, R2 listing, external provider calls, hidden automatic retries or mutations.
- User-provided query/category values use SQL binds, server sort choices are a fixed allowlist, cursor sort and type are validated, and invalid requests return HTTP 400 without issuing SQL. Existing guard context must identify an administrator; otherwise HTTP 401.
- Name sort uses `name COLLATE NOCASE ASC`, price sort uses `price_cents ASC`, recent activity uses `updated_at DESC`; each uses Product ID as a deterministic tie-break. Keyset cursors preserve this order across page boundaries.
- Image status speaks only to the saved featured URL, not the existence, copyright/owner authorization, alt text or channel readiness of a gallery image. Image Editor retains its original permission/approval and save gates.
- File-count budget stays 1,839; measured source bytes 18,439,063 fit the reviewed cap of 18,440,000 (was 18,432,000). No other performance limit changes.
- The historical Build 162 source gate was updated to verify the successor's canonical `/api/product-media` path and explicit constant `MAX_GALLERY_ROWS=12`, rather than obsolete literal text. Its read limits, no-eager-subsystem constraints and all security prohibitions remain enforced.

## Verification

```text
node --test scripts/release467_build635_product_catalog_filters.test.mjs
node scripts/release467_build556_admin_interface_inventory.mjs --check
python3 scripts/current_application_quality_gate.py
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
node --check public/js/admin-products-browser-v162.js
node --check functions/api/admin/product-browser.js
python3 scripts/release467_build162_gate.py
python3 scripts/release467_build170_gate.py
```

Require GREEN protected `dev`, production `main`, Cloudflare Pages and live-resource verification separately before closure.

## Next proposed Build 636

Product Bulk Edit Review & Safe Draft Workflow — preview owner-chosen draft changes across selected Products before explicit confirmation; external marketplace actions remain separate.
