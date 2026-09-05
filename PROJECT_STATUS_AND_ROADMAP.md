# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 61 — Production Live Resource Proof Repair** is the current validation-only closure candidate.

Last fully verified Development is Build 60 — Production Resource Binding & Account/Auth Recovery:
- `dev` `2f099d88b39a35a3bb8cf73798ba2c30b2b82083`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- System `33972673238` SUCCESS
- Quality `33972673246` SUCCESS
- I.T. `33972673266` SUCCESS
- Hygiene `33972673254` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is Build 60:
- `main` `732bac55a4a43434a31090bb3b9c6b7b2c5a7939`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- Production Pages Deploy `33972781588` SUCCESS.

The Build 60 Production workflow proved the exact fully-green Development tree, snapshotted/preserved Production business data, proved canonical Production D1 and isolation/FK integrity, deployed the exact main SHA with live bindings, passed public smoke and preserved promotion proof.

## Build 60 incident correction

Build 60 corrected the live account/session compatibility path used by Create User and password operations, broadened Product-media recovery across current and legacy public R2 prefixes, and injected that recovery site-wide. It added no migration, D1 business-data copy or R2 mutation.

## Why Build 61 exists

The new post-deploy `Production Live Resource Integrity Proof` run `33972823412` failed before its first resource assertion. The proof workflow omitted the Cloudflare account context that the successful Production deployment workflow supplies to Wrangler. Therefore that run is a **validation-harness failure**, not evidence that Production D1 or R2 failed.

Build 61 repairs and strengthens the proof so Production cannot be called fully incident-validated unless it proves:
- live `users`/`sessions` schema compatibility read-only;
- a known real R2 Product object through the deployed same-origin media route;
- nonzero live `/api/products` rows and at least one public Product image URL;
- real Product image bytes from the public URL or same-origin recovery route;
- healthy `/api/storefront-merchandising` JSON;
- Production D1 reachability through the public auth diagnostic.

Build 61 is validation-only: no application runtime change, canonical migration, D1 business-data mutation, R2 mutation, provider execution or Cloudflare Access mutation.

## Next sequence

1. Pass Build 61 exact feature-head System, Quality and I.T. proofs.
2. Merge the exact tested head to `dev`.
3. Require exact merged-`dev` System + Quality + I.T. + Hygiene and exact Preview acceptance.
4. Promote that exact tree to `main` under the user’s explicit incident-validation authorization.
5. Require the normal Production preservation/D1/FK/binding/smoke proof **and** the repaired live-resource proof.
6. If the live Product API returns zero products or zero public image URLs, treat that as the next concrete Storefront defect rather than calling the image incident closed.
7. If live resources are green but authenticated Create User still returns 503, use the structured response detail/Cloudflare Function evidence for the next bounded account-write correction; do not mutate Production schema by guesswork.

After the incident is actually proven closed, resume the separate legacy browser-module naming convergence (`business-administration` → canonical five-module runtime) without weakening root-admin full access.

Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.
