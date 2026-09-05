# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 58 — **Account Administration JSON Response Hardening** is the current Development closure candidate. It hardens Create User, Admin Reset Password and member Change Password error handling after live Production exposed HTTP 500/non-JSON responses. It adds no schema migration and does not authorize Production automatically.

The last fully verified Development checkpoint is Build 57 — **Current Authority / Restart Truth Convergence**:
- `dev` SHA `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6`
- tree `c2f31450d59477fc313c9c0b25637f7bc9bc35e0`
- System Gate `33967307608` SUCCESS
- Current Application Quality `33967307714` SUCCESS
- I.T. Admin Runtime Proof `33967307740` SUCCESS
- Repository Branch Hygiene `33967307653` SUCCESS
- exact Development Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production remains Build 55 — **Inventory Intelligence Manufacturer-Link Schema Compatibility**:
- `main` SHA `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS
- Production business-data snapshot/preservation, canonical Production D1 proof, foreign-key/isolation proof, exact Pages deployment, Production bindings, public smoke and promotion proof: SUCCESS.

Development is intentionally ahead of Production.

## Build 58 scope

Build 58 responds to live account-administration failures where `/api/admin/create-user` returned HTTP 500 and the browser then exposed `JSON.parse: unexpected character at line 1 column 1`.

The bounded changes are:
- Create User and Admin Reset Password clients use the shared safe `DDAuth.readApiJson` parser instead of raw `response.json()`.
- Create User, Admin Reset Password and member Change Password APIs convert unexpected D1/runtime exceptions into structured JSON error codes/hints instead of allowing platform HTML/plain text to escape.
- An incorrect current password is a validation failure rather than HTTP 401, so a valid session is not cleared merely because the current password was mistyped.
- Password hashing remains the existing PBKDF2-SHA256 salted/iterated authority; plaintext passwords are never returned or audited.
- No D1 schema/business-data migration, R2 mutation, provider execution or automatic Production promotion.

The separate console warning `runtime activation suppressed for unavailable module business-administration` is a legacy three-module/canonical-five-module runtime mapping issue. It did not cause the Create User HTTP 500 and is not silently folded into this account-writing hotfix.

## Safety and restart rules

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 58 becomes the next restart checkpoint only after its exact merged `dev` head independently passes System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Do not add an evidence-only commit afterward; Build 59 must ingest those externally verified Build 58 values before its first source mutation.

Canonical D1 migrations remain exactly `0001`–`0004`. Renderer/provider execution, publication, social queue expansion, R2 mutation and Cloudflare Access mutation remain closed. Stripe Development, PayPal sandbox, CAIP private-media evidence, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.
