# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return**.

The last fully verified Development and Production checkpoint is Build 126:

- SHA `af4dec5acdaf2b01a35d52731863786bee197315`
- tree `b8e410f0c517d3b0d59d48cf4dd7f2acfe6e21a3`
- System Gate `34724580675`
- Current Application Quality `34724580676`
- I.T. Admin Runtime `34724580648`
- Repository Branch Hygiene `34724580646`
- Production Pages Deploy `34724657853`
- Production Live Resource Integrity `34724703548`

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

## Build 127 technical boundary

Build 127 adds one accessible Admin context breadcrumb using the existing `data/admin-navigation-modules.json` authority. When the current route resolves, the breadcrumb presents Admin, workspace, section and current tool context and gives nested tools a direct **Back to workspace** path.

The breadcrumb module is Admin-only and client-only. It stores no preferences or history, uses neither `localStorage` nor `sessionStorage`, and introduces no network write. The only new network behavior is a read-only manifest fetch; if it fails the module renders a safe Admin/current-page fallback.

Build 127 adds no Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, request-time schema mutation, D1 business-data mutation, R2/binding mutation, restore action or Production business-data overwrite.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
