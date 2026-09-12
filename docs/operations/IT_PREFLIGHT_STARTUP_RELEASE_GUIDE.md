# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 114 — Business Health Action Queue & Owner Routing**.

The last fully verified Development and Production checkpoint is Build 113:

- SHA `9dca8383a1507838539820fb667aaea192ed4098`
- tree `36f473d66011c1138426346bcb0c553bfd2a69b1`
- System Gate `34696252402`
- Current Application Quality Proof `34696252394`
- I.T. Admin Runtime Proof `34696252388`
- Repository Branch Hygiene `34696252396`
- Production Pages Deploy `34696344689`
- Production Live Resource Integrity `34696386137`

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

## Build 114 technical boundary

Build 114 is a read-only Business Health action queue and owner-routing layer. It must not post Accounting, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate R2/bindings, restore business data or mutate Production. Existing module services remain the action owners.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.