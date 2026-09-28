# Release 467 Build 288 — Real Planned-vs-Actual Inventory Acceptance

## Purpose

Build 288 repeats the planned → reviewed-unposted → explicit Inventory post → compensating reversal lifecycle using only the real existing linkage proven by Build 287. No project, material event, Inventory item or Product fixture may be created.

The accepted linkage is the existing **Under the Sea** Creative Process project (project 7), material event 2, resource link 1 and active Supply Inventory item 2801.

## Acceptance boundary

The exact Development deployment must prove all of the following:

- the real linked project still contains at least one planned material estimate;
- event 2 remains an approved reviewed-but-unposted material actual before posting;
- the Build 287 explicit material → Supply Inventory link remains exact and active;
- an explicit operator review leaves Inventory unchanged;
- an explicit operator Inventory post creates the Inventory-owned posting and movement;
- an explicit compensating reversal restores Inventory exactly to its starting quantity;
- the original reviewed values are restored afterward;
- Finance journal entry and line counts remain unchanged;
- no fixture, Product-owned stock, automatic Inventory movement, provider action or Production business-data mutation is used.

Direct Wrangler evidence reads are capped at 20,000 rows for the one-shot acceptance. The normal Build 288 proof is retired to source-only/manual mode after the exact evidence is captured.


## Interrupted-run recovery rule

A first exact Development attempt may reach the explicit Inventory-owned post and then stop during evidence validation. Build 288 treats that as durable audit history, not as disposable test data. A retry must first locate the exact Build 288 post, reverse it through the normal Inventory authority, and prove the linked review returns to approved/unconsumed state.

Inventory tracking mode is authoritative. For `exact` or `estimated` tracking, the post must have a positive stock delta. For `log_only` or `reusable` tracking, a valid explicit post records positive usage with a zero stock delta and leaves on-hand unchanged. In both cases the compensating reversal must close the posting and leave Inventory at its recorded pre-post baseline.

If an interrupted attempt changed review fields before it stopped, Build 288 does **not** invent a prior value. The recovery preserves the review state present at retry start and records that no pre-interruption review value was claimed. Finance-neutrality is enforced by the Inventory post/reversal source contracts and by unchanged journal counts across the recovery/reversal phase.

## Inventory Operations table repair

The owner screenshot showed desktop editor fields squeezed so tightly that labels and button text wrapped character-by-character. Build 288 gives the desktop editor a deliberate wide table instead of compressing every editable control into the viewport.

The table now has a minimum desktop width of 1820px with explicit column widths. The item, category/supplier, quantity, stock/usage, cost, reorder, status and action columns remain readable. Stock and usage controls receive a 360px column, the action column receives 280px, inputs fill their own columns, and the containing panel scrolls horizontally when the browser is narrower. Card view and mobile card behavior remain available.

## Exact predecessor

Build 287 is the exact Production GREEN predecessor:

- Development SHA: `f3e84a0c5623eb0a74bccb537049d780944e2892`
- Development/Production tree: `981b7a5e7b851684821af087a428fe66ad8348f0`
- Development proofs: System `36432943282`, Quality `36432943315`, I.T. `36432943396`, Hygiene `36432943404`, Build 287 `36432943286`
- Production main: `27a48e505b42c399fac0801cbd4e6394490957a4`
- Production Pages: `36433269795`
- Production Live Resource Integrity: `36433368187`
- Production Build 287 proof: `36433269797`

## Next

Build 289 — **Real Inventory Adoption Outcomes Renewal**. The future queue has not run out.
