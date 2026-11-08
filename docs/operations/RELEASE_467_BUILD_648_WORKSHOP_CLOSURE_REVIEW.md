# Release 467 Build 648 — Workshop Follow-Up Outcome Review & Source-Linked Closure Checklist

## Owner workflow

1. Open **Admin → Products** and load a saved owner plan under Build 641.
2. Open that plan's **dated owner review timeline** (Build 643), then deliberately prepare the matching **private restock-review handoff digest** (Build 645). This prepared digest is the bounded source for Build 648.
3. In **Workshop follow-up outcome review and source-linked closure checklist**, select the same saved plan and click **Link prepared dated digest**. The plan ID, authenticated owner session, saved plan version, and review timeline must all match.
4. Choose a recommendation (keep open, follow up, blocked, or manual closure review), enter a concrete owner-supplied evidence note and next step, and optionally a future follow-up date. Tick four separate review acknowledgements and confirm the limited authority of this worksheet.
5. Click **Prepare private closure worksheet**. Inspect the unsigned preview, then copy or download it deliberately. **Reopen original plan editor** takes the owner back to the original plan; a separate explicit Save is always necessary for a saved planning-status change.

## Truth and authority boundaries

- The worksheet is **private, browser-session-only, unsigned, and not persisted**. Copy and local download occur only on explicit user actions. It does not post, notify, order, pay, publish or mutate a plan or inventory.
- Prepared Build 645 source data is checked against the currently authenticated Build 641 owner and plan and its saved version. A changed owner session, plan, review digest or worksheet input invalidates the prior prepared recommendation. The worksheet does not copy private review-note bodies.
- A *manual closure review candidate* is **not** confirmation of a physical stock count, supplier response, purchased materials, finished workshop job, inventory receipt or store listing. Owner-supplied notes and checklist acknowledgements are clearly labeled as such; only independently verified records may establish those facts.
- Four acknowledgements keep dated-review provenance, physical stock/commitments, supplier/purchasing authorization, and editor-only status changes distinct. Only the original owner-plan editor can save a planning status; that still does not itself prove warehouse or workshop completion.
- Build 220's unreferenced Admin offers helper is preserved verbatim in `docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_OFFERS.js.txt`, apart from its explanatory first-line comment. Source searches confirmed no runtime script/import reference, avoiding expansion of the unchanged Release 465 runtime budget.

## Verification

`node --test scripts/release467_build648_workshop_closure_review.test.mjs` checks owner-plan/digest link, explicit acknowledgements and preparation, stale-source invalidation, safe reopen, no auto-save or external actions, and UI/CI wiring. The release is additionally subject to the existing source, security, accessibility, migrations, hygiene, and performance-budget gates before branch promotion.
