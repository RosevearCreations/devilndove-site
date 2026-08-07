# Devil n Dove Project Status and Roadmap — Build 241

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture/deployment authority. This file owns current progress, risks and ordered next actions.

## Build 241 completed work — twenty advances

1. Rewrote the supplied Rosie Dazzlers DAIP large-media architecture into Devil n Dove CAIP terminology, media roles, storage prefixes, privacy rules and creative-output goals.
2. Added the dedicated private raw-media design around optional production binding `CAIP_PRIVATE_MEDIA_BUCKET` while retaining `PRODUCT_MEDIA_BUCKET` for reviewed public/product media.
3. Added D1 settings, upload-session, upload-file and upload-part tables so metadata/state stays in D1 and large binary files stay in R2.
4. Added deterministic generated object keys under `projects/{creative_project_id}/raw/*` instead of using personal/customer names as storage authority.
5. Added supported image/video/audio validation and Devil n Dove-specific media roles: before/during/after/material/tool/process/mistake/repair/finished product/packaging/narration/B-roll/reference.
6. Added adaptive multipart sizing with a 32 MiB default, conservative parallelism and R2 part-count/size safety boundaries.
7. Added authenticated same-origin multipart initiation, per-part upload, ETag recording, completion verification and unfinished-upload abort.
8. Added interruption recovery so completed R2 parts remain recorded; the UI explicitly explains that a local file may need reselection after a full browser restart.
9. Added private raw-original immutability: completed raw uploads have no intake delete/overwrite control and transformations must target new derivative namespaces.
10. Added private `media_assets` + CAIP `creative_assets` registration after verified R2 completion with no public URL.
11. Added CAIP technical observation evidence for completed private uploads and updated R2 probe/review resolution so private assets use the private binding.
12. Added planned metadata/thumbnail/proxy/frame/audio/transcript jobs while retaining `not_configured` provider status—no false claims that processing ran.
13. Added governance editing for privacy/consent/rights and review-only public-promotion requests that create no public copy.
14. Extended portable CAIP manifests with sanitized private-intake sessions/files/jobs/promotion requests while excluding raw R2 multipart upload IDs.
15. Added responsive `/admin/creative-assets/` private-media UI with drag/drop, batches, per-file progress, pause/resume/retry, duplicate warnings, offline copy and a visual hero.
16. Removed request-time CAIP schema creation from retained intelligence/operations helpers; Build 241 migration now owns installation.
17. Synchronized `database_build241_caip_large_media_intake.sql`, byte-identical current-pass SQL and all three aggregate schema files, including an idempotent shared `media_assets` dependency for fresh/scoped aggregates.
18. Added the 21st Operational Continuity workstream and 46th Startup gate with twelve production tests for private R2, recovery, immutability, secure review, processing honesty and promotion boundaries.
19. Added CAIP unit/integration regression, Build 241 public-page audit and full `/assets/` reference audit. Current static SEO result is 36/36 public pages passed with one H1 and zero missing local assets.
20. Rewrote CAIP storage/ingestion/governance/API/reliability/roadmap/testing documents and consolidated current cross-project direction back to `AI_HANDOFF.md` + this file.

## Retained Build 240 foundation

Operational Continuity remains active with production evidence cases, idempotency claims, packaging inventory reservations, verified formula links, packaging release locks/prepress checks, provider/notification reconciliation, mobile evidence recovery, deployed-asset checks, product media roles, support history, accounting close checklist, controlled batch approvals, local SEO observations, public-page audit records, route fallback policies and seven mobile operations cards.

Build 241 adds one CAIP workstream rather than duplicating these authorities, bringing active workstreams to 21.

## Current position

Devil n Dove now has broad foundations for storefront/catalog, inventory, orders/payments/refunds, packaging, Creative Process, CAIP, Content Studio, publication governance, visual evidence, SEO operations, launch control and accounting/support continuity.

CAIP is materially stronger: it can now be the private project-footage intake/evidence authority instead of only referencing existing catalog media. However, Build 241 local code cannot prove the real Cloudflare private bucket, interruption recovery over real home/mobile networks, provider processing, public promotion, payments, email, auth, or physical packaging. Those remain evidence gates.

Status remains **production-evidence and controlled-opening preparation**, with CAIP large-media intake ready for deployed binding/testing.

## Known gaps and risks

