# Release 467 Build 63 — D1 Read-Budget Protection

Source base: `ce44ea5cdeb51430b5fea4145910d8ebb36abfac`  
Base tree: `da1a0dabc9e8c82c8fc4e63c1efd40afcda8649e`

## Purpose

Build 63 reduces the chance that normal admin startup/recovery behaviour burns through Cloudflare D1 daily rows-read quota. It is deliberately schema-neutral and keeps Production business-data ownership unchanged.

This build does **not** invent a live D1 usage counter. Cloudflare provider metering remains the authority for actual rows-read totals. The application now exposes its own read caps, cache windows and recovery contracts so operators can see what the app is designed to do before provider quota is exhausted.

## Changes

### 1. Central read-budget authority

`functions/api/_lib/d1ReadBudget.js` defines the current application-side budgets for the highest-risk Product/admin reads:

- `/api/admin/products` — critical legacy Product rollup; one identical in-flight request and 45-second successful-response reuse in the Product workspace.
- `/api/admin/product-picker` — lightweight keyset picker, 100 default / 150 maximum rows, Product ID descending cursor, minimum 3-character prefix search.
- `/api/admin/product-mobile-bootstrap` — short-lived startup reuse.
- `/api/admin/product-resource-bootstrap` — remains available for explicit resource work but is removed from degraded Product-picker recovery.
- `/api/admin/product-readiness` — existing server maximum of 300 plus short-lived client reuse.
- `/api/admin/inventory-replenishment` — existing hard caps of 500 inventory rows, 120 purchase orders and 40 recent receipts are now recorded in the read-budget authority.
- `/api/admin/pending-actions` — secondary startup read with short-lived reuse.

### 2. Lightweight Product picker

`/api/admin/product-picker` is a new read-only admin route designed specifically for Product selector recovery.

It reads only:

- Product ID
- name
- slug
- SKU
- status
- updated timestamp

The route avoids an exact total-count query, returns at most `limit + 1` rows to determine `has_more`, uses Product-ID keyset pagination, and blocks a supplied search term shorter than three characters. Search is prefix-only by design; this route is not a replacement for the full Product search workspace.

### 3. Short-lived successful GET reuse

The existing Build 62 Product cold-start guard still coalesces duplicate in-flight GETs. Build 63 adds an in-memory successful-response cache for the Product workspace:

- Product rollup: 45 seconds
- lightweight Product picker: 60 seconds
- Product options/mobile bootstrap: 60 seconds
- Product resource bootstrap: 30 seconds
- Product readiness: 30 seconds
- pending actions: 20 seconds

The cache is cleared after Product create/update/delete/archive events. It is browser-memory only; it does not create a second persistent data authority.

### 4. D1-light degraded recovery

The one-shot Product picker fallback now calls:

`/api/admin/product-picker?limit=120`

instead of:

`/api/admin/product-resource-bootstrap?product_id=0`

This keeps degraded selector recovery from invoking the broader Product/resource bootstrap merely to obtain names and IDs.

### 5. Operator projection

`/api/admin/d1-read-budget` exposes the current source-side read-budget contracts to an authenticated administrator. It explicitly distinguishes application guardrails from Cloudflare's provider-side usage totals.

## Existing protections verified

Build 63 also verifies rather than replaces these existing caps:

- Product readiness maximum: 300.
- Inventory replenishment projection: Inventory 500 / Purchase Orders 120 / Recent Receipts 40.
- Build 62 Product startup request coalescing, one-shot picker recovery, bounded timeouts and Product page layout protections remain active.

## Safety boundary

Build 63 performs no:

- canonical D1 schema migration,
- request-time DDL,
- Development or Production business-data rewrite,
- R2 mutation,
- payment/provider execution,
- social publication,
- Cloudflare Access mutation,
- automatic Production promotion.

Production promotion remains exact fully-green Development tree only.

## Acceptance

Before promotion, the exact Build 63 Development SHA must pass:

1. System Gate, including this Build 63 source contract.
2. Current Application Quality Proof.
3. I.T. Admin Runtime Proof.
4. Repository Branch Hygiene.
5. Exact Development Preview deployment, D1/bindings proof and smoke acceptance through the System Gate.

Only then may `main` fast-forward to the exact tested tree.
