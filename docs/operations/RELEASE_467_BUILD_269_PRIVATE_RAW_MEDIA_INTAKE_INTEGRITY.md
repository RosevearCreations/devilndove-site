# Release 467 Build 269 — Private Raw Media Intake Integrity

## Purpose

Build 269 activates the repository-resident duplicate-safe private raw-media intake boundary over the Build 268 recovery-hardening closure. It closes the missing standalone schema artifact, proves bounded content-sample fingerprinting and server-side duplicate/recovery classification before binary transfer, and retains exact multipart/R2 completion integrity.

This release does **not** manufacture live Production private-media acceptance. Missing Production schema/binding prerequisites continue to fail closed before upload.

## Exact predecessor

Build 268 is the exact source predecessor.

- Development SHA: `139310232fb103cb2c843dc4d409ecdb7d4bb701`
- Production main SHA: `44da8087958eb0c64df3de892ca8628293a96231`
- Exact predecessor proof is recovered live in the Build 269 workflow using the reusable exact-SHA proof composition.
- Build 268 retained all live private-bucket/interruption acceptance gaps explicitly.

## Build 269 schema integrity

The runtime and aggregate schema already require the Build 269 fields, but the standalone migration named by the runtime was missing. Build 269 restores that deployment artifact as `database_build269_caip_social_project_dedupe_integrity.sql`:

- `content_fingerprint`
- `content_fingerprint_version`
- `recovery_of_file_id`
- same-project strong-fingerprint lookup index
- recovery-lineage lookup index
- non-destructive migration-ledger entry

The migration is additive-only and is never executed from request-time code. Production application remains an operator-controlled D1 migration step after backup and prerequisite review.

## Duplicate-safe pre-transfer boundary

Before a new physical upload identity is created:

1. the browser calculates bounded `sample_sha256_v1` content identity from start/middle/end samples;
2. the server repeats same-project classification using exact file size plus strong content fingerprint;
3. an exact match is classified as skip, registration-only, resume, clean recovery, or new;
4. a renamed copy with unchanged bytes remains detectable after strong fingerprints exist;
5. a different same-size file with a different sample fingerprint is not treated as a duplicate.

Filename and legacy metadata fingerprint remain compatibility evidence, not authoritative duplicate identity.

## Recovery lineage and immutable originals

Integrity-failed recovery receives a new `file_key`, object key and multipart identity while retaining `recovery_of_file_id`. Completed raw originals remain immutable. Strong sample fingerprints prevent accidental re-upload but do not authorize physical deletion.

Physical duplicate deletion still requires verified whole-object checksum equality plus reference and exact R2 object checks. Uncertain binaries are retained.

## Multipart completion integrity

R2 multipart finalization remains fail closed:

- every expected D1 part row must exist;
- every part must be uploaded with an ETag;
- part numbers must be distinct and span 1 through `expected_parts`;
- uploaded byte sum must exactly equal `file_size_bytes`;
- `[CAIP_MULTIPART_INCOMPLETE]` blocks R2 `complete()`;
- after finalization, R2 HEAD must report exact expected size;
- `[CAIP_R2_SIZE_MISMATCH]` blocks registration and preserves the binary for review.

Part-plan persistence and fingerprint backfill stay bounded; fingerprint backfill is capped to small operator-requested batches.

## Fail-closed readiness

Select/Upload is not ready unless all three prerequisites are proven:

1. Build 241 private-media tables;
2. Build 269 duplicate-safe columns;
3. `CAIP_PRIVATE_MEDIA_BUCKET`.

A missing prerequisite is an operator/configuration state, not upload success.

## Production acceptance still pending

Build 269 source/runtime acceptance is distinct from live private-media acceptance. These remain explicit evidence gaps:

- Production private R2 binding and proof the raw bucket has no public exposure;
- real Production interruption/reconnect/reselection/resume;
- real multipart survival and exact post-complete HEAD-size evidence;
- authenticated/privacy/phone-desktop review where applicable;
- Startup/Operational Continuity acceptance evidence.

## Closure target

`PRIVATE_RAW_MEDIA_INTAKE_INTEGRITY_SOURCE_READY_DEPLOYED_ACCEPTANCE_EVIDENCE_PENDING`

No Production media is uploaded, deleted, reconciled or published by this release process. No uncertain R2 deletion, provider publication, Product publication, Inventory movement, Finance posting or synthetic acceptance is authorized.

Canada/CAD commerce and the U.S. shipping pause remain unchanged.

## Next bounded release

The future queue **has not run out**.

Next: **Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation**.
