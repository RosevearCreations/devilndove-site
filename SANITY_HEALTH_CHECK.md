# Devil n Dove — Sanity Health Check

## Current release truth

Current candidate: **Release 467 Build 112 — Inventory & Material-Usage Reconciliation**.

Last fully verified Development + Production checkpoint:

- Exact Build 111 Development SHA: `a234b874b6e03442af96c0110d3cc22db074fe34`
- Exact tree: `4e82696773761595e57bb69eb48c053f95060e2c`
- System Gate: `34669983965`
- Current Application Quality Proof: `34669983954`
- I.T. Admin Runtime Proof: `34669983974`
- Repository Branch Hygiene: `34669983946`
- Production Pages Deploy: `34670059768`
- Production Live Resource Integrity: `34670099134`

Result: **Build 111 six-proof closure is ingested by Build 112.**

## Build 112 safety checks

- Reconciliation endpoint: GET-only.
- Synthetic stock movement: **ZERO**.
- New reserve/release owner: **ZERO**.
- New Inventory post/reverse owner: **ZERO**.
- New Product production owner: **ZERO**.
- New kit open/component-use owner: **ZERO**.
- New Creative mutation: **ZERO**.
- Finance/accounting posting: **ZERO**.
- Request-time schema mutation: **ZERO**.
- Canonical migrations: exactly `0001`–`0004`.
- R2 mutation: **ZERO**.
- Provider execution/publication: **ZERO**.
- Production business-data overwrite: **ZERO**.

Reservation reconciliation is deliberately aggregate and fail-closed: when the movement ledger cannot explain current `reserved_quantity`, Build 112 flags review rather than inventing Product ownership.

Kit child balances are deliberately shown as aggregate remnant evidence, not guaranteed source-kit attribution.

## Restart integrity

Build 112 remains a closure candidate until its exact `dev` head receives the required external proof. Its later proof must be ingested by Build 113, not self-written into Build 112.
