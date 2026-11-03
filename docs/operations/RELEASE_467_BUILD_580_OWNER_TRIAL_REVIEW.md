# Release 467 · Build 580 — Authenticated Trial Receipt Owner Review & Source-Matched Recovery Decision Follow-Up

## Scope and evidence boundary

Section 5 of `/admin/channel-trials/` adds an owner-facing follow-up queue tied to a Build 579 exact comparison source pin. It validates that the reconciliation is recomputed from the local Build 578 trial notes. A changed source, listing/image identity, or unresolved note makes previous follow-up requests **STALE**. Owners may request authenticated receipts, exact image/listing rechecks, unknown/duplicate outcome escalation or a separately scoped owner test decision. None of these choices records approval or closure.

This remains a **browser-local documentary review**, not a live authenticated Etsy or Meta trial. We have not been given an authenticated independent provider receipt or separately scoped authorization for a particular provider-side write. Provider requests, D1 operations, Etsy draft/image creation, social publication and Facebook Marketplace API posting remain disabled by this feature. Owner decision stays `NOT_RECORDED`, sign-off `PENDING`, verified closures `0`.

## Required independent verification before a later closure

1. Confirm the genuine provider account identity, token scope and shop/Page/Instagram professional identity using authenticated server-side evidence.
2. Match each owner-approved Product/SKU to the exact draft/listing and every distinct real image ID. Compare remote readback and source originals; unknown outcomes require read-before-retry.
3. Obtain timestamped, redacted independent provider receipts and reconcile them against the exact source pin and previous exception request.
4. Seek the owner's explicit, narrow action authorization before any provider write or publication. Keep personal Marketplace classified listings manual.
5. Sign off on authentic evidence outside this browser worksheet; source-matched local requests alone cannot close cases.

## Next queued build

**Build 581 — Independent Provider Receipt Authentication & Owner-Specific Trial Gate Review.** Conditional on real provider evidence and explicit owner direction; otherwise retain HOLD and work through documented owner evidence gaps.
