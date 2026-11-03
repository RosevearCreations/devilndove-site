# Release 467 · Build 579 — Authenticated Provider Trial Evidence Reconciliation & Exact Listing/Image Exception Closure Readiness

## Current evidence disposition

Build 579 provides a local comparison of expected versus observed Etsy or Meta account, Product, listing/post and exact individual image identifiers. It identifies mismatches, duplicate image IDs, unresolved Build 578 outcomes and absent local notes. The comparison does **not** fetch or authenticate the provider readback. Equal user-entered values remain `STRUCTURAL_MATCH_EXTERNAL_VERIFICATION_REQUIRED`, not a verified closure. Every exception remains open and every owner decision PENDING. This is a safe reconciliation aid while genuine receipts and separately scoped owner authorization are outstanding.

No OAuth, provider API, remote photo upload, Etsy draft creation, publication, D1 query or write is added. The existing gated Etsy create/update functionality is retained. Facebook Marketplace personal classified listings remain manual.

## Exact external acceptance required

1. Confirm the actual Etsy shop or Meta professional/Page account and permission scopes under authenticated server control.
2. Read the exact provider listing ID and reconcile it to the saved Product ID/SKU, not just title or a typed URL.
3. Read every distinct remote image ID, match the approved source originals and inspect processing state. Treat missing, duplicate, changed or unknown IDs as OPEN.
4. Collect provider response status, timestamp and redacted request/receipt correlation proof outside the worksheet; independently verify identity and freshness.
5. Obtain a separately recorded exact owner authorization for any provider write. Unknown previous POST outcomes must be read before retrying.
6. Do not record an exception closure or Production business acceptance without those receipts and owner sign-off.

## Release blocker inherited from Build 578

Build 578's GitHub `Current Application Quality Proof` failed twice at the historical Build 500 Etsy listing/gallery step, despite local Build 500–503 tests passing. This gate must pass before Build 579 is promoted; never bypass it or claim Production GREEN from source checks alone.

## Next queued build

**Build 580 — Authenticated Trial Receipt Owner Review & Source-Matched Recovery Decision Follow-Up**, conditional on real provider evidence and explicit owner direction. Preserve HOLD without them.
