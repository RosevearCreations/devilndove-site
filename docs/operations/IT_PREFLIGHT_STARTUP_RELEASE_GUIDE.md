# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 133 — Admin Navigation Context Summary & Current Location Cue**.

The last fully verified Development and Production checkpoint is Build 132:

- SHA `3e69d3f11e7207b12160a38a42590dcb2a3a6d39`
- tree `5dba79cc9448043e72a740bf71fbfe4d2590ce1b`
- System Gate `34731990800`
- Current Application Quality `34731990814`
- I.T. Admin Runtime `34731990794`
- Repository Branch Hygiene `34731990817`
- Production Pages Deploy `34732064446`
- Production Live Resource Integrity `34732131430`

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

## Build 133 technical boundary

Build 133 preserves the Build 132 responsive context dock over the existing Admin Related tools, Section position and Section map cards. It enriches the compact summary from already-rendered context only: Section Position supplies the preferred module/section cue, Section Map is a fallback, and the summary reports the number of composed context panels.

The feature is Admin-only and client-only. It introduces no new navigation target, manifest request, browser preference storage, server persistence or network write. If the dock/context is unavailable, the summary enhancement fails closed and existing navigation behavior remains untouched.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
