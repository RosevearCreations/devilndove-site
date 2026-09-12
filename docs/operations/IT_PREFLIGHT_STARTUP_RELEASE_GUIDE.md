# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 125 — User Preferences & Workspace Memory**.

The last fully verified Development and Production checkpoint is Build 124:

- SHA `fbcc55051b899719d2fb2cdf90343852cf5abe70`
- tree `7476f4843f8209c230189a03449d7c172da5de8a`
- System Gate `34720625518`
- Current Application Quality `34720625496`
- I.T. Admin Runtime `34720625502`
- Repository Branch Hygiene `34720625515`
- Production Pages Deploy `34720717741`
- Production Live Resource Integrity `34720757007`

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

## Build 125 technical boundary

Build 125 adds admin-only browser workspace preferences on top of the existing manifest-backed Build 122 navigation. It remembers the last non-home Admin workspace, optional recent Admin tools and a 3/5/8 recent limit. It provides a local clear control and fails soft when browser storage is unavailable.

Preference and memory keys are scoped by signed-in Admin user ID. The feature uses `localStorage` only; no `sessionStorage`, server preference endpoint or network write is introduced.

Build 125 adds no Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, request-time schema mutation, D1 business-data mutation, R2/binding mutation, restore action or Production business-data overwrite.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
