# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 124 — Canada-First Market Controls & U.S. Shipping Pause**.

The last fully verified Development and Production checkpoint is Build 123:

- SHA `d0485a9892331e8da2cec42ed54850893b4a7ab1`
- tree `e5c15b8c2d1c1a9f091a688b9f525e8b7ce73e20`
- System Gate `34719387920`
- Current Application Quality Proof `34719387904`
- I.T. Admin Runtime Proof `34719387901`
- Repository Branch Hygiene `34719387931`
- Production Pages Deploy `34719482161`
- Production Live Resource Integrity `34719519418`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Restart protocol

1. Verify the previous build's exact SHA/tree and all six external proof runs.
2. The next build ingests that closure; the previous build does not self-record later proof.
3. Synchronize current authority, I.T., Reliability, Deployment Preflight and handoff documents.
4. Build one bounded candidate without claiming its own later proof.
5. Fast-forward to `dev` and require exact-head System, Quality, I.T. and Hygiene plus canonical Development D1/bindings/Preview proof.
6. Only after exact Development GREEN, non-force promote the identical SHA/tree to `main`.
7. Require Production Pages Deploy and Production Live Resource Integrity.

## Build 124 technical boundary

Build 124 preserves the established Canada-only checkout: Canadian billing, Canadian physical shipping, CAD currency and local pickup. It adds an explicit U.S. sales/shipping block with `TEMPORARY_TARIFF_RESTRICTION`, presents the Canada First public banner, and marks future market expansion as `REVIEW_BEFORE_ENABLE`. Other countries remain unsupported until a future reviewed build explicitly adds them to allowed-country authority.

The commerce core is shared by browser presentation and server middleware, which evaluates it before payment-provider execution. The banner therefore reflects the same fail-closed policy used by checkout rather than replacing enforcement.

Build 124 adds no Accounting posting, period close, Inventory/Creative/price mutation, provider execution/publication, request-time schema mutation, D1 business-data mutation, R2/binding mutation, restore action or Production business-data overwrite.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