- `CAIP_PRIVATE_MEDIA_BUCKET` is not automatically created by the repository; production binary intake remains blocked until it is deliberately created/bound and kept private.
- Current media transport is Worker-streamed multipart. Direct browser→R2 S3 multipart is the preferred future large-video path but is not implemented.
- Browser-local file handles cannot be silently restored after a full browser close; resume can require reselecting the same file.
- Metadata fingerprinting warns of duplicates but is not yet a full memory-bounded content SHA-256 strategy for multi-gigabyte files.
- Proxy video, thumbnails, frame/audio extraction, transcription and AI/story analysis are planned job records only until providers are implemented and verified.
- Public-promotion request is intentionally review-only; no Build 241 executor copies private raw media into the public bucket.
- Completed raw originals currently have no destructive retention worker. Legal/privacy retention/deletion policy must be designed before automated deletion exists.
- Payment webhook signature/duplicate/refund/exact-once stock evidence remains open.
- Final-unit/component concurrency remains open.
- Transactional email delivery/retry remains open.
- Login/session production verification remains open where Startup evidence has not been completed.
- Soap formula/INCI/bilingual and physical print/wrap proof remain open per launch product.
- Candle-top dimensions/material/laser proof remains open per real blank/template.
- Generated/representative imagery cannot replace exact product/project evidence where the manifest requires real photography.
- First-page local Google placement cannot be guaranteed; relevance, distance and prominence must be measured rather than promised.

## Next 20 steps after Build 241

### P0 — production evidence / controlled-opening blockers

1. Back up D1, confirm ledger key `build240_operational_evidence_continuity`, apply Build 241 once, and verify `build241_caip_large_media_intake`, 21 workstreams and 46 Startup gates.
2. Create the real private R2 bucket, bind it as `CAIP_PRIVATE_MEDIA_BUCKET` in Production, and prove no public `r2.dev`/custom-domain access exists.
3. Run the full `caip_private_large_media_intake` gate with at least one real image and large MOV/MP4, including deliberate network interruption and resume.
4. Verify private CAIP secure-review grants against the new private bucket: admin ownership, expiry, view cap, revoke, no-store and no public access.
5. Complete the production login/session fourteen-step evidence run and correlate 5xx/CPU/memory outcomes with Cloudflare logs.
6. Complete Product Editor autosave/reload/browser-recovery production proof and confirm temporary 5xx never becomes destructive false state.
7. Prove Stripe signed webhook handling, duplicate delivery rejection and exact-once order/payment/inventory settlement.
8. Prove final-unit and component-set concurrency with simultaneous owner-controlled sessions.
9. Complete failed/abandoned/cancelled and partial/full refund evidence with stock, tax, fee, credit note and refund confirmation reconciliation.
10. Complete transactional order/receipt/refund/fulfilment email delivery, provider ID, retry and failure diagnostics.
11. Complete D1/R2/deployment/configuration restore rehearsal, including one CAIP private-media recovery check.
12. Complete each launch soap formula/INCI/bilingual/metric quantity/address/contact review and measured print/wrap proof.
13. Complete each launch candle-top/round measurement, reusable template, self-contained export, material settings and physical laser/print proof.
14. Finish exact launch-product/item photography in `/admin/image-manifest/`; keep representative/generated media out of exact product proof roles.
15. Complete a paid fulfilment and a separate refund recovery with non-secret retained evidence.

### P1 — CAIP/media and operational stabilization

16. Add a memory-bounded client fingerprint/checksum path suitable for large files and reconcile duplicate candidates without destructive auto-deduplication.
17. Build the short-lived direct browser→private-R2 S3 multipart signing/CORS adapter; retain the Worker-streamed path as a fallback and compare reliability/cost.
18. Add orphan/stale multipart reconciliation for unfinished sessions, including explicit expiry/abort evidence without touching completed immutable originals.
19. Implement the first real processing adapter—prefer proxy video + thumbnail/frame extraction—with idempotency, retries, cost caps, verified checksums/metadata and honest provider results.
20. Implement public-promotion execution only after current rights/consent/privacy revalidation; copy only an approved derivative/public candidate, record the public object/provider ID/URL, and hand it to Release Board rather than silently publishing.

## After those twenty

Prioritize transcription/timecode evidence, reviewed scene/story analysis, mobile camera-first project capture, derivative generation, Content Studio auto-packaging, provider publication/result reconciliation, project storage/processing cost, retention/archive manifests and progressively richer automated content—without weakening evidence, rights or review boundaries.

## SEO/local-search direction each pass

Run a public audit on every pass: one H1, concise distinctive title, useful description, canonical, crawlable descriptive links, relevant image/alt text, visible/structured fact agreement, mobile parity and no thin/duplicate indexable pages. Use natural Ontario/Southern Ontario/service language only where it matches a real offering. Maintain useful local/service pages, complete Business Profile facts/photos/services/hours and measure Search Console/Business Profile/local conversions rather than guessing rankings.

Google first-page placement is a goal, not a guarantee. Local ranking depends heavily on relevance, distance and prominence; distance cannot be engineered away.
