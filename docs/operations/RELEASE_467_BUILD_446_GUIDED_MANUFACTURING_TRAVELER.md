# Release 467 Build 446 — Guided Manufacturing & Job Traveler

## Operator workflow

1. **Creative Process:** Create ordered manufacturing operations and record a real approved sample/production authorization.
2. **Manufacturing Job Traveler (Build 219):** Review and save one versioned snapshot. The immutable reviewed operation, workstation, setup and materials/tool references are the execution source.
3. **Guided Manufacturing:** Choose the approved version and create one execution using an operator note. The server atomically creates a permanent run and its 1–50 steps. Reopen this screen, select the same reviewed traveler and **resume** the execution across sessions.
4. **Step controls:** Human action **Start → Pause/Hold → Resume → Complete**, append-only checklist checks, planned cure/timed deadlines, equipment unavailable/maintenance notes and named Inventory substitution references. Manual checklist/evidence proof is mandatory before completing each step. Any planned cure deadline must pass and receive a new operator check; no background timers, autocompletion or provider actions.
5. **Actual time:** Enter real minutes once using existing **Work Orders & Time** (Build 379); link its existing unique time receipt in this screen. Time links never create another Work Order entry. Evidence/photos come from existing **Creative Process** events (Build 214), validated to belong to the same project and remain active. Private original media URLs are not exposed here.
6. **Materials:** Use Build 445 BOM, Creative Process canonical Inventory consumption/returns and Materials & Costing. Substitution here is *only an operator observation*, not a reservation or stock mutation.

## Reliability and recovery

- Canonical migration `0042_release467_guided_manufacturing_traveler.sql` is additive and forward-only. Immutable `maker_traveler_runs`, `maker_traveler_run_steps`, and append-only `maker_traveler_step_events` provide authoritative history. D1 triggers guard reviewed traveler/project matching, exact snapshot step membership, state changes, evidence, cure acknowledgments, and unique Work Order time receipt source IDs.
- Every command is admin authenticated, same-origin and operator confirmed. Request keys are unique; identical retries return the original immutable event or run without reapplying. A key collision with different actor/payload is rejected. Client preserves pending keys for safe retry.
- A failed or uncertain write is **never** shown as success. Refresh to reconcile before resubmitting. Only one run is permitted for a reviewed traveler version; a newly reviewed version can begin a distinct execution if required. Existing historical runs remain readable even after a traveler is superseded.
- Bound to 80 recent reviewed traveler choices, 50 steps/run, 150 recent execution events, 80 source receipts and 80 evidence events. All older events remain in D1 and cannot be overwritten or deleted.
- Forward recovery: disable new guided manufacturing UI/API writes, preserve history, and repair via a new canonical numbered migration. Never delete stock, source time receipts or reviewed snapshot rows.

## Acceptance verification

`python scripts/release467_build446_traveler_sql_regression.py` — starts a multi-step resin/polish job; records hold and equipment substitution, closes/reopens SQLite as a separate session, resumes, links genuine time/photo evidence, checks cross-project and duplicate receipt rejection, verifies blocked early cure completion, completes the second step, enforces append-only integrity and proves Inventory balances unchanged.

`node --test scripts/release467_build446_traveler_rules.test.mjs` — ensures the server authentication/idempotency and client genuine-source receipt/retry protections remain present.

## Boundaries

Never perform automatic lifecycle transitions, Product publication, Etsy/Meta posting, Inventory adjustment, financial posting, media promotion or Work Order time posting from Build 446. Every such source has a separate reviewed authority.
