# Release 467 Build 214 — Prototype → Sample → Production Run

## Goal

Add explicit manufacturing maturity to existing Creative Process and Custom Work without creating another project manager, Product production-run engine, Inventory authority or proof system.

## Exact starting boundary

Build 213 **Digital Proof & Customer Approval** is fully Production GREEN.

- Development SHA: `3292ac5c20780e23bd9d5ae593368e82b6e4826b`
- Production main: `92df5745fc2d4311dfacfbd214c1032a34c46bb8`
- Shared tree: `1108fecdeac23c69b8ea4d810c0375a0899ff469`
- Development proofs: `35533703475` / `35533703446` / `35533703481` / `35533703474`
- Build 213 Development proof: `35533703458`
- Production Pages / Live Resources: `35534081643` / `35534292686`
- Product Browser / Route: `35534292705` / `35534292692`
- Build 213 Production proof: `35534081642`
- Exact Production URL: `https://e8fa1e4b.devilndove-site.pages.dev`

## Existing authorities retained

- `creative_work_projects` remains Creative Process project authority.
- `custom_requests` remains Custom Work authority.
- `custom_request_proof_versions` remains Build 213 private proof/version authority.
- `creative_work_events` remains actual Creative Process event/time/material evidence.
- `product_production_runs` remains Product finished-production authority.
- Inventory remains stock/movement authority.
- CAIP/Media remains media authority.
- Finance/Accounting remains cost/posting authority.

## Build 214 schema

Canonical migration `0014_release467_prototype_sample_production_run.sql` adds:

1. `creative_project_manufacturing_lifecycles` — one current maturity projection linked to an existing Creative Project and/or Custom Request.
2. `creative_project_manufacturing_lifecycle_events` — append-only transition evidence.

No lifecycle rows are created automatically.

## Explicit maturity states

- concept
- prototype
- prototype failed / rework
- sample candidate
- approved sample
- production authorized
- production run
- QA / rework
- completed

Allowed transitions are explicit and fail closed. Failed prototypes and rework remain in history.

## Approved-sample evidence

An approved sample must reference exactly one of:

- an approved Build 213 proof version belonging to the linked Custom Request; or
- an active Creative Process event belonging to the linked Creative Project.

If an approved sample is superseded by a new sample candidate, the current pointer is cleared but the prior transition/evidence remains in append-only history.

## Production authorization

Production authorization is a separate explicit human transition after approved sample.

If linked Custom Work triage requires proof/sample, Build 213 proof readiness must be GREEN before production authorization. Production authorization itself does **not**:

- start production;
- create `product_production_runs`;
- create/update `creative_work_events`;
- consume/reserve Inventory;
- create orders or payments;
- send provider messages;
- publish media.

## Admin surfaces

The same authority is embedded in:

- `/admin/creative-process/`
- `/admin/custom-request/`

## Acceptance

1. Migration 0014 is canonical/additive and creates no business rows.
2. All nine maturity states are explicit.
3. Failure/rework and superseded sample history remains append-only.
4. Approved sample requires exact evidence.
5. Production authorization is explicit and Build-213-proof-gated where required.
6. No request-time DDL or owner-authority mutation occurs.

## Next

Release 467 Build 215 — **Small-Batch, Corporate & Event Quoting** — remains blocked until Build 214 is exact-SHA Production GREEN.
