# Devil n Dove Build 641 — Saved Restock Plan Drafts & Owner Follow-Up Tracking

## Owner workflow

1. Sign in as an active Devil n Dove administrator and open **Admin → Products**.
2. In **Stock Exception Inbox**, choose **Start fresh exception scan**. Continue with **Scan next 20** when needed. The scan covers only eligible tracked physical Products, with qualifying post-cutover commitments, not every historic order or outside channel hold.
3. Choose **Add to draft** on one or more verified exceptions. Enter whole planned finished units, source (`make`, `buy` or `review`) and a factual note of 8–240 characters per line.
4. Choose **Prepare review text** and inspect the read-only summary. This step stores nothing.
5. Under **Saved Owner Restock Plans & Follow-Ups**, choose **Load my saved plans**. This explicitly loads only the signed-in administrator's private plan document and its current version.
6. Choose **Start new from reviewed worksheet**, enter a title, optional follow-up date and owner note, and then **Save owner plan**. A newly saved plan must start in Draft. The server rechecks Product tracking/status, on-hand figures and qualifying order commitments before accepting it.
7. Later, use **Load my saved plans → Reopen** to update the owner note, due date or status (`Draft`, `Owner follow-up`, `Blocked / investigate`, `Reviewed / completed`). Save each change deliberately. Completing a planning task does **not** imply inventory was replenished.
8. To change a saved plan's quantities, start a new current-source worksheet. Previously saved snapshots remain historical planning context and may be stale.

## Scope and safety

- Existing D1 `app_settings` stores at most 20 plans per authenticated owner; each plan includes at most 8 reviewed Product lines. **No schema migration** or new table is required.
- The reserved `site.admin.owner_restock_plans.v641.*` keys are always private and hidden/rejected by the general app-settings endpoint. The dedicated route derives the owner key from verified Admin middleware; the client cannot choose another user's key.
- JSON input is bounded and validated. Save uses a document-version check plus SQL compare-and-swap. Concurrent edits produce `409` and require a deliberate reload, with **no automatic retry**.
- Initial line quantities are checked against current canonical Product and post-cutover commitment evidence. Follow-up edits preserve those historical line snapshots. None of this verifies unrecorded outside holds, physical count or supplier availability.
- A successful write is independently read back before confirmed. The route attempts a private admin audit receipt. If audit insertion fails after persistence, it returns `saved: true`, `audit_recorded: false` with explicit warning; no duplicate save is attempted.
- No Product inventory adjustment, order reservation, supplier purchase, manufacturing command or external marketplace publication occurs. Operational changes must use their existing separate owner-confirmed flows.

## Verification

`node --test scripts/release467_build641_owner_restock_plans.test.mjs scripts/release467_build640_stock_exception_inbox.test.mjs`

18 focused cases cover authenticated owner isolation, private persisted save/reopen, dedicated settings protection, status updates, version conflicts, source verification, malicious/invalid input, audit failure truth, unchanged Product stock, and explicit-click UI. The current application quality workflow runs the Build 641 suite and retains earlier gates.

**Runtime budget review:** Build 641 adds exactly two runtime files (the owner-only API and UI module), producing 1,849 files and 18,565,676 runtime source bytes on the checked candidate. The old caps of 1,847 / 18,550,000 rejected this required code. The caps are narrowly amended to 1,849 files and 18,570,000 bytes (20,000 bytes of headroom from the previous bound); maximum individual JS, CSS, HTML and inline payload caps remain unchanged. No safety or production deployment checks are waived.

**Next proposed Build 642 — Restock Follow-Up Priority Board & Due-Date Review Shortcuts.**
