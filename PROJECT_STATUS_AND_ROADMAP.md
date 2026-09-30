# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Build 311 — Buyer Discovery Evidence Freshness & Search Intake** is the active Development candidate over exact Build 310 Production GREEN.

Build 310 is fully verified and promoted:

- Development SHA: **c1a4778dd3aaf2a1fece8406e075da7eb2c2b74d**.
- Exact tree: **b4aa3deaa0eed32bc601ecf51d5456e5c5d85760**.
- Production main SHA: **43120a39d39aa0b0a2b0299967ad2e7b97eab0ee**.
- Production Pages Deploy: **36709193312 — SUCCESS**.
- Production Live Resource Integrity: **36709277731 — SUCCESS**.

Build 311 remeasures buyer discovery in a **30-day** window and separates reviewed-story, reviewed-Product and other public-page Search Console attribution. Zero views, clicks or impressions remain valid evidence and are never synthesized.

Search Console CSV intake remains explicit operator action. Build 311 removes request-time table/index/column repair from the import endpoint; missing required Search Console tables now fail closed and must be repaired through the canonical database migration path.

IndexNow remains explicit-owner-only with the exact confirmation phrase `SUBMIT INDEXNOW`. No automatic Search Console import, provider execution, traffic fabrication, R2 mutation or Production D1 contact is authorized.

The queue **has not run out**.

**Next after Build 311 Production GREEN: Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal.**

Canonical roadmap: `docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md`.

---

## Retained historical provenance — Release 467 Build 153

Build 153 — Layout Observer Performance Hotfix — remains closed GREEN historical provenance.

- Incident addressed: Firefox long-script / page responsiveness caused by excessive layout-observer churn.
- Historical Build 153 canonical migration prefix was `0001–0004`; later forward-only canonical migrations remain valid successors and preserve that immutable prefix.

## Retained historical provenance — Release 467 Build 171

Build 171 — Release & Restart Authority Convergence — remains immutable historical provenance.

## Retained historical provenance — Release 467 Builds 192–193

Builds 192–193 remain immutable historical release/restart provenance and do not supersede the current Release 467 authority.
