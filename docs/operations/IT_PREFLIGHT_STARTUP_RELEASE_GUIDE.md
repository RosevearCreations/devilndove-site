# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 126 — Admin Favorites & Quick Launch**.

The last fully verified Development and Production checkpoint is Build 125:

- SHA `eca94d1ac4732c561794f914f89a2838af243617`
- tree `c7b4caf380183cd0b71b79d2f0ba73ccefce0d26`
- System Gate `34721943588`
- Current Application Quality `34721943584`
- I.T. Admin Runtime `34721943615`
- Repository Branch Hygiene `34721943593`
- Production Pages Deploy `34722069482`
- Production Live Resource Integrity `34722116635`

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

## Build 126 technical boundary

Build 126 adds admin-only browser favorites on top of Build 122 manifest-backed navigation and Build 125 workspace memory. Any non-home Admin route can be favorited, with at most eight favorites retained. The Favorites quick-launch dialog supports open/remove/clear, Admin home exposes up to three favorite shortcuts, and `Alt+Shift+F` can toggle the current route.

Favorite keys are scoped by signed-in Admin user ID. The feature uses `localStorage` only; no `sessionStorage`, server preference endpoint or network write is introduced.

Build 126 adds no Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, request-time schema mutation, D1 business-data mutation, R2/binding mutation, restore action or Production business-data overwrite.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
