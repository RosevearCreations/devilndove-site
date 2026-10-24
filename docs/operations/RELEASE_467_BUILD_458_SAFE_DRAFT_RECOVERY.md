# Devil n Dove Build 458 — Safe Draft Recovery & Offline Workshop Resumption

**Scope:** Opt-in, bounded browser-local draft recovery for the private [Owner Maker Trial](/admin/maker-owner-trials/) and [True Project Costs](/admin/project-costs/) forms. No general offline editor, Background Sync, new D1 table, external provider connection, checkout, Inventory or Finance write is created.

## Owner walkthrough and evidence capture

1. Sign in to Admin on a trusted personal device. Select a **real** Creative Project or (for the six-scenario Owner Trial) a real Custom Commission Request. Original source identity and immutable server receipts remain authoritative.
2. Enter a deliberately **non-sensitive** test note/assumption. The page marks the form **Unsaved**. Click **Save draft on this browser** to opt in. Local storage is capped at 8 KiB UTF-8 per record, 10 active Maker scopes and 24 hours. The panel discloses that local browser storage is not a server backup.
3. Refresh: the page independently reloads the actual original server records. The saved draft is **not** applied silently. Click **Restore** for the selected exact project/request and journey. Confirm all original source links still exist before making an owner ACCEPTED decision; missing links must remain HOLD.
4. Test an interrupted workshop connection: disconnect, edit and manually save an updated draft, then refresh after reconnecting. **Nothing auto-submits**; review the restored fields and initiate a manual server save only when confident.
5. Open the same project in a second tab. Save a changed draft in the first tab. The second tab receives a local storage update and must block a stale overwrite and server submit until the operator restores the latest revision or discards it deliberately. Draft discard never touches the server.
6. For an **uncertain POST** (e.g., a connection failure after sending), keep the identical form and original request key. If a draft was manually saved before submit, the idempotency key is updated in that browser-local saved draft before the network request. After refresh, click Restore and **Check uncertain receipt**. The exact actor-scoped GET uses the original key and does not replay anything. If found, do **not** submit again. If absent, retry the unchanged form and unchanged key manually; changing the payload while uncertain is blocked.
7. Repeat for a CAD costing scenario. The receipt is a costing **review**, not an invoice, accounting entry, Product price or stock movement.

Use only disposable trial inputs for this walkthrough. Production does not have invented maker acceptance records. Genuine physical maker evidence, licensing, consent, product safety and third-party Etsy decisions remain manual **HOLD** unless independently verified by the owner.

## Privacy and safety limits

- Saving is a deliberate click, and restoring is another deliberate click. Notes and pricing values are visible to people or browser extensions with access to that profile: **do not save secrets, sensitive client details or credentials**. Browser storage may be blocked, cleared or unavailable in private mode.
- The local draft namespace is project/request-scoped; the Owner Trial key also includes one of the six established journey scenarios. Local storage expiry cannot guarantee secure erasure from browser or device backups; discard when done.
- The authenticated receipt GET searches by **exact idempotency key and authenticated reviewer/owner actor**, and returns only receipt identifier, category and time. It cannot enumerate another operator's note or read arbitrary original projects by a guessed key.
- No automatic replay, background polling or online-event POST exists. Existing server-side idempotency and append-only audit apply to manually submitted decisions. Errors after a request may reflect an uncertain outcome, not proof that it was never recorded.
- The new recovery module does not replace source authoritative tables, Etsy OAuth, owner consent, customer privacy, image approval or payment controls.

## Verification and release gate

```text
node --check public/js/admin-maker-owner-trials.js
node --check public/js/admin-project-costs.js
node --check functions/api/admin/maker-owner-trials.js
node --check functions/api/admin/project-costs.js
node --test scripts/release467_build458_maker_draft_recovery.test.mjs
python scripts/current_application_quality_gate.py
```

These checks test synthetic browser-storage behavior, source boundaries and safe routing, **not** real physical maker acceptance, full browser offline E2E or external approval. Complete the protected feature → `dev` preview System Gate, exact-tree `main` PR, Cloudflare Pages Production deploy, smoke test and independent live resource integrity proof before marking technical Production GREEN. There is no new D1 migration for Build 458. [Next planned build 459](RELEASE_467_MAKER_JOURNEY_NEXT_QUEUE_456_465.md) is source-linked permission-aware Maker Search & Evidence Finder.
