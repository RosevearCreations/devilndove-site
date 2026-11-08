# Release 467 Build 645 — Restock Review Handoff Digest & Owner Decision Export

## Owner workflow

1. Open **Admin → Products → Saved Owner Restock Plans** and deliberately select **Load my saved plans**.
2. In **Owner Restock Review Notes**, select one saved plan. In **Find Review Notes & Owner Decision Summary**, optionally filter and choose **Search saved reviews**.
3. The **Private Restock Review Handoff Digest** section lists only verified reviews already loaded by that owner search. Select desired dated reviews. To include older matching notes, choose **Load next matching 10** in the search area first.
4. Private note bodies are **excluded by default**. Turn on **Include full private note bodies** only when the destination and recipient are appropriate.
5. Choose **Prepare selected digest** and read the entire read-only preview. Then deliberately choose **Copy reviewed digest** or **Download private .txt**. Neither action sends data to a supplier or any other service.
6. A different plan, edited filters, a fresh search, failed review verification, or newer saved-plan version clears a prepared digest. Choose and prepare again; there is no background refresh.

## Meaning and privacy of an export

- The digest contains selected dated outcomes, a source/version/time label, the saved-plan status and follow-up date, and counts calculated across the entire verified bounded history (up to 50 review notes). A partially loaded search is identified by its loaded/total match counts.
- The document is a **private historical planning snapshot**. It does not establish the actual Product count, live order commitments, supplier inventory, restock receipts, manufacturing completion, payment, or authorization to publish or sell.
- The browser exports a plain-text file or copies reviewed text **only after the owner's click**. Notes are opt-in. No database writes, provider APIs, emails, stock movements, supplier purchases, timers, browser storage, or automatic transmissions are introduced.
- Anyone receiving a copied or downloaded digest may see its private contents. Review recipients and protect local files before sharing.
- This feature reuses Build 644's verified owner-only read and Build 641's verified plan source. It cannot create or edit a Product, plan, supplier order, stock history or review event.

## Validation

`node --test scripts/release467_build645_restock_handoff_digest.test.mjs` verifies the owner-selection gate, explicit note opt-in, filtered/paged continuity, stale-state clearing, HTML escaping, and absence of automatic external sends. Build 641–644 regressions, the canonical D1 migration policy and the current application quality gate remain required.

The first PR source-gate run identified the unchanged Release 465 runtime-byte ceiling (18,610,000) exceeded by 5,883 bytes. To fix the *actual payload* without raising or bypassing the gate, the shipped Build 642–645 owner-restock JavaScript assets were syntax/whitespace-minified. All 34 Build 641–645 tests reran green and the resulting runtime source size was **18,608,466 bytes**, below the existing limit. The source map is deliberately not shipped, to keep the runtime budget truthful; build-specific documentation and regression fixtures remain readable.
