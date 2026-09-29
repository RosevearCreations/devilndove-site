# Release 467 — UX, Search & Database Efficiency Roadmap — Builds 290–300

## Queue status

- Future production queue: **READY**
- Queue exhausted: **NO**
- First build: **290**
- Last currently planned build: **300**
- Next build: **Build 290 — Inventory Multi-Station Read Integrity & Client-Native Memberships**
- Promotion boundary: exact GREEN Development before protected-main promotion.
- Production business data remains Production-owned.
- Forward-only canonical migrations only; no request-time schema mutation.
- No automatic external publication, provider execution, payment/refund, or accounting action.

## Starting baseline

This roadmap starts after the Build 289 Inventory many-to-many workstation stabilization/hang repair.

- Development SHA: `a9d1fe0d8a03e6ccfab8c1b7be3c5e0f005e4400`
- Production main SHA: `238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6`
- Shared tree: `9303662ce708b1c1c02c3a94c618d8f2704ca0a1`
- System Gate: `36517008091`
- Current Application Quality: `36517008088`
- I.T. Admin Runtime Proof: `36517008100`
- Repository Branch Hygiene: `36517008107`
- Production Pages Deploy: `36517150890`
- Production Live Resource Integrity: `36517221739`

## Roadmap objective

The next production queue prioritizes stabilization and simplification before further feature expansion. The sequence addresses client-side observer/render churn, CSS accumulation, public runtime failures, buyer-facing complexity, SEO/search-engine readiness, D1 read efficiency, legacy runtime schema compatibility, repository bloat, and the public storytelling value of real workshop experiments.

## Build 290 — Inventory Multi-Station Read Integrity & Client-Native Memberships

Make many-to-many workstation membership a native Inventory contract instead of a compatibility overlay.

- Return every workstation membership in the normal paginated Inventory read.
- Preserve one primary process/category for reporting and cost rollups.
- Preserve zero/one/many specific workstation tools per associated Tool/Supply.
- Remove reliance on the legacy first-station field for normal editor hydration.
- Begin retiring the global `window.fetch` compatibility wrapper in the multistation helper.
- Add regression coverage for Forge-like categories containing multiple workstation tools.
- Measure D1 rows read and prevent N+1 membership reads.

## Build 291 — Public Runtime Reliability & Broken-Surface Closure

Close currently visible public failures before expanding public functionality.

- Fix Capabilities JSON/runtime failure paths.
- Fix Creations API/public-route mismatch and graceful fallback behavior.
- Replace public raw implementation errors with customer-safe recovery states.
- Add route smoke/browser coverage across sitemap public pages.
- Fail visibly in diagnostics while failing gracefully for buyers.

## Build 292 — Client Runtime Observer & Memory-Churn Hardening

Reduce long-session main-thread churn and self-triggering DOM work.

- Inventory and classify active MutationObservers.
- Require bounded scope, mutation filtering and explicit disconnect/lifecycle behavior.
- Eliminate whole-document rescans where event-driven rendering is available.
- Consolidate duplicate page observers.
- Add long-session regression evidence for Inventory, Products, Packaging and storefront routes.
- Add an observer/render-budget gate for new client code.

## Build 293 — CSS Design-System & Responsive Consolidation

Replace accumulated CSS repair layers with a coherent design system.

- Separate public/storefront and admin concerns where practical.
- Establish canonical surface, text, border, focus, spacing, density and breakpoint tokens.
- Consolidate repeated selectors and overlapping media queries.
- Reduce unnecessary `!important` rules.
- Retire obsolete build-specific CSS after equivalence proof.
- Add contrast, overflow, dropdown, modal, dense-table and touch-target regression checks.

## Build 294 — CAIP Workshop Follies & Maker Story Foundation

Extend the existing Creative Process → CAIP → Content Studio architecture for real workshop experiments and maker stories. This build must compose existing authorities rather than create a parallel content platform.

### Authority model

