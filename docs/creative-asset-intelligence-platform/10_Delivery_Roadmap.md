# 10 — CAIP Delivery Roadmap

## Implemented through Build 241

- governed CAIP project/assets/evidence/story model;
- metadata analysis and destination recommendations;
- technical observations and safe R2 HEAD probes;
- derivative recipes/plans;
- authenticated secure review;
- catalog/release bridges;
- dedicated private raw-media schema;
- multipart intake/recovery state;
- Worker-streamed private R2 multipart fallback;
- internal-only raw asset registration;
- planned proxy/extract/transcript jobs;
- review-only public-promotion request;
- responsive large-media intake UI and degraded fallback;
- sanitized private-intake manifest extension.

## Next CAIP priorities

1. Create/bind/prove the real private production R2 bucket.
2. Complete interruption/recovery tests with large MOV/MP4 files on home Wi-Fi and phone.
3. Add memory-bounded SHA-256/fingerprint verification.
4. Add direct browser→R2 S3 multipart signing/CORS adapter with short-lived scoped authorization.
5. Add orphan multipart reconciliation/expiry cleanup for **unfinished** sessions only.
6. Implement proxy-video provider adapter and verified output records.
7. Implement thumbnail/frame extraction provider.
8. Implement audio extraction/transcription provider with retry/cost limits.
9. Build scene/timecode evidence selection using verified extracted artifacts.
10. Add reviewed story-analysis/lessons recommendations without inventing facts.
11. Add derivative-generation workers for approved recipes.
12. Add public-promotion executor that rechecks current rights/consent/privacy at execution time.
13. Link promotion outputs to Content Release Board/provider IDs and URLs.
14. Add camera-first mobile capture directly into a Creative Project.
15. Add project-level storage/processing cost and retention dashboard.
16. Add archive/export manifest with checksums and restore rehearsal.

No roadmap item is considered delivered merely because its schema or queue record exists.

## Build 269 delivered

- bounded content-sample fingerprints before binary transfer;
- renamed-file same-project duplicate prevention;
- explicit skip / registration-only / resume / clean-recovery / new classification;
- recovery lineage with new R2 object identity;
- multipart completion guard that proves expected rows, ETags, contiguous range and byte total before R2 finalize;
- exact R2 HEAD size verification after finalize;
- bounded D1 part-plan batching;
- bounded strong-fingerprint backfill for already-uploaded private R2 objects;
- standalone/social CAIP progress context linking Creative Process inventory/cost authority to raw intake → evidence → story → Content Studio handoff.

## Next CAIP priorities after Build 269

1. Apply Build 269 D1 migration and backfill strong fingerprints for the current standalone/social project in bounded batches.
2. Re-upload only the integrity-failed `EDSS9755.MOV` source through the clean recovery row and verify 121/121 parts + exact R2 size.
3. Archive stale duplicate recovery rows after the canonical R2 objects are verified; do not physically delete uncertain binaries.
4. Finish the remaining raw footage with duplicate-safe preflight.
5. Move the project into CAIP evidence selection: mark useful process/mistake/repair/technique/outcome evidence and review rights/privacy.
6. Build story segments/timecode references from reviewed evidence.
7. Create the reviewed Content Studio/social-package handoff for the productless project.
8. Then add real proxy/frame/audio/transcript processing providers; do not mark planned jobs complete until provider output is verified.
