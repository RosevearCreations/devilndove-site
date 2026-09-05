# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 59 — Storefront Media Availability & Merchandising Recovery** is the current Development closure candidate.

Last fully verified Development is Build 58 — Account Administration JSON Response Hardening:
- `dev` `91106c2156e209045ed49cfd48220550c7afca57`
- tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`
- System `33968914405` SUCCESS
- Quality `33968914416` SUCCESS
- I.T. `33968914417` SUCCESS
- Hygiene `33968914412` SUCCESS
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

Build 57 synchronized the canonical restart documents and read-only I.T./Reliability/Deployment Preflight projections and added a release-neutral freshness guard so the machine pointer cannot silently remain behind a newer Release 467 authority.

### Build 58 — Account Administration JSON Response Hardening

Build 58 hardened Create User, Admin Reset Password and member Change Password after live Production exposed HTTP 500/non-JSON responses. Account clients now use safe response parsing, unexpected account-write failures return structured JSON, and a wrong current password no longer invalidates an otherwise valid session. Its exact merged Development closure is `91106c2156e209045ed49cfd48220550c7afca57` / tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`, with System `33968914405`, Quality `33968914416`, I.T. `33968914417` and Hygiene `33968914412` successful.

## Build 59 purpose

Live Production Store evidence shows two storefront availability failures at the same time:
- `GET /api/storefront-merchandising` returns HTTP 500.
- Product image requests to `https://assets.devilndove.com/products/...` fail with `NS_ERROR_DOM_NETWORK_ERR`, causing Store product photography to disappear.

Build 59 is a bounded Storefront recovery build:
- Storefront merchandising reads the actual Product table shape and supplies safe defaults for optional Product fields instead of relying on a fixed-column SELECT.
- `/api/product-media` provides a read-only same-origin fallback to the existing `PRODUCT_MEDIA_BUCKET`, restricted to validated `products/*` keys.
- Shop installs the Product-media fallback before either Product renderer; a failed public R2 custom-host image is retried through the same-origin endpoint.
- The recovery path cannot list, upload, overwrite, delete or multipart-mutate R2 objects.
- A current regression gate plus executable runtime test protects the restricted R2-read contract and Shop script ordering.
- No canonical migration, D1 business-data mutation, R2 mutation, provider execution, Cloudflare Access mutation or automatic Production promotion.

## Roadmap after Build 59

First close Build 59 through exact Development four-proof + Preview acceptance. Because the reported Store failure is on live Production, any Production repair must come from the exact fully-green Build 59 Development tree and still pass the normal Production preservation, D1/FK, bindings and public-smoke proof chain.

After Storefront availability is stable, the next bounded platform cleanup remains convergence of the legacy three-module browser runtime (`commerce-operations`, `creative-production`, `business-administration`) with the canonical five modules (`storefront`, `creators`, `socials`, `financials`, `it-platform`) without weakening server authorization or root-admin full access.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, CAIP private-media, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes. Provider execution/publication and automatic Production promotion remain closed.