- **Creative Process** owns project purpose, workstation/process relationships, tools/materials, planned-versus-actual usage, cost/time facts, outcome and lessons learned.
- **CAIP** owns private raw photo/video/audio, immutable source identity, media review, evidence selection, timecodes, story beats, narrative structure and derivative planning.
- **Content Studio** owns review-first channel deliverables such as Workshop Journal drafts, Maker Story scripts, Shorts/Reels/TikTok drafts, captions, gallery packages and SEO copy.
- **Public Release / Social Publishing** remains the explicit human approval boundary.
- One existing `creative_work_project` maps idempotently to one CAIP workspace and one Content Studio package. No duplicate Product, Creative Project, media store, social queue or publishing engine may be created for Follies.

### Folly / Maker Story facts

The Creative Project may classify itself as a workshop folly, experiment, maker story, research/learning project or ordinary creative project. A Folly/experiment should support:

- what we are trying
- why we are trying it
- primary process/category and zero/one/many specific workstation tools
- materials/tools actually used
- expected result
- actual result
- win / partial win / failure
- surprise or problem encountered
- lesson learned
- what we would change next time
- whether we would try it again
- optional resulting Product, Custom Work example, Capability, Workshop Knowledge entry or Journal entry

### Integration requirements

- Reuse the Build 271 standalone/productless Creative Project path.
- Reuse CAIP private media intake, fingerprinting, evidence review and source-safe planning.
- Reuse the Build 273/282 idempotent Content Studio bridge.
- Reuse existing reviewed publication/social authorities.
- Link the new many-to-many workstation model without duplicating Inventory authority.
- Permit a Folly to remain permanently productless.
- Preserve review-first publication; no automatic provider publication.
- Add regression evidence proving a Folly can traverse Creative Process → CAIP → Content Studio without duplicate project/media/content records.

## Build 295 — Storefront Buyer Journey Simplification

Make the public site feel like a small maker business rather than an operations console, now backed by the CAIP Folly/Maker Story content model.

Primary public paths:

1. **Shop something**
2. **Ask us to make something**
3. **Watch us try something**

Work includes:

- Remove Release/Build/authority/evidence language from buyer-facing copy.
- Simplify public navigation and mobile calls to action.
- Keep ordinary Shop search simple and move operator-like filters behind Advanced filters.
- Improve product browsing by human shopping intent rather than internal manufacturing fields.
- Add a human-friendly Workshop Follies / Maker Stories discovery path sourced from reviewed CAIP/Content Studio releases.
- Preserve rich internal data without exposing unnecessary complexity or private media.

## Build 296 — Custom Work Progressive Intake

Turn Custom Work into a progressive conversation.

- Start with what the customer wants made, reference image/file, quantity, approximate timing/budget and contact details.
- Reveal technical fields only when the chosen work requires them.
- Reuse existing manufacturing triage, customer-supplied-item and proof authorities behind the simpler intake.
- Allow accepted custom-work projects to flow into the same Creative Process → CAIP → Content Studio story path when the owner chooses to document them.
- Preserve accessibility, resumability and draft safety.
- Measure abandonment and completion friction without dark patterns.

## Build 297 — Search-First HTML, Product + Story SEO & Crawl Control

Move critical search identity out of post-load JavaScript for both Products and reviewed maker content.

- Initial HTML/server output owns title, meta description, canonical, Open Graph and Twitter metadata.
- Initial Product pages expose Product/Offer/Breadcrumb structured data.
- Reviewed Workshop Journal/Folly/Maker Story pages expose appropriate Article/BlogPosting/Breadcrumb structured data.
- Generate/maintain active Product and reviewed story sitemap coverage.
- Define canonical/noindex rules for arbitrary Shop search/filter permutations.
- Preserve intentional indexable collection/capability/story/landing pages.
- Remove obsolete structured-data features that no longer produce search features.
- Add structured-data and initial-head regression validation.

## Build 298 — Merchant/Search Distribution + Public Content Discovery

