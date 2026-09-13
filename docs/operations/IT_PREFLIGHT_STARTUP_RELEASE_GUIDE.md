# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 130 — Admin Section Position & Previous/Next Tool Navigation**.

The last fully verified Development and Production checkpoint is Build 129:

- SHA `3cd8aea7927d80f412bfe3acb62fe13f52b4c278`
- tree `0cbb9f0f33206d8b6c3dce404afd58382c71c24c`
- System Gate `34728937075`
- Current Application Quality `34728937088`
- I.T. Admin Runtime `34728937083`
- Repository Branch Hygiene `34728937091`
- Production Pages Deploy `34729016936`
- Production Live Resource Integrity `34729059768`

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

## Build 130 technical boundary

Build 130 adds one optional Section position panel on Admin routes. It reads only the existing `data/admin-navigation-modules.json` manifest, finds the current route in its existing ordered section, shows `Tool X of Y`, and exposes only the immediate previous and next sibling tools when available. The first and last items do not wrap around.

The section-position module is Admin-only and client-only. It adds no browser preference storage, server persistence, or write request. If manifest/context/anchor resolution is unavailable, it renders nothing.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
