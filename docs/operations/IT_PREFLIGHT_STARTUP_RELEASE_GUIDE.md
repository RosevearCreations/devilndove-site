# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 120 — Business Health Owner Context Transfer & Review Session Packet**.

The last fully verified Development and Production checkpoint is Build 119:

- SHA `9f5f763c277dc5c250cfe72d85e4235dc3e778dd`
- tree `2fa9a857ce4756c38d746acdd5f21e44e8f1e4f1`
- System Gate `34705738437`
- Current Application Quality Proof `34705738429`
- I.T. Admin Runtime Proof `34705738421`
- Repository Branch Hygiene `34705738427`
- Production Pages Deploy `34706136674`
- Production Live Resource Integrity `34706179149`

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

## Build 120 technical boundary

Build 120 is a read-only Business Health Owner Context Transfer & Review Session Packet. It carries the selected period, owner, review priority, top existing action and trend counts through admin-only query parameters into an existing owner workspace and displays them in a destination banner. The Build 114 action queue and Build 119 decision matrix remain authoritative. The feature must not create another action queue, persist review/session/context/decision/approval/acknowledgement/resolution state, store trend history, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
