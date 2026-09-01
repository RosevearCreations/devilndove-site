# Release 467 Production Promotion

This file records the deliberate Release 467 Cloudflare Production promotion requested on 2026-09-01.

## Promotion authority

- Source authority: `dev`
- Production source: `main`
- Cloudflare Pages project: `devilndove-site`
- Live domain: `https://devilndove.com`
- Promotion rule: exact green Development tree only
- Production business data remains Production-owned and must not be overwritten from Development.
- Canonical D1 migrations remain the only schema-change authority.
- Provider execution, provider publication, and provider live authorization remain closed unless separately accepted and explicitly authorized.
- Pending Stripe, PayPal, social OAuth, and GitHub native-ruleset acceptance is not reclassified by this deployment.

## Production resources

- D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Product R2: `devilndove-toolshed-images`
- CAIP private R2: `devilndove-caip-media`

The canonical System Gate must prove the exact final Development SHA before `main` is advanced to this promotion candidate.
