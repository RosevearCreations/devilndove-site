# Devil n Dove — Sanity Health Check

Current fully verified checkpoint: **Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA**.

- Development SHA `1d01cbed98b78543b75dab808a30fb76c20d6060`
- Production main SHA `2f22e280426968a9ff229a0cee9ee62a69dc9d75`
- identical tree `9cf8b0ac918ce567c51536f05d4c89b6f6294765`
- System `34860514075`
- Quality `34860514137`
- I.T. `34860514304`
- Hygiene `34860514150`
- Production Pages `34860809983`
- Production Live Resources `34860922626`

Build 153 — **Layout Observer Performance Hotfix** — is the active schema-free candidate.

Production evidence reported a Firefox long-script termination at `layout-overflow-guard.js:58:26`. The hotfix removes synchronous repeated subtree rescans by filtering irrelevant additions, batching work with `requestAnimationFrame`, deduplicating overlapping roots and disconnecting the observer while the guard performs its own table-wrapper mutations. The Products route cache token is advanced to `467-b153-layout-observer`.

Safety boundaries remain unchanged: no D1/R2/provider/payment/refund/accounting/request-time-schema mutation authority is added. Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport policy remains mandatory and external provider/evidence lanes remain separate.
