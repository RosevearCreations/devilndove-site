# 12 — CAIP Testing and Acceptance

## Local/static Build 241 checks

1. Current-pass migration is byte-identical to `database_build241_caip_large_media_intake.sql`.
2. Build 241 migration has no explicit transaction-control statements and repeat-applies cleanly.
3. All three aggregate schema files create the six CAIP intake tables plus shared `media_assets` dependency.
4. Active Startup gate count is 46 and active operational workstream count is 21.
5. CAIP request routes contain no request-time `CREATE TABLE` statements.
6. CAIP admin page is `noindex,nofollow` with exactly one H1.
7. JavaScript syntax checks pass for all changed CAIP routes/helpers/UI.
8. CSS braces/containment and phone breakpoints pass static checks.
9. Unit/integration fixture creates a private upload session, part plan, private CAIP asset, planned video processing jobs, and review-only public-promotion request.
10. Portable CAIP manifest excludes raw multipart upload IDs and keeps private raw `public_url` null.

## Deployed private-bucket acceptance

1. Back up D1; apply Build 241 once.
2. Create/bind the dedicated private R2 bucket as `CAIP_PRIVATE_MEDIA_BUCKET`.
3. Verify no public `r2.dev` or custom-domain access is enabled on the raw bucket.
4. Upload a real image and large video from a Creative Project.
5. Confirm D1 holds metadata/state and R2 holds the binary.
6. Interrupt a multipart upload after several parts; reconnect/reselect if required and resume without intentionally resending completed parts.
7. Verify generated object keys contain project/file IDs rather than personal/customer names.
8. Complete upload and verify internal-only `media_assets`/`creative_assets` records with no public URL.
9. Confirm raw object cannot be overwritten/deleted through CAIP intake.
10. Create a secure review grant; test authentication, expiry/view cap and revoke.
11. Confirm planned processing jobs do not report completed outputs without a provider.
12. Request public promotion; verify it remains review-only and creates no public object.
13. Test errors: missing binding, wrong part size, failed part, lost network, stale session, duplicate candidate, revoked consent, blocked rights.
14. Test phone/tablet/laptop/wide-desktop drag/drop, file selection, progress, controls, horizontal overflow, focus and touch targets.
15. Record safe production evidence in Startup Readiness/Operational Continuity.

## Acceptance rule

Build 241 code may pass local regression without declaring the live Startup gate complete. Production acceptance requires the real binding and real interruption/recovery evidence.

## Build 269 acceptance additions

1. Apply `database_build269_caip_social_project_dedupe_integrity.sql` after the retained Build 264 migration boundary.
2. Select the same local file twice in one project; the second selection must not create another physical upload row/object.
3. Rename a local copy without changing its bytes; after strong fingerprints exist, CAIP must still identify it as the same source.
4. Select a different same-size file; a different sample fingerprint must not be skipped as duplicate.
5. Create a multipart fixture with fewer actual part rows than `expected_parts`; `completeUploadFile()` must reject it and the fake/real R2 complete call count must remain zero.
6. Verify a valid multipart fixture reaches R2 complete only after row/count/ETag/byte checks and is marked uploaded only after exact HEAD size.
7. Verify an integrity-failed prior attempt creates a new recovery row/key and preserves `recovery_of_file_id`.
8. Backfill strong fingerprints from existing R2 in bounded batches and verify no whole multi-GB object is read into Worker memory.
9. Confirm a content-only/productless Creative Project shows project/inventory context, raw-media stage, evidence stage, story stage and handoff stage without requiring a product.
10. Keep physical duplicate-object deletion gated on verified whole-object checksum + no downstream references.
