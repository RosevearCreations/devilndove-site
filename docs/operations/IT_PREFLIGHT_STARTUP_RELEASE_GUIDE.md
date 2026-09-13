# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 132 — Admin Navigation Context Dock & Responsive Collapse**.

The last fully verified Development and Production checkpoint is Build 131:

- SHA `ba0d027f299678479d1d28abd74ca85ea63c5efd`
- tree `057aa04505e4501516f87350556c3e13f89f986d`
- System Gate `34730852000`
- Current Application Quality `34730852014`
- I.T. Admin Runtime `34730851994`
- Repository Branch Hygiene `34730852019`
- Production Pages Deploy `34730958494`
- Production Live Resource Integrity `34731002747`

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

## Build 132 technical boundary

Build 132 adds one optional responsive context dock over the existing Admin Related tools, Section position and Section map cards. Those existing components remain the source of navigation content; the dock only groups them when at least two are present.

The dock is Admin-only and client-only. It is expanded by default on desktop, compact by default at 760px and below, and any manual open/close choice is ephemeral. It adds no browser preference storage, server persistence, network write or new navigation authority. If fewer than two context components are available, existing behavior is left untouched.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
