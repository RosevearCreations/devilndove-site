# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 112 — Inventory & Material-Usage Reconciliation** is the current Development closure candidate.

Build 112 starts only from the externally verified Build 111 closure. Build 111 did **not** self-record its later proof; Build 112 ingests that closure under the restart protocol.

- Exact Build 111 Development SHA: `a234b874b6e03442af96c0110d3cc22db074fe34`
- Exact tree: `4e82696773761595e57bb69eb48c053f95060e2c`
- System Gate: `34669983965`
- Current Application Quality Proof: `34669983954`
- I.T. Admin Runtime Proof: `34669983974`
- Repository Branch Hygiene: `34669983946`
- Production Pages Deploy: `34670059768`
- Production Live Resource Integrity: `34670099134`

Build 111 is therefore the last fully verified Development and Production checkpoint. `dev` and `main` were both exactly `a234b874b6e03442af96c0110d3cc22db074fe34` / tree `4e82696773761595e57bb69eb48c053f95060e2c` before Build 112 began.

## Build 112 scope

Build 112 adds a **read-only** reconciliation surface to the existing Inventory Operations workspace. It reads and cross-checks:

- Product material plans from `product_resource_links`.
- Finished Product production material evidence from existing Build 440 run/material records.
- Reviewed Creative material usage from the Inventory-owned Build 309 post evidence.
- Aggregate reservation truth from `site_item_inventory.reserved_quantity` and the Build 71 reserve/release movement ledger.
- Purchased-kit opening/component provenance and current child Inventory balances as **aggregate remnant evidence**, never invented origin attribution.
- Current cost authority from `site_item_inventory.unit_cost_cents`; cost history remains optional evidence only.
- Shortages, missing links and contradictory consumption/reservation evidence.

Build 112 creates **no** reserve/release action, no Inventory post/reverse action, no Product production action, no kit open/use action, no Creative mutation, no Finance posting, no synthetic stock movement, no request-time DDL, no R2 mutation and no provider action.

## Existing write owners preserved

- Build 71 Inventory lifecycle remains reservation/release owner.
- Build 309 Inventory post and the existing Inventory reversal authority remain reviewed Creative consumption owners.
- Build 440 Product production remains Product material-consumption owner.
- Build 440 Inventory kit service remains kit-opening/component-use owner.

## Canonical database boundary

Forward D1 authority remains `migrations/canonical/manifest.json` through `scripts/d1_migrate.py`. Canonical migrations remain exactly `0001`–`0004`; Build 112 adds no migration.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`.

Canada-only commerce remains authoritative: CAD, U.S. sales/shipping disabled, local pickup supported.

## Restart rule

Build 112 must not self-record its later external exact-head proof. After Build 112 is merged and externally proven, **Build 113 must ingest that later closure**. Until then, the restart authority is the exact Build 111 proof bundle above.
