# 10 — Twenty-Step Delivery Roadmap

This is the CAIP subsystem execution list. It is synchronized with Build 201 and `../../PROJECT_STATUS_AND_ROADMAP.md`.

## Build 201 — the next 20 completed foundation steps

1. **Establish CAIP as a separate governed subsystem** rather than adding untracked fields to Content Studio. ✅
2. **Map current Devil n Dove boundaries**: product/catalog, Content Studio, Release Board, Social Queue, R2/source media. ✅
3. **Define reference-only source ownership** so CAIP cannot recreate prior media-loss paths. ✅
4. **Create a canonical creative-project identity** linked one-to-one with Content Studio packages. ✅
5. **Create a canonical asset registry** using stable source keys/fingerprints and logical archive paths. ✅
6. **Carry source safety into CAIP** and enforce no implicit elevation of public rights. ✅
7. **Add asset review metadata** for restrictive status, tags, and internal notes without touching source files. ✅
8. **Add deterministic transparent metadata analysis** with technical/story/reuse/review/confidence components. ✅
9. **Expose analysis reasons** so staff can see why a score exists. ✅
10. **Create evidence-backed source facts** from products and Content Studio records. ✅
11. **Create editable, lockable story segments** tied to evidence keys. ✅
12. **Generate reuse candidates** for website hero/gallery/thumbnail/short-video roles. ✅
13. **Add governance policy signals** for source integrity, rights, story provenance, and public-search readiness. ✅
14. **Add run records and project events** for traceability. ✅
15. **Add a CAIP manifest export** for review and future adapters. ✅
16. **Add the CAIP admin workspace** with mobile/desktop safe layout and visual placeholders. ✅
17. **Bridge Content Studio creation/refresh and media-review events to CAIP sync.** ✅
18. **Preserve Content Studio availability if CAIP sync fails** and log a warning incident instead. ✅
19. **Update migration/schema/handoff/smoke-test documentation** so CAIP is authoritative and deployable. ✅
20. **Create a provider-neutral enterprise design specification** covering storage, governance, API contracts, operations, and future adapters. ✅

## Next implementation wave — ordered, not yet completed

1. Deploy Build 201 and prove one real safe product through source → Content Studio → CAIP → Release Board with no original-media changes.
2. Add technical media probe jobs (resolution, duration, codec, orientation) with source fingerprint capture and bounded retries.
3. Add `creative_asset_derivatives` and immutable transformation recipes before any thumbnail/proxy generation.
4. Implement R2 signed-access adapter, CORS policy, private-review URLs, expiry, and access audit.
5. Add storage lifecycle classes, retention dashboard, legal hold, and human delete-review gates.
6. Build provider registry/configuration with encrypted credentials, per-provider feature flags, and no hard-coded model assumptions.
7. Add asynchronous intelligence-job queue with idempotency, budgets, cancellation, retry/backoff, and failure reconciliation.
8. Add opt-in AI vision/transcript adapters with output evidence, prompt/version capture, privacy controls, and mandatory human-review flags.
9. Add accessible human-written/approved asset descriptions and caption review—not automated alt-text publishing.
10. Add provenance graph and side-by-side source/derivative comparison.
11. Add storyboard/timeline editor that consumes approved CAIP segments and selected assets.
12. Add renderer adapter with signed input manifest, output verification, watermark/brand-template controls, cost caps, and manual fallback.
13. Add thumbnail derivative builder with truthful-title/visual policy checks.
14. Add explicit AI-altered media/disclosure flags through destination export templates.
15. Add per-channel export validator for aspect ratio, duration, file size, captions, title/thumbnail truthfulness, and review state.
16. Add OAuth account registry with least-privilege scopes, preview, user confirmation, rate limits, webhook verification, and revoke capability.
17. Add production publish ledger with idempotency and public URL/output verification.
18. Add public content rendering/sitemap strategy only after real indexing and content-quality evidence.
19. Add analytics ingestion with source/date provenance; reconcile views/clicks/enquiries against actual business evidence.
20. Add detailing-job/custom-order adapters only after consent and client-visibility controls are deployed and tested.

## Build 202 — completed operational safety steps

21. Added metadata-only technical observation records and bounded probe-job history. ✅
22. Limited probe inputs to saved catalog metadata and bound R2 `head()` only. ✅
23. Prohibited arbitrary source-URL fetches and binary/visual analysis in the first operations layer. ✅
24. Added source-fingerprint-bound observations and missing/partial/no-binding statuses. ✅
25. Added immutable derivative recipe records with policy snapshots. ✅
26. Added explicit planned-derivative records that remain `not_created` without a provider. ✅
27. Added four reviewable target briefs: gallery WebP, vertical social MP4, YouTube thumbnail WebP, internal preview WebP. ✅
28. Added internal plan approval that does not schedule or imply renderer work. ✅
29. Added disabled provider registry and CAD budget-control schema with no secrets. ✅
30. Added same-origin administrator-bound secure review grants with hash-only storage. ✅
31. Added expiry, view caps, revocation, access audit, no-store response rules, and no public redirect. ✅
32. Added CAIP workspace controls for probe, plan, approve plan, secure review, and revoke. ✅
33. Expanded JSON manifest contract with sanitized operations state. ✅
34. Added mobile/desktop responsive operations panels and a visual planning placeholder. ✅
35. Added Build 202 migrations, runtime fallback schema setup, smoke tests, and acceptance criteria. ✅
36. Updated the authoritative specification and current handoff docs. ✅
37. Kept Content Studio/Release Board/source-media failure isolation intact. ✅
38. Kept public SEO/release gates separate from technical plans. ✅
39. Added explicit no-secret/no-raw-token database rules. ✅
40. Added the next constrained provider/renderer/retention roadmap. ✅

## Next implementation wave — ordered, not yet complete

1. Deploy Build 202 and demonstrate one real product through probe, plan, secure review, and revoke without source-media changes.
2. Add source checksum verification using a bounded worker path and explicit object-read costs.
3. Add a bounded technical extractor for actual duration/codec/pixel metadata with versioned provider evidence.
4. Add a true derivative worker with separate output namespace, checksums, before/after comparison, and output verification.
5. Add legal hold, retention review, recovery and human-delete workflow before lifecycle automation.
6. Add renderer/export execution with signed input manifest, budget enforcement, retries, idempotency, output verification, disclosure/template policy, and manual fallback.
7. Add real thumbnail generation only after visual/title factual review remains enforceable.
8. Add final per-platform export validation immediately before a human publish confirmation.
9. Add OAuth publishing adapters only after connected-account proof, consent, preview/confirm, rollback, delivery evidence, and security review.
10. Consider server-rendered story pages/sitemap expansion only after genuinely published, substantive content and Search Console evidence.
