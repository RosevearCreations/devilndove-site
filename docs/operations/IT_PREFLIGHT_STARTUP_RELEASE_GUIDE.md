# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 122 — Admin Workspace Navigation & Command Palette**.

The last fully verified Development and Production checkpoint is Build 121:

- SHA `31492144ecbd2f8c353426531ea301c70aedf8f3`
- tree `078d5ba5c71ee160861e0a31bcca640bb89a3cdc`
- System Gate `34709444214`
- Current Application Quality Proof `34709444221`
- I.T. Admin Runtime Proof `34709444258`
- Repository Branch Hygiene `34709444255`
- Production Pages Deploy `34709526481`
- Production Live Resource Integrity `34709571023`

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

## Build 122 technical boundary

Build 122 is a client-only Admin Workspace Navigation & Command Palette quality-of-life improvement. It reuses `data/admin-navigation-modules.json`, adds a shared workspace strip and a `Ctrl/Cmd+K` launcher, and keeps all existing admin URLs stable. Manifest access is GET-only. No search/navigation history or preference is stored. It does not post Accounting, close a period, mutate Inventory or Creative records, change prices, execute providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
