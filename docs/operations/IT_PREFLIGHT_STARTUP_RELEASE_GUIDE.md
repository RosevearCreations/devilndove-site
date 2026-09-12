# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 116 — Business Health Operator Briefs & Export**.

The last fully verified Development and Production checkpoint is Build 115:

- SHA `7cff6e22b273ffb4db40828dfcbf9f0d52b46c60`
- tree `f0dffdc1c6c293cde5482cc6a36da2a6ce1614b0`
- System Gate `34698543554`
- Current Application Quality Proof `34698543577`
- I.T. Admin Runtime Proof `34698543545`
- Repository Branch Hygiene `34698543556`
- Production Pages Deploy `34698623248`
- Production Live Resource Integrity `34698665721`

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

## Build 116 technical boundary

Build 116 is a read-only Business Health Operator Briefs and Markdown export layer over the proven Build 115 review packs. It may order existing human-review work and format carried evidence for download, but it must not persist acknowledgement/resolution, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate D1 business data, mutate R2/bindings, restore business data or mutate Production. Existing module services remain the action owners.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
