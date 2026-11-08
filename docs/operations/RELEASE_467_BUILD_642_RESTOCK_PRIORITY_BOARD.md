# Devil n Dove Build 642 — Restock Follow-Up Priority Board & Due-Date Review Shortcuts

## Owner workflow

1. Sign into **Admin → Products** as an active Devil n Dove administrator.
2. Under **Saved Owner Restock Plans & Follow-Ups**, choose **Load my saved plans**. One deliberate private D1 request loads the owner plan list; the new priority board uses **that same verified result**, without another database read.
3. In the **Owner Restock Follow-Up Priority Board**, review the as-of calendar day and counts for overdue, due within seven days (including today), blocked, undated and completed follow-ups. Counts can overlap; a blocked plan can also be overdue.
4. Choose **Overdue**, **Due within 7 days**, **Blocked**, **Needs a date**, **Completed review** or **All plans**. The list is sorted with overdue first, followed by today, blocked, upcoming, later, undated and completed reviews. Dates use the current device's local calendar.
5. Choose **Review plan** to reopen the selected owner's existing private restock draft. The saved snapshot remains historical evidence, not a current stock count. Edit its follow-up date, status or owner note, then explicitly **Save owner plan** in the existing editor.
6. After a confirmed save, the board refreshes from the already accepted owner result. Another browser session can change the document; the existing optimistic version conflict continues to require a deliberate reload.

## Boundaries and failure handling

- No background fetching, timers, automatic reminders, notification dispatch, purchase orders, Product stock changes, new D1 table, external provider action or cross-owner queries.
- The board is disabled until the owner explicitly loads a verified plan list. A failed load or malformed snapshot clears its previous data and prevents stale review shortcuts.
- Review shortcuts call the existing Build 641 in-memory owner editor and cannot select a plan absent from that owner's verified list. The original server-side owner identity and compare-and-swap save boundary remain unchanged.
- HTML-escaped titles, notes and date/status output protect the table from saved content injection. The filters and status message provide accessible keyboard buttons, pressed-state indicators and a live region.
- Plan completion means an **administrative follow-up review** only. Physical count, actual inventory changes, offsite commitments and supplier action require separate independent verification and owner-confirmed workflows.

## Acceptance tests

`node --test scripts/release467_build640_stock_exception_inbox.test.mjs scripts/release467_build641_owner_restock_plans.test.mjs scripts/release467_build642_restock_priority_board.test.mjs`

The combined 25 tests cover stock-source trust, private owner persistence and CAS conflicts, explicit list loading, inclusive seven-day boundaries, overdue/blocked/undated priority, filter overlap, unsafe input escaping, invalid source HOLD, and reopen through the existing owner editor with zero extra database reads.

**Runtime budget review:** The priority board adds one browser runtime module. The measured candidate has 1,850 runtime source files and 18,575,044 source bytes; previous caps (1,849 files / 18,570,000 bytes) would reject it. The reviewed caps become 1,850 files / 18,580,000 bytes, increasing the source-byte ceiling by only 10,000; individual JS/CSS/HTML and data URI caps are unchanged. No quality, security, deployment or migration gates are relaxed.

**Next proposed Build 643 — Owner Restock Follow-Up Notes Timeline & Review Outcome Clarity.**
