# Devil n Dove — Release 467 Builds 429–438 Roadmap

**Authority:** roadmap planning only. This document is not proof of Development or Production GREEN. All builds require the exact-SHA four-proof Development gate, successful Preview, the protected Production Pages Deploy workflow, and live verification before any Production GREEN claim. No automatic marketplace publication, owner decision, U.S. shipping reactivation, or direct production DB overwrites.

| Build | Planned title | Concrete scope | Acceptance evidence |
|---|---|---|---|
| **429** | **Production Deployment Verification & Release Status Reliability** | Query all four required workflow-specific exact-SHA proofs; report pass, failure, missing or API-inaccessible state; keep a downloadable artifact | Regression covers green/failed/missing/wrong SHA/API errors; no deployment bypass |
| **430** | Production Deployment Receipt & Live Version Verification | Bind production deploy run ID, SHA, Cloudflare deployment identity and live HTTP asset identity into a verifiable read-only receipt | Independently reproducible comparison and explicit unknown status |
| **431** | Release Gate Dashboard & Human-Readable Blocker Reasons | Display missing checks, workflow links and retry guidance in I.T. Admin without falsely marking GREEN | End-to-end proof for each warning and role-scoped read view |
| **432** | Deployment Rollback Readiness & Safe Recovery | Record known-good source/asset checkpoint; rehearse rollback plan without triggering automatic rollback | Non-mutating rehearsal, safeguards against DB or private media overwrite |
| **433** | Brand V3 Remaining Customer Placeholder Replacement | Audit Tools, Supplies, Toolshed, Workshop-Made Gifts and remaining media fallbacks; replace appropriate illustrative SVGs with correctly sized art | Slot-level manifest, no overwriting owner-selected images, mobile/desktop screenshots |
| **434** | Public Search & Workshop Catalog Boundaries | Prove public search excludes inventory-only tool/supply records and that Tools/Supplies remain informational; verify Movie Shelf navigation | Public route and API regression, no accidental purchase CTAs |
| **435** | Brand V3 Theme Tokens & Accessibility | Consolidate documented purple/gold/neutral design tokens, contrast, focus, headings and responsive spacing | Keyboard and responsive audits without changing product content |
| **436** | Admin Artwork & Media Content Studio Reliability | Validate mapped Admin artwork, missing WebPs, recoverable media states and owner-selected asset priority | Asset existence check, fallback/error handling, no silent overwrite |
| **437** | Storefront Purchase & Shipping Safety Review | Validate Canada-first shipping restriction, checkout pricing/availability and gift-card flows without turning on US shipping | Simulated cart/checkout tests and explicit preserved regional policy |
| **438** | Release Evidence Consolidation & Next Roadmap Renewal | Package current proof links, media/search audit outcomes and remaining defects; generate subsequent approved build plan | Signed-off source-backed next-cycle queue, no fabricated deployment GREEN |

## Prioritization and continuity

Do **430–432 first** to stabilize trustworthy deployment and rollback reporting before the visual/UI batch. Complete **433–436** next to address the customer-site and Admin concerns already identified. Follow with **437** for transactional safeguards and **438** for evidence-based renewal.

Do not auto-advance simply because a build is committed or `dev` equals `main`; the Cloudflare live deployment must be independently verified. If a workflow result is inaccessible, show `UNKNOWN`, not `GREEN`. If a run failed, name the exact workflow and link the run. When new requirements are discovered, update this roadmap explicitly instead of inventing an undeclared build.
