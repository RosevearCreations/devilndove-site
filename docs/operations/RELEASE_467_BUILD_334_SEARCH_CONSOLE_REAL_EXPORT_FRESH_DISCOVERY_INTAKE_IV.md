# Release 467 Build 334 — Search Console Real Export & Fresh Discovery Intake IV

Build 334 starts from exact Build 333 Development/Production GREEN and reuses the existing operator-controlled Search Console Performance CSV intake plus the Build 322/328 attribution and freshness rules. It creates no alternate search-data path.

## Operator intake contract

- A new import must be explicitly confirmed as a **real Google Search Console Performance export**.
- Page, Clicks, Impressions, CTR and Position header groups remain mandatory.
- If the CSV has no Date column, the operator must explicitly supply the report end/fallback date; import time is never substituted as evidence freshness.
- Batch audit and explicit safe batch revert/delete traceability remain mandatory.
- No CI path imports, edits, deletes, synthesizes or backfills Search Console evidence.

## Freshness and attribution contract

Search evidence supports query-level discovery/SEO review only inside the current **30-day** freshness window. Stale evidence remains visible as history but is non-actionable. Query-level attribution requires real Search Console page/query evidence. Existing SEO review actions remain human-created/reviewed and automatic SEO application remains closed.

## States

- `EVIDENCE_PENDING_NO_REAL_EXPORT`
- `REAL_EVIDENCE_STALE_NON_ACTIONABLE`
- `REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY`
- `REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE`

A zero-evidence or stale-evidence state is a valid GREEN software result. Build 334 never manufactures search evidence to advance the lane.

## Build 333 predecessor closure

- Development SHA: `ed3a8674ec5fd0e4363043034d694fdbb0a6822a`
- Exact tree: `295ee32365ac51c2988181b63d8b83a6fcae3da3`
- System / Quality / I.T. / Hygiene: `36894103075 / 36894103073 / 36894103067 / 36894103040`
- D1 Fan-Out / Build 333: `36894103200 / 36894103049`
- Production main: `7b934186dcef69d76c9ad3dd6a25c4aed8ba4de4`
- Production Pages / Live: `36894463676 / 36894596996`
- Development and Production trees: **MATCH**.

## Safety

No request-time schema mutation, automatic Search Console import, synthetic discovery rows, automatic SEO queue generation, automatic SEO apply, IndexNow, provider publication, R2 mutation or Production D1 contact.

Next: **Build 335 — Maker Story Advancement & Publication Readiness Continuity III**.

The future queue **has not run out**.
