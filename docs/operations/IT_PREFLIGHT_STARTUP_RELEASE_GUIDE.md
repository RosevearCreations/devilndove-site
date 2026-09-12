# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 118 — Business Health Rolling Trend & Escalation Review**.

The last fully verified Development and Production checkpoint is Build 117:

- SHA `98ca6ee1a501d7ba8484f1b5ea31be696c907034`
- tree `e06d666285f654baded4f0948eff6984b38fc41b`
- System Gate `34700359583`
- Current Application Quality Proof `34700359610`
- I.T. Admin Runtime Proof `34700359586`
- Repository Branch Hygiene `34700359581`
- Production Pages Deploy `34700443075`
- Production Live Resource Integrity `34700490013`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`
- Retired separate Development Pages project is not an active target.

## Restart protocol

1. Verify the previous build's exact SHA/tree and all six external proof runs.
2. The next build ingests that closure; the previous build does not self-record later proof.
3. Synchronize current authority, I.T., Reliability, Deployment Preflight and handoff documents to the inherited checkpoint.
4. Build one bounded candidate without claiming its own later proof.
5. Fast-forward the candidate to `dev` and require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene plus canonical Development D1/bindings/Preview proof.
6. Only after exact Development GREEN, non-force promote the identical SHA/tree to `main`.
7. Require Production Pages Deploy and Production Live Resource Integrity.
8. A later build ingests that completed six-proof closure.

## Build 118 technical boundary

Build 118 is a read-only three-period Business Health Rolling Trend & Escalation Review. It recomputes current and two prior period-specific operational-quality snapshots and distinguishes persistent worsening from new worsening and recovery. Profitability and I.T. remain current snapshots only. Escalation means human review only. The feature must not create trend-history storage, persist acknowledgement/resolution, post Accounting, close a period, mutate Inventory or Creative records, change prices, execute/publish providers, create schema, mutate D1 business data/R2/bindings, restore business data or mutate Production.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
