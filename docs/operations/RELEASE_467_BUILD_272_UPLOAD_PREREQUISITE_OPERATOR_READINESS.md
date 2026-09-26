# Release 467 Build 272 — Upload Prerequisite & Operator Readiness

## Purpose

Build 272 turns CAIP private-media prerequisites into an explicit operator state before the browser requests a local file and before any binary transfer can start.

The three mandatory prerequisites are:

1. Build 241 CAIP private-media tables.
2. Build 269 duplicate-safe columns: `content_fingerprint`, `content_fingerprint_version`, and `recovery_of_file_id`.
3. A deployed private R2 binding named `CAIP_PRIVATE_MEDIA_BUCKET`.

## Exact predecessor

Build 271 is the exact verified source boundary.

- Development SHA: `af45e733b673af8e8d7e9acb7e55e35f525bebec`
- Production main SHA: `fce84316c0b5b22781b2ee30d35b205d96b39c09`
- identical tree: `f0da384a9d0be6f54d5e0b441f7aa333c158e69f`
- Development proofs: System `36208079958`, Quality `36208080087`, I.T. `36208080075`, Hygiene `36208080004`, Build 271 `36208079968`
- Production proofs: Pages `36208228266`, Live Resources `36208267834`, Product Browser `36208267848`, Product Route `36208267804`, Build 271 `36208228296`

## Operator readiness contract

`getCaipMediaIntakeReadiness` now returns a structured prerequisite list, blocker codes, operator actions, `selection_ready`, `upload_ready`, `transfer_ready`, and the Build 272 readiness classification.

If Build 241 or Build 269 database prerequisites are missing, GET remains an authenticated, non-mutating readiness surface instead of collapsing into a transfer failure. Existing Creative Projects can still be listed so the operator sees what is blocked and why.

When readiness is blocked, the screen disables the file input, Choose button, dropzone keyboard/drop behavior, resume-source file picker, safe replacement route, and upload-session button.

## Server-side bypass protection

The browser is not the security boundary. `requireCaipMediaUploadReadiness` is called by the control-plane transfer actions and by both raw binary endpoints: direct private-R2 upload and multipart part upload.

A blocked prerequisite returns `409` with `CAIP_UPLOAD_PREREQUISITE_BLOCKED`, `operator_state: BLOCKED_PREREQUISITE`, and `transfer_started: false`.

The multipart endpoint performs that check before marking a part failed. A configuration/readiness blocker therefore does **not** create transfer-failure evidence.

## No automatic repair

Build 272 does not install D1 schema, mutate Cloudflare bindings, create a bucket, capture a secret, or fabricate acceptance. The operator is told which prerequisite is missing and which explicit configuration/migration action is required.

No schema migration is added by this release.

## Safety boundary

No automatic Product publication, Content Studio creation, provider execution/publication, Inventory movement, Finance posting, Production business-data copy, uncertain R2 deletion or public-media promotion is authorized.

Canada/CAD commerce and the U.S. shipping pause remain unchanged.

## Closure target

`UPLOAD_PREREQUISITES_FAIL_CLOSED_BEFORE_SELECTION_AND_TRANSFER`

## Next bounded release

The queue **has not run out**.

Next: **Build 273 — Content Studio Standalone-Project Bridge**.
