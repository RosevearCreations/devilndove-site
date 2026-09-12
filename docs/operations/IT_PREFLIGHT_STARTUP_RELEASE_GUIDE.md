# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 115 — Business Health Review Packs & Owner Handoff**.

The last fully verified Development and Production checkpoint is Build 114:

- SHA `5ff61e8391437c5d3369c38f5bf4a1088babc63c`
- tree `7d7c0ebf9cfa51452438e9d46fd98b3e3550926f`
- System Gate `34697432158`
- Current Application Quality Proof `34697432135`
- I.T. Admin Runtime Proof `34697432119`
- Repository Branch Hygiene `34697432225`
- Production Pages Deploy `34697511211`
- Production Live Resource Integrity `34697551264`

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

## Build 115 technical boundary

Build 115 is a read-only Business Health Review Packs and human owner-handoff layer over the proven Build 114 action queue. It may carry evidence and review steps, but it must not persist acknowledgement/resolution, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate R2/bindings, restore business data or mutate Production. Existing module services remain the action owners.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
