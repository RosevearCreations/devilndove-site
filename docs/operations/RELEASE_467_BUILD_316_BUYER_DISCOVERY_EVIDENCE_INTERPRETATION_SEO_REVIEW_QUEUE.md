# Release 467 Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue

Build 316 starts from exact Build 315 Development/Production GREEN.

Build 315 proved that Development currently has **no real Search Console export staged**. Build 316 therefore does not invent traffic or manufacture SEO work to fill the queue. It interprets only real Search Console rows and real public page-view telemetry.

## Review-queue contract

The existing Search Console opportunity action remains an explicit administrator action. Build 316 changes its semantics from copy generation to **evidence-backed review queuing**:

- a queue row requires a real page URL, real query text, real impressions and the configured position window;
- the row records the factual page/query/source batch and a factual priority derived from observed impressions/position;
- no title, meta description, H1 or internal-link wording is generated;
- existing actions can be refreshed from current evidence without reopening their human review state;
- an SEO override cannot be applied unless current Search Console evidence still supports that page/query;
- the reviewer must explicitly enter any title/meta/H1/internal-link change before Apply.

Public page-view telemetry is observation evidence only. It cannot supply missing query/impression evidence and cannot create an SEO queue item by itself.

## Evidence states

- `EVIDENCE_PENDING_NO_SEARCH_QUERY_DATA` — no real Search Console query rows exist; zero queue rows are created by Build 316.
- `REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY` — real Search Console rows exist, but none meet the factual review threshold.
- `REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE` — one or more real query/page pairs meet the threshold and may be queued by an explicit administrator action.

CI only measures these states. It performs no queue mutation.

## Boundaries

No synthetic discovery rows, automatic queue creation, generated SEO wording, automatic SEO apply, IndexNow/provider execution, request-time DDL, R2 mutation or Production D1 contact.

Next: **Build 317 — Third Project Maker Story Readiness & Evidence Selection**.
