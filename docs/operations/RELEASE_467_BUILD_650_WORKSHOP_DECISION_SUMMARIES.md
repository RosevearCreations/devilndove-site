# Release 467 Build 650 — Workshop Decision Review Summaries, Saved Timeline Freshness & Guided Owner Follow-Up

## Owner instructions

1. In **Admin → Products**, load private saved owner plans. Expand **Workshop Decision Summaries & Saved Timeline Freshness** and select a plan.
2. Click **Review current saved decisions**. This makes **one authenticated, no-store, read-only GET** to the existing Build 643 dated-review endpoint. Nothing is read automatically on page opening, and no data is saved.
3. Inspect the **full saved-outcome counts** and the most recent saved outcome. The summary reviews only the newest ten records, so it does not claim to display all older note bodies. Review original private notes in Build 649 when factual detail is needed.
4. Inspect **Source freshness**. It distinguishes the explicit check time from the actual latest saved-note timestamp, flags notes older than seven days and warns that even a recent owner note is not proof of current stock/workshop/supplier facts. Click the review button again after anyone has made a separate saved decision.
5. Read **Guided owner follow-up** for saved plan due-date context, a category-specific proposed next step, and changes between the two most recent recorded recommendations when available.
6. Use **Reopen original owner plan** only after reading the summary. The original editor still requires its **own deliberate Save** for any status/date change; a saved recommendation cannot approve purchasing, alter stock, complete a job or publish a listing.

## Technical boundaries and acceptance

- Build 650 consumes the existing private owner-plan Build 641 snapshot and Build 643 `GET /api/admin/owner-restock-review-notes` response. No new API, database migration, role or provider permission is introduced.
- The response must match authenticated owner ID, selected plan identity, saved plan version/status/due date, private/read-only flags, six outcome counts and full 0–50 review total, newest event metadata, ordered timestamp, bounded ten-row page, and cursor. Inconsistent responses fail closed with **HOLD** and no previous summary.
- Selection, authenticated owner snapshot, or plan-version changes invalidate the displayed summary. Responses arriving after an owner switch are discarded. Data is only kept in browser memory, never browser storage, provider requests or exported files.
- No note bodies are displayed in the summary, preventing accidental sharing of private details. Plan titles appear as text, never injected HTML. Historic notes are still available through the separately deliberate Build 649 viewer.
- This is a planning aid, **not inventory, supplier, order, payment, physical job or publication authority**. It does not call `POST`, modify D1 or R2, change checkout, issue external messages, or automate status changes.
- The unused Product price-suggestions script was not referenced by active HTML or runtime JS (also forbidden from eager Product loading by the historical Build 176 gate). It was moved from `public/js/admin-product-price-suggestions.js` to `docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_PRICE_SUGGESTIONS.js.txt`, preserving its source and maintaining the unchanged Release 465 source limits. The current Product editor and its price workflow remain intact.
- The Build 650 regression suite covers manual-only GET, exact source validation, full-count versus bounded-page distinction, no private-note rendering, current/empty/stale views, in-flight owner-switch rejection, safe deliberate reopen, DOM and CI wiring, and archive preservation. All existing protected quality, migrations, source, size and production checks must remain GREEN before promotion.
