# Devil n Dove — Sanity Health Check

Current exact verified release boundary: **Release 467 Build 153 — Layout Observer Performance Hotfix**.

- Development SHA `b8323b4e13ae08a8126da761106367de75f7cd40`
- Production main SHA `ba8b3c2406335391334b2a74a89e5819236c770b`
- identical tree `a3d0225c579953d5572dc99313661c2981c42510`
- System `34863777573`
- Quality `34863777529`
- I.T. `34863777559`
- Hygiene `34863777543`
- Production Pages `34864015766`
- Production Live Resources `34864113781`

**Production is not currently considered fully healthy for Products.** At `2026-09-14T15:48:10Z`, `/admin/products/` returned HTTP 503 / Cloudflare Error 1102 (`Worker exceeded resource limits`) after the Build 153 generic proof bundle had completed.

Build 154 — **Products Worker Resource Hotfix** — is the active schema-free repair. It preserves session/module authorization, removes the Products document from generic `HTMLRewriter`, uses a bounded Products-only text fast path, emits `X-DND-Products-Render-Path: static-fast-path`, and adds an independent post-deployment live Products-route proof.

The Products incident is not closed until exact candidate and Development proofs pass, the identical tree is promoted to `main`, Production Pages and Live Resource proofs pass, and the live `/admin/products/` proof confirms HTTP 200 + fast-path/module-guard headers + Build 154 cache token with no Error 1102/resource-limit response.

Safety boundaries remain unchanged: no D1/R2/provider/payment/refund/accounting/request-time-schema mutation authority is added. Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport policy remains mandatory and external provider/evidence lanes remain separate.
