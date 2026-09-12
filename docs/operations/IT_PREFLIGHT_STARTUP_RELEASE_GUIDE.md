# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference**.

The last fully verified Development and Production checkpoint is Build 127:

- SHA `dead9393e6d8db5fbcbe776c3885da80cbe42163`
- tree `efff42114b680218c756031fb2f92bc12e541b1c`
- System Gate `34725275176`
- Current Application Quality `34725275139`
- I.T. Admin Runtime `34725275114`
- Repository Branch Hygiene `34725275193`
- Production Pages Deploy `34725363163`
- Production Live Resource Integrity `34725405258`

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

## Build 128 technical boundary

Build 128 adds one accessible Admin navigation-help dialog. It documents the existing navigation features rather than creating another navigation authority: `Ctrl/Cmd+K` for the Build 122 command palette, `Alt+Shift+F` for the Build 126 current-page favorite toggle, workspace memory/resume from Build 125, and Build 127 breadcrumbs/workspace return. `Alt+Shift+H` opens the help dialog and a visible Admin workspace-nav button offers the same action.

The help module is Admin-only and client-only. It stores no state, creates no server preference authority and introduces no network write. The dialog closes with Escape and returns focus to its opener.

Build 128 adds no Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, request-time schema mutation, D1 business-data mutation, R2/binding mutation, restore action or Production business-data overwrite.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
