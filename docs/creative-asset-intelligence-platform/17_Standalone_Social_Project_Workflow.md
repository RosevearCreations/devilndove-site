# 17 — Standalone / Social CAIP Project Workflow

**Implementation boundary:** Build 271  
**Use case:** a Creative Process project that may consume inventory/materials and produce social/editorial content without creating a physical sellable end product.


## Build 271 operator clarity

- **Open CAIP project** lists every CAIP project, including standalone/social projects with no Content Studio package.
- The separate **Content Studio package** selector is only for creating/refreshing Content Studio-backed CAIP records.
- Derivative plans are no longer clipped to six rows; every plan is reachable in a bounded scroll region with pending plans shown first.
- The screen explains that upload, safe probe, immutable plan, plan approval, evidence review and story structure are distinct stages.
- A derivative plan is optional; do not create or approve one for every source merely because it was uploaded.

## Authority model

- **Creative Process** owns project purpose, process events, material/inventory usage, internal cost purpose, reusable-resource allocation and lessons.
- **CAIP** owns private raw media, upload integrity, source identity, governance, evidence, story selection and derivative plans.
- **Content Studio** owns reviewed deliverable/social packages.
- **Release Board / social provider adapters** own final publication approval and provider status.
- A Product record is optional. Never create a fake product to satisfy workflow joins.

## Stage path

```text
Creative Process project
  ↓
record inventory/material use + cost purpose
  ↓
CAIP workspace
  ↓
duplicate-safe private raw-media intake
  ↓
verified Creative Assets
  ↓
evidence selection / rights / privacy review
  ↓
story segments + lessons / recommendations
  ↓
reviewed Content Studio social package
  ↓
Release Board / explicit publication approval
```

## Raw-media completion gate

Do not advance because a browser progress bar reached 100%. Raw intake is complete only when each wanted source is one of:

- registered canonical CAIP asset;
- intentionally skipped because the same strong fingerprint is already registered;
- intentionally excluded/archived; or
- explicitly documented failed/recovery-required item.

A multipart object is valid only after all expected D1 part rows/ETags/bytes are proven before R2 finalize and R2 HEAD reports exact expected size afterward.

## Duplicate rule

Build 269's `sample_sha256_v1` is designed to prevent expensive accidental re-uploads while staying memory-bounded for multi-gigabyte footage. It samples start/middle/end rather than hashing the entire object in browser memory. One canonical raw binary may be referenced by multiple evidence items, story segments, derivatives and social packages.

For archival/destructive decisions, this sample identity is not enough: whole-object verified checksum and reference checks remain required before any redundant private R2 object is physically deleted.

## Inventory rule for social projects

Inventory use belongs to the project even when nothing sellable is produced. Consumables may reduce stock through the existing reviewed inventory-post workflow. Reusable/log-only resources may contribute per-use/internal project cost without being consumed. CAIP may summarize the project context but must not post inventory itself.

## Next-stage acceptance after footage intake

When the wanted footage is uploaded and duplicate-safe:

1. review registered assets and correct media roles;
2. select evidence that proves process, technique, material use, mistakes, repairs, outcomes, efficiency or lessons;
3. review privacy/consent/rights for each candidate;
4. build story segments around reviewed evidence/timecodes;
5. create a Content Studio handoff with evidence and project context;
6. generate derivatives only through verified providers;
7. approve publication separately.
