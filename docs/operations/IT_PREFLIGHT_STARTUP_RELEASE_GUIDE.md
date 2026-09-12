# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 119 — Business Health Escalation Decision Brief & Owner Priority Matrix**.

The last fully verified Development and Production checkpoint is Build 118:

- SHA `df0953198882e82ca3d7742b614d92528d45dbe3`
- tree `9c2d8abd7da4a5f1e41c00bdc001cd844458d9ea`
- System Gate `34703983097`
- Current Application Quality Proof `34703983106`
- I.T. Admin Runtime Proof `34703983092`
- Repository Branch Hygiene `34703983073`
- Production Pages Deploy `34704076896`
- Production Live Resource Integrity `34704126081`

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

## Build 119 technical boundary

Build 119 is a read-only Business Health Escalation Decision Brief & Owner Priority Matrix. It reuses the existing action queue plus Build 118 rolling trend to prioritize human review. Finance trend context is period-specific operational quality; profitability and I.T. remain current snapshots only. The feature must not create another action queue, persist a decision/approval/acknowledgement/resolution, store trend history, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
