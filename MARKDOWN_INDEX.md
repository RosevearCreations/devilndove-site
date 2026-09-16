# Devil n Dove — Markdown Index

Current exact verified source baseline: **Release 467 Build 154 — Products Worker Resource Hotfix**.

Primary current authorities:
- `current-development-authority.json`
- `release467-build154-products-worker-resource-hotfix.json`
- `release467-build153-layout-observer-performance-hotfix.json`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `SANITY_HEALTH_CHECK.md`
- `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

Build 154 proof bundle:
- Development SHA `fc74ea680c0eee221722ce1ede6cb7990b92551f`
- Production main SHA `cc50c65c7d4ecbb75e9744a57a14be7da4aba873`
- identical tree `36e466d2d971ac7c80f183c3b9b42a0ff56597d9`
- System `34867834161`
- Quality `34867834181`
- I.T. `34867834020`
- Hygiene `34867834038`
- Production Pages `34868084233`
- Live Resources `34868183267`
- Products Route Production Proof `34868183338`

Build 154 proved the `/admin/products/` **server route** HTTP 200/static-fast-path/no-1102 boundary. Its closure intentionally records `client_ui_usability_proven: false` because a later real Firefox session showed the page can still lock after HTML rendering while Product dropdown/loading work remains unfinished.

Build 155 — **Products Client Responsiveness Hotfix** — is active. It repairs the Marketplace Listing Readiness self-triggering `MutationObserver`/DOM-render loop, advances Product cache identity to `467-b155-products-client-responsiveness`, advances the dynamic Marketplace import to `467b155`, and adds real authenticated Chromium/CDP Development and Production browser proofs. Those proofs must show a populated Product picker/table, responsive event-loop heartbeat, stable marketplace render count, and loading panels that settle.

Builds 137–141 closure-evidence authorities remain retained provenance for Markdown/JSON export, evidence ID, SHA-256 fingerprint, verification manifest and independent cross-artifact verification. Build 135 Production live-resource transport resilience remains mandatory. Canonical migrations remain `0001`–`0004`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 157 candidate

The canonical current machine authorities are `current-development-authority.json`, `release467-build156-inventory-process-assignment.json`, and `release467-build157-admin-data-delivery.json`.

Build 156 **Tool & Supply Process Assignment** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `1b375af8dadb1bfc32086708469cc2008ba9fc9f`. Exact tree: `96928f3c3d09dcf1999387d9a63a823f264bebf8`. Development proofs: System Gate `35019952492`, Current Application Quality `35019952480`, I.T. Admin Runtime `35019952545`, Repository Branch Hygiene `35019952489`. Production proofs: Pages `35020167619`, live-resource integrity `35020259348`, Products browser `35020259412`, Products route `35020259408`.

Build 157 **Product Admin + Admin Data Delivery** is the active Development candidate. It now includes the live Product Quality/media follow-up: secondary startup Product consumers can reuse the fresh core Product snapshot; Product list readiness is capped at 80; Product Quality has a fail-soft recovery path with no duplicate Product API read; and Admin Product image failures no longer trigger a second `/api/product-media` probe for already-missing keys. Public storefront media recovery remains unchanged and missing media is not represented as restored.

Promotion remains closed until one exact Build 157 `dev` SHA is GREEN across the dedicated Build 157 proof, retained Build 156 proof, System Gate/Preview, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene; Production then requires exact deployment, live-resource and affected Product browser acceptance.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