Use existing Product authority for merchant discovery while improving discovery of reviewed maker content.

- Build a reviewed Google Merchant Center feed/export path for eligible Canadian Product listings.
- Ensure Product URL, CAD price, availability, imagery, shipping and return facts stay consistent.
- Add IndexNow submission support for eligible public Product and reviewed story create/update/delete events.
- Improve Search Console/merchant diagnostics and measurable coverage.
- Add internal linking among Products, Capabilities, Workshop Journal entries and related reviewed Follies where factual relationships exist.
- No automatic publication to an external provider without explicit owner authorization.

## Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup

Treat D1 efficiency and accumulated compatibility cleanup as one bounded reliability build.

- Measure hot queries using rows-read evidence and `EXPLAIN QUERY PLAN`.
- Replace repeated leading-wildcard full scans where justified.
- Evaluate FTS5/trigram search for Inventory/Product/Creation/Story text search based on measured benefit.
- Batch workstation membership reads.
- Reduce redundant runtime schema introspection.
- Evaluate cursor/keyset pagination for large operational lists.
- Remove obsolete runtime `ensureSchema` / blocked DDL paths from retained APIs.
- Move any still-required schema shape into forward-only canonical migrations.
- Consolidate repeated schema-readiness probes behind bounded shared services.
- Deduplicate identical code/media copies where ownership allows.
- Archive or remove obsolete build artifacts only after reference/use proof.
- Preserve required release provenance and exact-SHA evidence.
- Keep provider rows-read budgets explicit in Development acceptance.

## Build 300 — CAIP Maker Content Outcomes Renewal & Automation Refinement

Close the roadmap by proving that the composed CAIP maker-content path works with real operator evidence and by refining only what measured use justifies.

Required end-to-end outcome:

**Creative Process → workstation/inventory facts → CAIP private media → reviewed evidence → story/edit plan → Content Studio package → Workshop Journal/social drafts → human approval → public release**

Measure:

- duplicate project/media/content rows: must remain zero
- private-source/media boundary integrity
- Folly/Maker Story operator completion friction
- Content Studio handoff reuse/idempotency
- reviewed Journal/social draft usefulness
- human-approval boundary integrity
- buyer discovery and story engagement where measurable
- public runtime errors
- client observer/render churn
- CSS regressions
- Core Web Vitals where measurable
- search crawl/index health
- Product/merchant coverage
- D1 rows read and query-plan quality
- repository/runtime reduction

Any automation refinement must remain review-first. Build 300 must not introduce automatic public/provider publication merely to improve throughput.

The evidence from Build 300 determines the next roadmap. The future queue is therefore **not exhausted**.

## Production queue

| Build | Title | Queue state |
|---:|---|---|
| 290 | Inventory Multi-Station Read Integrity & Client-Native Memberships | **NEXT / READY** |
| 291 | Public Runtime Reliability & Broken-Surface Closure | QUEUED |
| 292 | Client Runtime Observer & Memory-Churn Hardening | QUEUED |
| 293 | CSS Design-System & Responsive Consolidation | QUEUED |
| 294 | CAIP Workshop Follies & Maker Story Foundation | QUEUED |
| 295 | Storefront Buyer Journey Simplification | QUEUED |
| 296 | Custom Work Progressive Intake | QUEUED |
| 297 | Search-First HTML, Product + Story SEO & Crawl Control | QUEUED |
| 298 | Merchant/Search Distribution + Public Content Discovery | QUEUED |
| 299 | D1 Query Efficiency + Canonical Runtime/Repository Cleanup | QUEUED |
| 300 | CAIP Maker Content Outcomes Renewal & Automation Refinement | QUEUED |

## Queue contract

When Build 290 begins, it must first re-resolve the live `dev` and `main` branch heads and ingest the latest exact GREEN predecessor evidence. Each subsequent build remains blocked from Production promotion until its Development candidate is exact-SHA GREEN under the current release gates.
