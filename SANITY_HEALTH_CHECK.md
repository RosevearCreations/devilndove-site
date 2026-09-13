# Devil n Dove — Sanity Health Check

Current candidate: **Release 467 Build 140 — Closure Evidence Integrity Self-Verification & Tamper Detection**.

Last fully verified checkpoint is Build 139 at SHA `3cb401b8cbf9c5c37e9b734497984cd9f4a385e5`, tree `5c6adcd9702348532e0c0807b3ea634c2604d7f7`.

Development proofs: System `34761418389`, Quality `34761418405`, I.T. `34761418383`, Hygiene `34761418425`. Production proofs: Pages `34761544388`, Live Resources `34761591278`.

Build 140 retains the Markdown/JSON exports, stable evidence ID, deterministic SHA-256 fingerprint and verification-manifest export, then adds independent browser-side recomputation and explicit tamper mismatch visibility. It does not mutate D1/R2/provider/business data. Canonical migrations remain `0001`–`0004` and live-resource retry correctness remains fail-closed.