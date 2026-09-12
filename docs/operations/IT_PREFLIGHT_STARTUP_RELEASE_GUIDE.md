# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 121 — Business Health Review Context Polish & Return Navigation**.

The last fully verified Development and Production checkpoint is Build 120:

- SHA `25ba9858d8926fed1fb740bd79fa41b8a0e4104a`
- tree `25a86af30faf1f7632a008e687a67f93f4bb98ce`
- System Gate `34708100872`
- Current Application Quality Proof `34708100889`
- I.T. Admin Runtime Proof `34708100890`
- Repository Branch Hygiene `34708100871`
- Production Pages Deploy `34708208709`
- Production Live Resource Integrity `34708253961`

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

## Build 121 technical boundary

Build 121 is a client-side quality-of-life polish of the Build 120 Business Health owner handoff. It adds a compact destination banner, Return to Business Health with period preservation, Copy review context with a browser fallback, and current-view dismissal. It does not create another action queue, persist review/session/context/decision/approval/acknowledgement/resolution state, store browser preferences, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
