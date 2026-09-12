# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 117 — Business Health Period Comparison & Trend Review**.

The last fully verified Development and Production checkpoint is Build 116:

- SHA `4661b541df3ad92c70e19c85673560f969cda85b`
- tree `475d13cd5fda9e9ac694861c8df44c5ede8a5db0`
- System Gate `34699742783`
- Current Application Quality Proof `34699742812`
- I.T. Admin Runtime Proof `34699742791`
- Repository Branch Hygiene `34699742779`
- Production Pages Deploy `34699821018`
- Production Live Resource Integrity `34699867959`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`
- Retired separate Development Pages project is not an active target.

## Restart protocol

1. Verify the previous build's exact SHA/tree and all six external proof runs.
2. The next build ingests that closure; the previous build does not self-record later proof.
3. Synchronize current authority, I.T., Reliability, Deployment Preflight and handoff documents to the inherited checkpoint.
4. Build one bounded candidate without claiming its own later proof.
5. Fast-forward the candidate to `dev` and require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene plus canonical Development D1/bindings/Preview proof.
6. Only after exact Development GREEN, non-force promote the identical SHA/tree to `main`.
7. Require Production Pages Deploy and Production Live Resource Integrity.
8. A later build ingests that completed six-proof closure.

## Build 117 technical boundary

Build 117 is a read-only selected-period versus prior-period Business Health comparison. Only period-specific operational-quality evidence is graded. Profitability and I.T. are current snapshots only. Worsening signals are review guidance, not action authority. The feature must not persist acknowledgement/resolution, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
