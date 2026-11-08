# Release 467 Build 644 — Restock Review Search, Outcome Filters & Owner Decision Summary

## Everyday use

1. In **Admin → Products**, click **Load my saved plans** (Build 641) and select a plan in the **Review Notes** section (Build 643).
2. Open **Find Review Notes & Owner Decision Summary** below the dated timeline.
3. Enter a search phrase of 2–80 characters (or leave blank to view all), choose one of six outcome types (or All), then deliberately click **Search saved reviews**.
4. Read the count of matching reviews, the latest factual outcome, the plan's saved status/follow-up date and the outcome totals across **all** recorded reviews for that plan (maximum 50).
5. Choose **Load next matching 10** for more older matches. Changing the plan, phrase or outcome clears old results rather than mixing records from different selections. **Clear filters** never contacts the server.

## Safety boundary

- Searches operate only on the authenticated owner's private Build 643 review document, whose existence is tied to an existing private Build 641 plan. The search evaluates at most 50 records and returns at most 10 at once; the outcome totals use the full bounded history rather than a misleading displayed-page count.
- No request occurs on page load, while typing, or on selection changes; results require a deliberate GET. No browser storage, timers, background polling, migration or external service is introduced.
- Server validates search length, recognized outcomes and exact cursor identity within the **filtered** result. A cursor from a different search is rejected. A changed timeline causes the browser to clear results and require a fresh explicit search.
- The private note text is escaped before HTML rendering. It is never exposed through generic app-settings or generic audit history, and the endpoint does not insert/update/delete any Product, order, stock, supplier or publisher record.
- A dated review recommendation or the word “completed” is **not** evidence of physical restocking, supplier purchase, payment, order clearance, publication or unrestricted go-live.

## Acceptance

`node --test scripts/release467_build644_restock_review_search.test.mjs` plus preserved Build 641–643 tests, the canonical migration policy and full current quality gate. Current protected dev/main and Cloudflare Pages deployment proofs remain the release authorities.
