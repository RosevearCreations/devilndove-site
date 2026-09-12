# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 113 — Accountant & Month-End Evidence Depth**.

The last fully verified Development and Production checkpoint is Build 112:

- SHA `959f376b5e430c5d142376097291d65c48c8c49b`
- tree `506ac4dc790d88978d3f6c1ffee5435b5042dc5c`
- System Gate `34695751247`
- Current Application Quality Proof `34695751252`
- I.T. Admin Runtime Proof `34695751279`
- Repository Branch Hygiene `34695751249`
- Production Pages Deploy `34695830846`
- Production Live Resource Integrity `34695871530`

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

## Build 113 technical boundary

Build 113 is read-only month-end/accountant evidence depth. It must not post Accounting entries, close periods, mutate evidence, execute accountant exports, pay/refund, create schema, mutate R2/bindings, or execute providers. Existing Accounting and Month-End services remain the action owners.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`. External provider acceptance remains independent of deployment health.
