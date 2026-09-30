# Release 467 Build 322 — Buyer Discovery Attribution & SEO Review Evidence Continuity

Build 322 composes the operator-controlled Search Console intake from Build 321 with the evidence-backed SEO review semantics introduced in Build 316.

## Current contract

- Query-level buyer-discovery attribution is allowed only from real staged Google Search Console evidence.
- First-party public telemetry is observational context only; it is never converted into search-query attribution.
- Search Console evidence older than the 30-day current-evidence window is classified stale and non-actionable.
- Open or in-progress SEO review rows without a currently supported real query/page pair remain non-actionable.
- Human-authored SEO wording is required before apply.
- CI remains read-only and never creates Search Console rows, SEO queue rows, titles, meta descriptions, internal-link text, IndexNow submissions, provider posts or Production D1 mutations.

## Evidence interpretation states

1. `EVIDENCE_PENDING_NO_REAL_SEARCH_CONSOLE_ATTRIBUTION`
2. `REAL_EVIDENCE_STALE_NON_ACTIONABLE`
3. `REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY`
4. `REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE`

The current factual state is measured on the exact Development SHA. An empty real Search Console staging set is a valid GREEN proof result; it must not be filled with synthetic data.

## Predecessor closure

Build 321 is successor-ingested as exact Development and Production GREEN:

- Development: `215b9277f62d1359fda07d3d72ba3cf6ee47a353`
- Development/Production tree: `7df16d3a91159cefaf66435854fdffb4914ad921`
- Production main: `e761df76426a52e7bc3553189988058037979ad2`
- Production Pages: `36765763021`
- Production Live Resource Integrity: `36765982082`
- Build 321 measurement: `EVIDENCE_PENDING_NO_REAL_EXPORT`, 2,005 / 20,000 D1 rows read.

## Successor

Next: **Build 323 — Maker Story Coverage & Publication Readiness Continuity**.

The future queue has not run out.
