# Release 467 Build 62 — Products & Inventory Final Reliability

## Purpose

Build 62 is the first build in the agreed reliability-first roadmap. It converts the September 7 Products incident fixes into permanent Product startup rules so the editor does not regress into browser lockups, duplicate D1 reads, permanent `Loading…` controls or unrelated Inventory observer work.

## Exact predecessor

Build 62 starts from the exact synchronized Development / Production checkpoint:

- `dev`: `d93747a0b3fa8c2b27003c9274e993967f021713`
- `main`: `d93747a0b3fa8c2b27003c9274e993967f021713`
- predecessor tree: `2c15bba48045462b77c3d33eeccdd4f2cb2c7be7`
- predecessor System Gate: `34129148871` — SUCCESS
- predecessor Current Application Quality Proof: `34129478043` — SUCCESS
- predecessor I.T. Admin Runtime Proof: `34129477873` — SUCCESS
- predecessor Repository Branch Hygiene: `34129477877` — SUCCESS
- predecessor Production Pages Deploy: `34129495049` — SUCCESS
- predecessor Production Live Resource Integrity Proof: `34129579441` — SUCCESS

The predecessor includes the Products cache-boundary hotfix, root-admin module correction, Product table containment, Product cold-start fallbacks and the removal of the Inventory base-unit usability observer from the Products route.

## Build 62 implementation

### 1. Cold-start D1 request coalescing

The Products cold-start guard coalesces concurrent GETs for Product startup authorities so independent page modules cannot create duplicate in-flight reads for the same endpoint/query.

Bounded/coalesced startup authorities include:

- `/api/admin/products`
- `/api/admin/product-mobile-bootstrap`
- `/api/admin/product-resource-bootstrap`
- `/api/admin/product-readiness`
- `/api/admin/pending-actions`

Mutating requests are never coalesced or converted into fallback success responses.

### 2. One-shot Product picker recovery

The recovery bootstrap no longer runs the lightweight Product picker query on every auth/start retry. It:

1. installs immediate safe dropdown fallbacks;
2. uses the existing Product browser snapshot when available;
3. recovers editor option authorities once;
4. waits for the primary Product loader to populate the picker;
5. performs at most one lightweight Product picker fallback if the picker is still unresolved after the bounded delay.

This removes the previous multi-timer pattern that could repeatedly call Product bootstrap authorities during a troubled cold start.

### 3. Catalog dashboard reuses Product snapshot

`admin-products-enhancements.js` no longer makes its own `/api/admin/products` call simply to calculate low-stock/draft/image summary cards. It uses the same `dd_admin_products_snapshot_v2` snapshot written by the primary Product loader and refreshes from that snapshot after Product mutation events.

This removes a full duplicate Product aggregate read from normal Products startup.

### 4. Existing lockup protections remain permanent

Build 62 preserves and gates the September 7 incident repairs:

- Products excludes `admin-inventory-base-unit-usability.js` from desktop startup.
- Products receives route-specific fresh asset identities.
- Product editor option requests are bounded.
- Product list failure may fall back to a saved browser snapshot.
- readiness/pending-action startup work is advisory and bounded.
- the shared responsive table guard recognizes existing admin table wrappers.
- the Products table uses a bounded horizontal scroll layout instead of intrinsic `max-content` expansion.

## Acceptance

Build 62 may be called Development GREEN only after the exact `dev` head passes:

1. Release 467 Build 62 source contract.
2. System Gate, including Development D1 migration/read proof and exact Preview deployment.
3. Current Application Quality Proof.
4. I.T. Admin Runtime Proof.
5. Repository Branch Hygiene.

Production promotion is separate and may occur only if that exact Development tree is fully green and the user has authorized promotion.

## Manual live acceptance target

After any Production promotion, the administrator should be able to:

- open `/admin/products/` without a Firefox slowdown/stop-page warning;
- see Category, Colour, Tax Class and Shipping Code resolve or degrade visibly rather than remain permanently `Loading…`;
- load multiple Products into the editor;
- use the records table without giant blank rows or uncontrolled page width;
- leave the page open and navigate away/back without a runaway observer loop;
- operate Product editing even if readiness analytics or pending-action status are slow.

## Safety boundary

Build 62 is schema-neutral. It authorizes no D1 business-data migration, R2 mutation, provider/payment execution, provider publication, Cloudflare Access mutation or automatic Production promotion.
