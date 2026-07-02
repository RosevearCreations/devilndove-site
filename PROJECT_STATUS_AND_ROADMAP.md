# Devil n Dove Project Status and Roadmap — Build 201

This is the primary business and release-readiness source. `AI_HANDOFF.md` contains deployment/operating rules. `MARKDOWN_INDEX.md` identifies specialist references. `docs/creative-asset-intelligence-platform/README.md` is the authoritative CAIP subsystem specification.

## Executive sanity check

Devil n Dove now has a governed end-to-end **creative preparation loop**:

```text
Approved finished product
→ Content Studio source-linked package
→ CAIP asset/evidence/story intelligence record
→ Review-first release drafts
→ explicit public approval/publish gate
```

Build 201 deliberately adds the missing intelligence/control layer instead of jumping straight to automation that could lose photos, invent claims, or imply that a video/post exists. It makes each asset traceable, keeps consent/public-release decisions separate, and makes the next renderer/publisher work safer to build.

## What now works

1. Approved/published finished products create a Content Studio package without changing original images, videos, R2 records, gallery order, or featured media.
2. Content Studio still holds the 1 YouTube / 3 Facebook / 5 Instagram Reel / 5 TikTok production plan plus website gallery, GBP, SEO, blog, thumbnail, caption, and review work.
3. Content Release Board prepares and governs Workshop Journal and website-gallery drafts, including factual-copy, public-media, title/meta, slug, approve, publish, unpublish, and manual-observation controls.
4. CAIP creates a canonical creative project for each Content Studio project and a reference-only asset register for its media sources.
5. CAIP carries source safety forward, permits only the same or stricter internal rights state, and exposes a manual rights/review choice without bypassing upstream consent.
6. CAIP produces explainable metadata scores—not magic quality ratings—for technical suitability, story usefulness, reuse suitability, confidence, and human-review need.
7. CAIP generates source-linked evidence records and editable/lockable story sections so the eventual video, caption, blog, SEO, and gallery work starts from facts rather than ad-hoc memory.
8. CAIP suggests review candidates for hero, gallery, thumbnail, and short-video roles while leaving all destination approval/publication to existing downstream workflows.
9. CAIP records policy signals, sync runs, project events, and an exportable manifest for auditing and future provider adapters.
10. Desktop and mobile administrator surfaces have compact cards, readable status areas, reachable forms/actions, and visual placeholders where no approved source asset exists.

## Business-model value

- A finished piece becomes a reusable, reviewable business asset rather than an orphaned group of phone photos.
- The team can choose content based on a visible reason and reliable source record, which makes it easier to build an honest story around handmade, vintage, experimental, custom, giftable, or workshop work.
- Content effort becomes measurable as time/review/release work rather than “make more posts,” helping us decide which projects deserve a larger video, gallery, article, listing, or local profile update.
- The foundation is reusable for future detailing jobs, custom requests, educational process clips, and maker content only after their consent/client-visibility rules exist.

## CAIP 20-step Build 201 completion list

1. CAIP boundary and charter.
2. Current architecture mapping.
3. Reference-only source ownership.
4. Canonical creative-project identity.
5. Canonical asset registry and fingerprint.
6. Source-safety/right inheritance.
7. Manual asset review metadata.
8. Transparent metadata score model.
9. Exposed score rationale.
10. Evidence ledger.
11. Editable/lockable story spine.
12. Destination candidate generation.
13. Governance policy signals.
14. Run/event records.
15. Exportable manifest.
16. Responsive CAIP console and visual placeholders.
17. Content Studio create/refresh/media-review synchronization.
18. Failure isolation and runtime incident recording.
19. Migration/schema/handoff/smoke-test documentation.
20. Full enterprise architecture, storage, governance, API, operations, migration, and acceptance specification.

The complete CAIP step-by-step version is in `docs/creative-asset-intelligence-platform/10_Delivery_Roadmap.md`.

## Search, public-content, and visual guardrails

- Publish only useful, substantive content that is visibly supported by source records and selected approved media; do not create thin pages just to add keywords.
- Public title/meta/schema, visible text, availability/material/condition statements, and associated media must agree.
- Use descriptive alt text for real approved media. Decorative placeholders must be empty/neutral and never presented as proof of a product, project, service, or before/after result.
- Keep the essential public content and media available on mobile and desktop; do not hide meaningful copy or media solely on smaller screens.
- Treat any future AI output as proposed internal material until reviewed. Do not use a model score, caption, transcription, or enhancement as consent, factual verification, accessibility text, originality proof, or legal clearance.

## What is not yet done

- Real technical media probing, durable source hashing, private signed review access, object lifecycle/retention/hold policy, or derivatives.
- AI provider registry/job processing, vision/transcript/LLM adapters, prompt/version/evidence capture, model cost controls, and human-review escalations.
- Timeline/storyboard editor, actual video render jobs, thumbnail generation, brand templates, or output verification.
- Platform-specific OAuth connections, previews, publish ledger, reply/metrics ingestion, or direct Google Business Profile publishing.
- Server-rendered/pre-generated content story pages/sitemap expansion after real content and Search Console evidence warrants it.
- Detailer/job/custom-order adapters and their consent/client-private/public rules.

## Next implementation wave

1. Live-deploy Build 201, test media integrity and permission restrictions, and retain evidence of the result.
2. Add technical probe and derivative-recipe foundations before manipulating media.
3. Add R2 secure-access/lifecycle controls before external providers receive any sources.
4. Add an idempotent asynchronous intelligence job fabric with budget/cancel/retry/reconcile controls.
5. Add opt-in provider adapters with full evidence/privacy/review contracts.
6. Build a human storyboard/timeline workspace consuming approved CAIP assets and evidence.
7. Add a renderer/export adapter with signed source manifest, output verification, watermark/template/disclosure policy, and manual fallback.
8. Add destination validators and only then OAuth-backed publish preview/confirmation, per-account scope controls, and delivery logs.
9. Evaluate public story rendering/sitemap only with published-quality and indexing evidence.
10. Add real analytics ingestion with source/date provenance; reconcile it to actual enquiries/orders rather than treating views as sales.
