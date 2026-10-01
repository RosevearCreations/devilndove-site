# Release 467 Build 328 — Search Console Real Export Freshness & Discovery Intake III

Build 328 starts from exact Build 327 Development/Production GREEN and reuses the existing operator-controlled Search Console Performance CSV intake plus Build 322 attribution/actionability rules.

## Operator intake contract

- A new import must be explicitly confirmed as a **real Google Search Console Performance export**.
- Page, Clicks, Impressions, CTR and Position header groups remain mandatory.
- If the CSV has no Date column, the operator must explicitly enter the report end/fallback date. Build 328 does not substitute the import date because that could make old evidence appear current.
- Import audit and safe batch revert/delete traceability remain mandatory.
- No synthetic query, click, impression, attribution or SEO queue rows are created by CI.

## Freshness contract

Search evidence supports query-level discovery/SEO review only when it falls inside the current **30-day** freshness window. Stale evidence remains visible for history but is non-actionable. The existing explicit operator queue action remains available only from fresh eligible page/query evidence; applying reviewed SEO wording rechecks the same fresh evidence window.

## States

- `EVIDENCE_PENDING_NO_REAL_EXPORT`
- `REAL_EVIDENCE_STALE_NON_ACTIONABLE`
- `REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY`
- `REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE`

A zero-evidence or stale-evidence state is a valid GREEN software result. Build 328 must not manufacture discovery evidence to satisfy the lane.

## Safety

No request-time schema mutation, automatic Search Console import, synthetic discovery rows, automatic queue generation, automatic SEO apply, IndexNow, provider publication, R2 mutation or Production D1 contact.

Next: **Build 329 — Maker Story Advancement & Publication Readiness Continuity II**.

The future queue **has not run out**.
