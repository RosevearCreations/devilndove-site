# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 129 — Admin Related Tools & Context Shortcuts**.

The last fully verified Development and Production checkpoint is Build 128:

- SHA `84523fe94b9007c82cae6d3f8b42b9a31a0e9f63`
- tree `08210d5fa81558ad0b773cf2c319f74f57d88af3`
- System Gate `34726947819`
- Current Application Quality `34726947864`
- I.T. Admin Runtime `34726947811`
- Repository Branch Hygiene `34726947787`
- Production Pages Deploy `34727026918`
- Production Live Resource Integrity `34727072165`

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

## Build 129 technical boundary

Build 129 adds one optional Related tools panel on Admin routes. It reads only the existing `data/admin-navigation-modules.json` manifest, finds the current route's existing section, excludes the current route, and shows at most four sibling shortcuts. It creates no new navigation authority.

The related-tools module is Admin-only and client-only. It adds no browser preference storage, server persistence, or write request. If manifest/context/anchor resolution is unavailable, it renders nothing.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
