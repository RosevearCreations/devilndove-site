# Devil n Dove — Markdown Index

Current exact verified baseline: **Release 467 Build 153 — Layout Observer Performance Hotfix**.

Primary current authorities:
- `current-development-authority.json`
- `release467-build153-layout-observer-performance-hotfix.json`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `SANITY_HEALTH_CHECK.md`
- `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

Build 153 proof bundle:
- Development SHA `b8323b4e13ae08a8126da761106367de75f7cd40`
- Production main SHA `ba8b3c2406335391334b2a74a89e5819236c770b`
- identical tree `a3d0225c579953d5572dc99313661c2981c42510`
- System `34863777573`
- Quality `34863777529`
- I.T. `34863777559`
- Hygiene `34863777543`
- Production Pages `34864015766`
- Live Resources `34864113781`

Build 154 — **Products Worker Resource Hotfix** — is active because `/admin/products/` later returned HTTP 503 / Cloudflare Error 1102 (`Worker exceeded resource limits`) at `2026-09-14T15:48:10Z`. The repair preserves module/session authorization but removes the Products HTML document from generic request-time `HTMLRewriter`, replacing it with a bounded Products fast path and a route-specific post-Production proof.

Build 154 is not complete until the live route itself proves HTTP 200, `X-DND-Products-Render-Path: static-fast-path`, module-guard headers, the `467-b154-products-worker-fast-path` cache token, and no 1102/resource-limit response.

Builds 137–141 closure-evidence authorities remain retained provenance for Markdown/JSON export, evidence ID, SHA-256 fingerprint, verification manifest and independent cross-artifact verification. Build 135 Production live-resource transport resilience remains mandatory. Canonical migrations remain `0001`–`0004`.
