# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 112 — Inventory & Material-Usage Reconciliation**.

The last fully verified Development and Production checkpoint is Build 111:

- Exact Build 111 Development SHA: `a234b874b6e03442af96c0110d3cc22db074fe34`
- Exact tree: `4e82696773761595e57bb69eb48c053f95060e2c`
- System Gate: `34669983965`
- Current Application Quality Proof: `34669983954`
- I.T. Admin Runtime Proof: `34669983974`
- Repository Branch Hygiene: `34669983946`
- Production Pages Deploy: `34670059768`
- Production Live Resource Integrity: `34670099134`

## Restart protocol

1. Verify the previous build's exact SHA/tree and all six external proof runs.
2. The **next build** ingests that closure; the previous build does not self-record later proof.
3. Keep `current-development-authority.json`, I.T., Reliability, Deployment Preflight and human handoff documents synchronized to the inherited checkpoint.
4. Build the next bounded candidate.
5. Candidate source must not claim its own later exact-head proof.
6. Fast-forward the candidate to `dev` only.
7. Require exact-head System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene, plus canonical Development D1 / bindings / Preview evidence.
8. Only after Development is exact-head GREEN, non-force promote the identical SHA/tree to `main`.
9. Require Production Pages Deploy and Production Live Resource Integrity.
10. A later build ingests that completed six-proof closure.

## Build 112 technical boundary

Build 112 is read-only Inventory evidence reconciliation. It must not:
- change stock or reservations;
- post or reverse Creative usage;
- post Product production;
- open or consume kits;
- change current cost;
- create schema;
- mutate R2/bindings;
- perform provider or Finance execution.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`, with canonical migrations exactly `0001`–`0004`.

External provider acceptance remains independent of deployment health.
