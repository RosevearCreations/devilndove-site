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
## Current Release 467 restart authority — Build 156 candidate

Build 155 **Products Client Responsiveness Hotfix** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `4e9efa2daf8f541e941c350ccde77798b5c99080`. Exact tree: `3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e`. Development proofs: System Gate `34915558746`, Current Application Quality `34915558747`, I.T. Admin Runtime `34915558751`, Repository Branch Hygiene `34915558771`, dedicated Build 155 proof `34915558804`. Production proofs: Pages `34915729378`, live-resource integrity `34915877580`, Products browser `34915877555`, Products route `34915877617`.

Build 156 **Tool & Supply Process Assignment** is the active Development closure candidate. It introduces forward-only canonical migration `0005_release467_inventory_process_assignment.sql`; Production promotion remains closed until the exact Build 156 `dev` head is GREEN across the required proof set.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
