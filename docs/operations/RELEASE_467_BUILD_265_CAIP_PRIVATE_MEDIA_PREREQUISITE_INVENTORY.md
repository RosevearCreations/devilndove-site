# Release 467 Build 265 — CAIP Private-Media Prerequisite Inventory

## Purpose

Build 265 begins the Builds 265–275 CAIP Recovery & Continuity roadmap from the exact Build 264 Development/Production baseline. This build is **inventory and evidence only**. It does not upload, alter, copy, publish, overwrite, abort, or delete Production media.

## Exact predecessor

- Build 264 Development merge SHA: `9017e145286f2007646a1f4de9ebdb670ca23881`
- Build 264 Production main SHA: `9cf042afb9b7938f160df89b49b82376eb8f9291`
- Predecessor proof mode: exact-SHA composition using the retained named Development and Production proofs.
- The Build 264 authority, closure and successor-roadmap blobs were verified identical on `dev` and `main` before Build 265 work began.

## Build 241 schema authority

Repository evidence already records the Build 241 private-media foundation as **ready for deployed evidence**, not as Production-accepted media transport.

- migration authority: `database_build241_caip_large_media_intake.sql`;
- six CAIP private-media tables;
- current-pass migration is recorded byte-identical to the Build 241 migration;
- aggregate schemas are synchronized;
- request-time DDL is disabled;
- 21 active operational workstreams and 46 active Startup gates are recorded;
- the deployed private-media gate remains evidence-dependent.

Build 265 does not apply a migration and does not write D1.

## Storage prerequisite inventory

### Private raw-media authority

`CAIP_PRIVATE_MEDIA_BUCKET` is the required private R2 binding for CAIP binary intake.

The private bucket must remain non-public: no `r2.dev` access and no public custom domain. D1 is the metadata/state/rights/evidence authority; R2 is the binary authority. Generated project/file IDs are used for object identity rather than customer or personal names.

### Existing public-media authority

`PRODUCT_MEDIA_BUCKET` remains the separate approved/public path. Build 265 does not repoint it, create a public copy, or treat private raw media as publicly approved.

### Raw-original policy

The active raw namespace is `projects/{creative_project_id}/raw/*`. Successful raw originals are immutable through the CAIP intake control. An unfinished multipart session may be recovered/aborted by its existing authority, but a completed raw original is not overwritten or deleted by this inventory build.

## Multipart and recovery prerequisite inventory

The current implemented transport is authenticated same-origin Worker-streamed multipart upload:

- default part size: **32 MiB**;
- conservative parallelism: **2 parts**;
- fallback route refuses parts above **256 MiB**;
- completed-part continuity is represented by D1 part number, byte range, status, attempt count and R2 ETag;
- interruption must preserve completed parts and resume only the remaining transfer;
- after a full browser restart, the owner may need to explicitly reselect the same local file because the browser cannot silently reopen it;
- the preferred future `direct_s3_presigned_multipart` transport is documented but is **not live**.

Build 265 does not exercise multipart upload against Production.

## Current operator prerequisites

Before live binary intake can be declared accepted, the deployed environment still needs evidence that:

1. Build 241 schema authority is installed and synchronized.
2. Production Pages exposes `CAIP_PRIVATE_MEDIA_BUCKET`.
3. The private bucket has no public `r2.dev` or custom-domain access.
4. The operator works from an existing reviewed Creative Project in `/admin/creative-assets/`.
5. A real upload can be interrupted and resumed without intentionally resending completed parts.
6. Completion verifies the exact private R2 object and creates only internal CAIP/media registration.
7. Secure review is authenticated and no-store.
8. rights, consent and privacy remain review-gated.
9. a public-promotion request creates no automatic public object.
10. phone/tablet/laptop/desktop upload controls and recovery states are usable.
11. recorded Production evidence contains no secrets or unnecessary personal information.

The retained Build 241 validation summary still identifies the principal Production-only remaining work as: create/bind the private CAIP R2 bucket, prove real multipart interruption/resume, and finish the applicable Startup evidence.

## Build 265 result

**Classification:** `PREREQUISITES_INVENTORIED_NOT_PRODUCTION_ACCEPTED`

The repository already contains the required schema, storage, multipart and operator contracts. The unresolved items are deployed-environment evidence/configuration, not permission for Build 265 to manufacture evidence. Therefore this build stays read-only and hands the documented multipart/recovery contract to Build 266.

## Safety

No schema change, request-time DDL, D1 business-data mutation, R2 mutation, private-media upload/delete, public-media copy, provider execution/publication, Product publication, Inventory movement, Finance posting, Production business-data copy, secret capture or synthetic acceptance evidence is authorized.

Canada/CAD commerce and the U.S. shipping pause remain unchanged.

## Next bounded release

The future queue **has not run out**.

Next: **Build 266 — CAIP Multipart Recovery Integrity Review**.
