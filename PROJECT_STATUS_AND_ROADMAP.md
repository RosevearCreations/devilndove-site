# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 58 — Account Administration JSON Response Hardening** is the current Development closure candidate.

Last fully verified Development is Build 57 — Current Authority / Restart Truth Convergence:
- `dev` `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6`
- tree `c2f31450d59477fc313c9c0b25637f7bc9bc35e0`
- System `33967307608` SUCCESS
- Quality `33967307714` SUCCESS
- I.T. `33967307740` SUCCESS
- Hygiene `33967307653` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production remains Build 55 — Inventory Intelligence Manufacturer-Link Schema Compatibility:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

The Build 55 Production workflow proved the exact fully-green Development tree before work, snapshotted and preserved Production business data, proved canonical Production D1 and foreign-key/isolation integrity, deployed the exact `main` SHA with Production bindings, passed public live smoke acceptance, and preserved promotion proof. Development is intentionally ahead of Production.

## Recent completed work

### Build 55 — Inventory Intelligence schema compatibility

The Inventory Intelligence manufacturer-link query was corrected to follow the canonical one-link-per-inventory-item schema instead of querying the nonexistent `iml.is_current` column. This was a runtime-query fix, not a migration. Build 55 closed green in Development and was deliberately promoted as a Production hotfix.

### Build 56 — Product photo guidance and Packaging onboarding

The Product Editor exposes existing deterministic image-quality assessments and can score unscored images or deliberately rescore the current set. Human-readable improvement guidance uses the existing Release 448 scoring authority. Packaging Studio has a resumable 12-step first-time-user walkthrough with Show-me navigation, blocker explanations and Advanced mode. Build 56 added no migration or provider execution.

### Build 57 — Current authority / restart truth convergence

Build 57 synchronized the canonical restart documents and read-only I.T./Reliability/Deployment Preflight projections and added a release-neutral freshness guard so the machine pointer cannot silently remain behind a newer Release 467 authority. Its exact merged Development closure is `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6` / tree `c2f31450d59477fc313c9c0b25637f7bc9bc35e0`, with System `33967307608`, Quality `33967307714`, I.T. `33967307740` and Hygiene `33967307653` successful.

## Build 58 purpose

Live Production account administration exposed two related symptoms: `/api/admin/create-user` returned HTTP 500 and the Create User / password tools could then display Firefox `JSON.parse: unexpected character at line 1 column 1` because some account clients directly parsed the response as JSON.

Build 58 is a bounded account-administration hardening build:
- Create User and Admin Reset Password use shared safe API response parsing.
- Create User, Admin Reset Password and member Change Password return structured JSON on unexpected D1/runtime failures.
- Wrong-current-password is a validation error, not a session-invalidating 401.
- Password hashing remains PBKDF2-SHA256 salted/iterated; no plaintext password is emitted or audited.
- No schema migration, D1 business-data migration, R2/provider execution or automatic Production promotion.

The separate `business-administration` runtime-suppression warning is a legacy module-runtime mapping issue and did not cause the Create User HTTP 500. It remains a separate convergence target rather than being mixed into this hotfix.

## Roadmap after Build 58

First close Build 58 through exact Development four-proof + Preview acceptance. Because the reported failure is on live Production, a deliberate hotfix promotion may follow only from that exact fully-green Development tree, with the normal Production data-preservation/D1/bindings/public-smoke proof chain.

After account administration is stable, the next bounded platform cleanup should converge the legacy three-module browser runtime (`commerce-operations`, `creative-production`, `business-administration`) with the canonical five modules (`storefront`, `creators`, `socials`, `financials`, `it-platform`) without weakening server authorization or root-admin full access.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, CAIP private-media, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes. Provider execution/publication and automatic Production promotion remain closed.
