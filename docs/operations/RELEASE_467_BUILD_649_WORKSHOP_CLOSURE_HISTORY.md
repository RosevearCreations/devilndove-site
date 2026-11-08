# Release 467 Build 649 — Workshop Closure History & Owner Decision Continuity

## What is saved and what is not

The new **Admin → Products → Workshop Closure History & Owner Decision Continuity** panel reads genuine private, dated Build 643 review-note records. These records are written only by the separately authenticated owner-review editor, with an explicit Save. They are **owner planning decisions**, not physical-stock or supplier truth. The unsigned Build 648 worksheet remains session-local and does not become a saved decision unless the owner manually records a separate note.

## Owner steps

1. Under **Owner Restock Plans**, click **Load my saved plans**. Choose the same plan in **Workshop Closure History**.
2. Click **Load saved decision history**. This performs one authenticated, private, read-only request. Outcomes and historical status snapshots appear only after owner, plan and version checks pass. The latest and earlier notes cannot prove stock receipt, successful manufacturing, supplier commitments or completed owner-plan status.
3. Use **Show saved outcomes** to filter the loaded entries. **Load earlier saved reviews** is deliberate and bounded: ten at a time, at most fifty retained historical notes. A changed timeline, owner, plan or invalid response clears the entire history and requests explicit reload; there is no automatic retry.
4. To compare a closure recommendation, first prepare the private Build 648 worksheet for the same owner, plan, saved version and review-timeline version. Then click **Compare current prepared closure worksheet**. The panel labels the recommendation as **not yet a saved decision**.
5. Click **Prepare manual decision-note draft**, read the private text and deliberately **Copy draft**. In the existing Build 643 dated-review editor, select the suggested outcome, explicitly reload the current review timeline, paste/edit the factual note and click **Record private review note** only if correct. Build 649 never performs this write or inserts text into the editor automatically.
6. **Reopen original owner plan** opens the protected owner editor. Any status or follow-up-date change still requires its own explicit Save. A planning status marked complete does not authorize stock, orders, suppliers, payment or marketplace publication.

## Security and source evidence

- On-demand GET uses the existing Build 643 endpoint and its verified signed-in administrator session. No new database route, schema, migration, background job or provider permission is introduced.
- Each response is checked against the authenticated Build 641 snapshot, saved plan ID/version/status/due date, private/read-only flags, six outcome totals, bounded event count, timeline/cursor and previous pages. HTML-escaped private note bodies never reach public views or automatic exports.
- The Build 648 worksheet can be linked only after explicit preparation and only when the same owner, plan, version and dated timeline match. Changed source or session clears comparison and manual draft.
- The runtime no longer includes the unreferenced historical Build 232 `admin-product-correction.js`. Its source is preserved in `docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_CORRECTION_B232.js.txt`. Active Product correction navigation remains implemented in `public/js/admin-product-workspaces.js`, with no runtime HTML/script or import reference to the retired file. This keeps the unchanged Release 465 source budget under its cap.
- Build 649 regression tests cover zero automatic calls, private pagination and filters, source integrity, safe manual draft/copy/reopen, stale-owner rejection, HTML escaping, and protected CI wiring. Existing D1 migrations and production gates remain unchanged.
