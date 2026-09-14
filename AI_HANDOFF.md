# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 153 — Layout Observer Performance Hotfix** is the current exact Development + Production baseline.

- Development SHA `b8323b4e13ae08a8126da761106367de75f7cd40`
- Production main SHA `ba8b3c2406335391334b2a74a89e5819236c770b`
- identical tree `a3d0225c579953d5572dc99313661c2981c42510`
- System Gate `34863777573`
- Current Application Quality `34863777529`
- I.T. Admin Runtime `34863777559`
- Repository Branch Hygiene `34863777543`
- Production Pages Deploy `34864015766`
- Production Live Resource Integrity `34864113781`

Build 153 is sealed in `release467-build153-layout-observer-performance-hotfix.json` and remains historically exact. A later route-specific incident at `2026-09-14T15:48:10Z` showed that the generic Build 153 Production checks did not exercise `/admin/products/`: the live route returned HTTP 503 / Cloudflare Error 1102 (`Worker exceeded resource limits`).

## Active candidate

Build 154 — **Products Worker Resource Hotfix** — is the active schema-free candidate.

The Products request currently completes the existing session/module-access guard and then passes the large admin HTML document through the shared request-time `HTMLRewriter`. Build 154 preserves the guard but removes `/admin/products/` from the generic rewriter path. It uses a bounded Products-only text fast path that injects the same shared responsive/PWA/layout assets and applies one cache-revision pass to Product scripts.

The repaired response emits `X-DND-Products-Render-Path: static-fast-path`, retains `X-DND-Module-Guard` / `X-DND-Module-Key`, uses Product cache revision `467-b154-products-worker-fast-path`, and keeps the Build 153 layout guard revision `467-b153-layout-observer`.

Build 154 adds a post-Production-deploy live route proof. The proof permits at most three Build-135 transient attempts and requires the real `/admin/products/` response to return HTTP 200, the fast-path/module-guard headers, the Build 154 cache token, and no Error 1102 / Worker resource-limit body. Generic Production Pages and Live Resource proofs alone are no longer sufficient to close this incident.

The hotfix changes no business data, D1/R2 state, provider execution, payment/refund/accounting state or schema. Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Build 154 must pass exact-head candidate System/Quality/I.T./hotfix proof, then exact `dev` System/Quality/I.T./Hygiene plus D1/Preview/bindings/smoke, followed by non-force identical-tree promotion to `main`, Production Pages Deploy, Production Live Resource Integrity, and the independent Build 154 Products Production Route Proof before the Products incident may be called fixed/Production healthy.
