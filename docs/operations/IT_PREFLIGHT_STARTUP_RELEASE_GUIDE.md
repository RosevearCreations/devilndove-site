# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 131 — Admin Section Switcher & Module Map**.

The last fully verified Development and Production checkpoint is Build 130:

- SHA `047427e8233793494e099c257aac56b8bd8bf6fb`
- tree `afdce4033115489a7abf78088b7ab82dc1bb4a70`
- System Gate `34729838054`
- Current Application Quality `34729838051`
- I.T. Admin Runtime `34729838028`
- Repository Branch Hygiene `34729838029`
- Production Pages Deploy `34729939106`
- Production Live Resource Integrity `34729976417`

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

## Build 131 technical boundary

Build 131 adds one optional section switcher/module map on Admin routes. It reads only the existing `data/admin-navigation-modules.json` manifest, identifies the current module/section, marks the current section, and exposes one jump target to the first available tool in each other section of the same module.

The section-map module is Admin-only and client-only. It adds no browser preference storage, server persistence, or write request. If manifest/context/anchor resolution is unavailable, it renders nothing.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
