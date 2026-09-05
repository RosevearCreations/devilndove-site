# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 60 — Production Resource Binding & Account/Auth Recovery** is the current Production-incident hotfix candidate.

Last fully verified Development is Build 59 — Storefront Media Availability & Merchandising Recovery:
- `dev` `44483117210e93ce7126cd19510b090d88f663a7`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- System `33969967713` SUCCESS
- Quality `33969967734` SUCCESS
- I.T. `33969967704` SUCCESS
- Hygiene `33969967656` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is Build 59:
- `main` `9411c0968d2f0cae57f25d36f0664729cd81c61f`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- Production Pages Deploy `33970506769` SUCCESS.

The Production workflow proved the exact fully-green Development tree, snapshotted and preserved Production business data, proved canonical Production D1 and isolation/foreign-key integrity, deployed the exact `main` SHA with Production bindings, passed public live smoke acceptance, and preserved promotion proof. A later user report nevertheless exposed two runtime gaps that the prior smoke did not test: a real public Product R2 object read and an authenticated account-administration write.

## Recent completed work

### Build 55 — Inventory Intelligence schema compatibility

The Inventory Intelligence manufacturer-link query was corrected to follow the canonical one-link-per-inventory-item schema instead of querying the nonexistent `iml.is_current` column. This was a runtime-query fix, not a migration. Build 55 closed green in Development and was deliberately promoted as a Production hotfix.

### Build 56 — Product photo guidance and Packaging onboarding

The Product Editor exposes existing deterministic image-quality assessments and can score unscored images or deliberately rescore the current set. Human-readable improvement guidance uses the existing Release 448 scoring authority. Packaging Studio has a resumable 12-step first-time-user walkthrough with Show-me navigation, blocker explanations and Advanced mode. Build 56 added no migration or provider execution.

### Build 57 — Current authority / restart truth convergence

Build 57 synchronized the canonical restart documents and read-only I.T./Reliability/Deployment Preflight projections and added a release-neutral freshness guard so the machine pointer cannot silently remain behind a newer Release 467 authority.

### Build 58 — Account Administration JSON Response Hardening

Build 58 hardened Create User, Admin Reset Password and member Change Password so clients no longer throw raw JSON.parse failures when a platform response is not JSON, unexpected account-write failures return structured JSON, and a wrong current password no longer invalidates an otherwise valid session.

### Build 59 — Storefront Media Availability & Merchandising Recovery

Build 59 made storefront merchandising schema-compatible and added a read-only same-origin R2 fallback for `products/*` on Shop. It closed fully green in Development and was promoted to Production. The later live incident proved its media recovery coverage was too narrow for the older public R2 prefixes and its Production smoke did not test a real media object.

## Build 60 purpose

The live Production report after Build 59 is treated as a serious availability incident:
- Product images remain unavailable across public site surfaces.
- Authenticated `POST /api/admin/create-user` returns HTTP 503 with `ADMIN_CREATE_USER_FAILED` / “User creation is temporarily unavailable.”
- The console’s `business-administration` module warning is a separate legacy module-name issue and is not the structured Create User failure source.

Build 60 is a bounded live-resource compatibility and proof build:
- Create User, Admin Reset Password and Member Change Password use one read-only account-schema compatibility helper that inspects the actual live `users` and `sessions` columns and dynamically uses whichever supported session-token columns are present.
- Account writes no longer assume optional `display_name`, `created_at` or `updated_at` fields exist; required credential/role fields still fail closed if absent.
- No request-time DDL, emergency table creation, blind Development-to-Production data copy or new migration is permitted.
- `/api/product-media` remains GET-only but now supports existing public R2 prefixes such as `products/`, `Itemsforsale/`, `Toolshed/`, `Tools/` and `Supplies/`, including historical case differences between URLs and R2 object keys.
- Shared HTML middleware injects the media recovery on every HTML page, so public pages are not dependent on Shop-specific script ordering.
- Regression tests prove unsafe/non-public prefixes never reach R2 and the recovery endpoint cannot list, put, delete or multipart-mutate objects.
- Production acceptance must be strengthened to prove the live account table shape and fetch a real known Product R2 object through `devilndove.com` before Build 60 is called Production green.

## Roadmap after Build 60

First close Build 60 through exact feature-head proofs, exact merged-Development four-proof + Preview acceptance, then deliberately promote the exact green tree to Production under the user’s explicit incident authorization. Do not call the incident closed until live resource acceptance proves the account table contract and a real R2 media object.

After Production availability is stable, the next bounded platform cleanup remains convergence of the legacy three-module browser runtime (`commerce-operations`, `creative-production`, `business-administration`) with the canonical five modules (`storefront`, `creators`, `socials`, `financials`, `it-platform`) without weakening server authorization or root-admin full access.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, CAIP private-media, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes. Provider execution/publication and automatic Production promotion remain closed.
