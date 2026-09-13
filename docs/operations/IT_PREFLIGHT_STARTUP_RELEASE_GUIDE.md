# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 134 — Admin Navigation Context Summary Readability & Full-Text Accessibility**.

The last fully verified Development and Production checkpoint is Build 133:

- SHA `00025cf2fe7ec66af3fd44fba7188657a199cb87`
- tree `639a6d20fa8bd67c93faa70971de1ef5e2f64ea8`
- System Gate `34732882178`
- Current Application Quality `34732882139`
- I.T. Admin Runtime `34732882215`
- Repository Branch Hygiene `34732882188`
- Production Pages Deploy `34732966355`
- Production Live Resource Integrity `34733006830`

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

## Build 134 technical boundary

Build 134 preserves the existing Admin Related tools, Section position, Section map, responsive context dock, current-location cue and context count. It changes only the summary presentation: the location text can ellipsize on narrow screens, the count remains visible, and the full untruncated summary is retained in `title` and `aria-label`.

The feature is Admin-only and client-only. It introduces no new navigation target, manifest request, browser preference storage, server persistence or network read/write. If the dock/context is unavailable, the enhancement fails closed and existing navigation behavior remains untouched.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
