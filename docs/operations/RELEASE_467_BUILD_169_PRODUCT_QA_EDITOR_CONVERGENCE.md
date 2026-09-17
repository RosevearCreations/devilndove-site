# Release 467 Build 169 — Product QA / Editor Convergence

## Baseline

Build 169 starts from the fully GREEN Build 168 Development/Production checkpoint at exact SHA `7d41cd909673a7ebcd80444b4362ae2bd4406478`.

## Purpose

Continue the Product administration/editor repair sequence while reducing avoidable Cloudflare D1 work and retiring legacy Product QA behavior that mutated schema/history from a GET request.

## Changes

- Adds a dedicated **QA** tab to the current single-Product editor.
- Opening QA performs **zero D1 reads**. QA runs only when an administrator explicitly presses **Run QA**.
- QA authority is bounded to the selected Product + SEO row and at most two Product image rows, which is sufficient to prove image presence and mini-gallery depth without loading a full gallery.
- `/api/admin/product-publish-qa` now uses the existing admin route-guard context rather than performing a second administrator lookup.
- The QA GET path is read-only: no `CREATE TABLE`, no `CREATE INDEX`, and no automatic `INSERT` into QA history.
- Catalog-wide QA reads are rejected by this endpoint; a valid `product_id` is required except for explicit read-only history retrieval.
- QA issue actions now target the dedicated Product Editor tabs or the Product Image Editor rather than the retired all-in-one `/admin/catalog/` editor.
- Same-editor fixes switch tabs locally and focus the relevant field, avoiding another Product reload and another D1 authority read.
- Product Save invalidates the displayed QA result but does not automatically rerun QA.
- No timers, autosave, hidden retries, QA-on-open, catalog scans or R2 listing were added.

## D1 / mutation boundary

This is a schema-free code build. There is no D1 business-data migration, Product mutation from QA, QA-history mutation from GET, R2 mutation/listing, provider execution, payment/refund mutation or accounting mutation.

Existing explicit Product Save behavior remains unchanged and server-authoritative.

## Acceptance

Build 169 must pass:

- `scripts/release467_build169_gate.py`
- retained Build 168 low-read Product handoff proof
- retained Build 166 Product editing/image stabilization proof
- JavaScript syntax checks
- exact-head System Gate and Development Preview
- Current Application Quality Proof
- I.T. Admin Runtime Proof
- Repository Branch Hygiene
- retained authenticated Product browser regression proof

Promotion to `main` is non-force only after exact Development GREEN. Production then requires the exact Production Pages deployment, Product route/browser proofs and Production Live Resource Integrity proof before Build 169 may be called GREEN.
