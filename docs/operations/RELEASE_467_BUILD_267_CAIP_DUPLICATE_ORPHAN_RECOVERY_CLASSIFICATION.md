# Release 467 Build 267 — CAIP Duplicate & Orphan Recovery Classification

## Purpose

Build 267 defines bounded duplicate, recovery and orphan classifications over the existing CAIP private-media metadata and object-identity contracts. It is read-only: no Production media is uploaded, archived, overwritten, aborted or deleted, and uncertain binaries remain preserved.

## Exact predecessor

Build 266 is the exact Production predecessor: Development `c2f4a123b029853438260f06f0582a3902adf0c4`, Production main `1d4a1c204d19c4ecca16dd8dd6952b5107327db8`, shared tree `6986989e2aa860a639ed8d6748a0c3143b32054d`. Development proofs are System `36156294854`, Quality `36156294795`, I.T. `36156294784`, Hygiene `36156294718`, Build 266 `36156294779`. Production proofs are Pages `36156595435`, Live Resources `36156682258`, Product Browser `36156682086`, Product Route `36156682143`, Build 266 `36156595028`.

## Classification

- `REGISTERED_CANONICAL_IMMUTABLE`: uploaded and registered raw original; protect.
- `STRONG_DUPLICATE_CANDIDATE_REVIEW`: same project + strong content fingerprint + exact size; review, never automatic delete.
- `VERIFIED_REDUNDANT_COPY_REVIEWABLE`: strong duplicate plus equal verified checksums, no asset/processing/promotion references, distinct object key and exact R2 HEAD size. Existing explicit cleanup authority may be reviewed, but Build 267 executes no cleanup.
- `LEGACY_METADATA_DUPLICATE_CANDIDATE`: legacy metadata fingerprint + exact size only; preserve and strengthen evidence.
- `CHECKSUM_CONFLICT_PRESERVE`: verified checksum conflict; preserve all.
- `RESUMABLE_UNFINISHED_MULTIPART`: unfinished identity with retained part plan/ETags; resume the existing identity.
- `INTEGRITY_FAILED_PRESERVE_NEW_IDENTITY_RECOVERY`: preserve uncertain finalized binary; clean recovery receives a new identity.
- `RECOVERY_DESCENDANT_ACTIVE`: retain `recovery_of_file_id` lineage.
- `D1_COMPLETED_UNREGISTERED_BINARY_REVIEW`: uploaded D1 row without a Creative Asset is not a safe orphan; review registration/recovery.
- `OBJECT_ONLY_ORPHAN_CANDIDATE`: R2 raw object proven to lack D1 identity remains preserved pending reconciliation.
- `D1_ONLY_MISSING_OBJECT_RECOVERY`: D1/asset identity whose R2 object is proven missing remains preserved; recover using a new identity.
- `ARCHIVED_OR_ABORTED_HISTORICAL`: historical state does not prove a binary is safe to delete.
- `UNCLASSIFIED_REVIEW_REQUIRED`: unknown stays preserved and fails closed.

The current duplicate audit prefers `content_fingerprint` and falls back to legacy `file_fingerprint`, with exact size retained in the identity. The existing explicit cleanup path is stricter: physical R2 deletion is conditional on explicit operator intent, equal verified checksums, no Creative Asset, processing-job or promotion references, distinct object keys, and an exact-size R2 HEAD. Build 267 does not call or broaden that path.

## Result

`DUPLICATE_ORPHAN_RECOVERY_CLASSES_DEFINED_CLEANUP_NOT_AUTHORIZED`

No schema/request-time DDL, D1/R2 mutation, duplicate/orphan cleanup execution, uncertain R2 deletion, public-media copy, provider action, Product publication, Inventory movement, Finance posting, Production business-data copy, secret capture or synthetic acceptance is authorized.

The future queue **has not run out**. Next: **Build 268 — CAIP Private-Media Recovery Hardening Closure**.
