# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 123 — Admin Home Dashboard Refresh**.

The last fully verified Development and Production checkpoint is Build 122:

- SHA `8ff2df0616a4a9f23c4e1a92bcf5e501a306e0da`
- tree `e87670bb397cee58ed839813ea33851d799b5823`
- System Gate `34710867035`
- Current Application Quality Proof `34710867094`
- I.T. Admin Runtime Proof `34710867066`
- Repository Branch Hygiene `34710867072`
- Production Pages Deploy `34710956842`
- Production Live Resource Integrity `34710999276`

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

## Build 123 technical boundary

Build 123 is a client-only Admin Home Dashboard Refresh. It reads the existing Today Tasks contract, current I.T. control tower and navigation manifest with GET only; uses fail-soft independent reads; and provides manual refresh without polling. It stores no history/preferences and exposes no Today task mutation controls. It does not post Accounting, close a period, mutate Inventory or Creative records, change prices, execute providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
