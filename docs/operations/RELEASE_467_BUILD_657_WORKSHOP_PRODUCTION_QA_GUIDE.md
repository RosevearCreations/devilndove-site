# Devil n Dove Release 467 Build 657 — Workshop Production, QA, Rework & Salvage

**Operator scope:** Existing genuine Creative Process projects, private shop-Admin reviews and source-linked progress. Build 657 does **not** change an original project, output, stock balance, sale, customer message, source-media permission or Master Shell completion.

## Why and where

Devil n Dove already records real maker projects in `creative_work_projects`, work facts in `creative_work_events` and deliverable plans in `creative_work_outputs`. Build 657 reuses those records instead of creating a second Product, order or manufacturing authority. It adds one private, versioned **review journal** per genuine project.

Visit **Admin → Creative Process → Production QA** or `/admin/workshop-production/` as an active authorized **Creators Admin**. The page deliberately makes no authenticated source read before a button is clicked.

## Record a real owner review

1. Click **Load genuine Creative Projects** and select the actual original workshop project (limited to the latest 80 nonarchived projects). Archived/missing work is rejected.
2. Click **Inspect selected source & existing QA history**. The page reads the current canonical project identity/status, up to 40 most recent **active** timeline events, and up to 40 original output records. It displays whether source events exceed the visible bound.
3. Choose a work phase—planning, preparing, making, QA review, rework, salvage, finished privately, production complete, or paused. Pick the real purpose: personal learning/therapy, private experiment, internal work, client commission or sale candidate. Merely choosing a sale candidate **never** creates a listing or order.
4. Enter **owner-estimated** work progress between 0–100 and the observed QA decision. Progress beyond zero and every QA/terminal decision require an **actual active timeline event** selected from the source list. Create factual events first in canonical Creative Process; Build 657 never fabricates them.
5. Record the current observation time, a specific 30–480-character factual note and the personal-observation/authorized-Admin confirmations. Never include customer private information, secrets, invented dimensions or unobserved maker results.
6. Click **Save one private workshop review**. A successful save stores one source-revision-bound private owner-attested receipt with the actor ID and observed event, not a real project-status update. If a timeout occurs, click **Check uncertain original receipt** before any further submission. A save is never automatically retried.
7. Explicitly inspect the project again to load its latest source status and review history. Earlier journal entries remain intact and are superseded by the newest owner decision.

## Strict acceptance boundaries

| Review outcome | Source-evidence requirement | Actual application effect |
| --- | --- | --- |
| Planning, 0% | Real existing Creative Project, factual note | Private journal only; no stock reservation or product requirement |
| Making / estimated progress | Actual active project event | Private progress estimate; canonical `project_status` unchanged |
| QA pass | Actual `result` or `milestone` event | Local owner-attested pass; **not independent certification** |
| QA failed | Actual `mistake`, `repair` or `result` event | Local failed outcome, no scrap disposal or inventory write |
| Rework required | Actual `mistake`, `repair`, `result` or `process` event | Local rework handoff review, no forced status or stock reversal |
| Salvage review | Actual `mistake`, `repair` or `result` event | Private salvage/reuse decision only |
| Private/therapeutic finished at 100% | Personal-learning/private-experiment purpose; actual `result`/`lesson` event for QA-not-applicable, or real QA pass | A completed *private learning review*, with **no sale requirement** |
| Production complete at 100% | Real QA pass linked to source result/milestone | Local owner-attested terminal review only; no automatic Product release |

Progress `100%` is denied for all other phases, and a source project still marked `idea` or `planning` cannot receive a terminal private or production review. An original project may independently remain `in_progress` after a local review declares that its evidence checkpoint is complete. This is intentionally visible; owners must change the canonical source through its existing authorized workflow.

## Data, access and failure safety

- Only authenticated, active **Admin** accounts with the existing **Creators** application-module grant can read or write Build 657. Page and API route ownership is explicit; POST is same-origin and exact-field checked.
- Source project records are read only. The private journal is stored in `app_settings` under `site.admin.workshop_production.v657.<creative_work_project_id>` with `is_public=0`. Two authorized shop Admins share the per-project review history. This is an ordinary authenticated actor attestation, **not a signer/witness proof**.
- Source revision is a SHA-256 fingerprint of the current project, bounded active timeline events, bounded output facts and total active event count. If the source changes between inspection and Save, the review is rejected until refreshed. Changes immediately *after* save are disclosed as a possible source drift. The bounded view cannot certify uninspected older events or assets.
- Each review appends a receipt to a protected 120-entry private history. Writes use compare-and-swap on the old private row; stale edits are denied. Duplicate exact request keys return the original receipt, while changed payloads conflict.
- A committed record is read back before reporting success. Original-key lookup is available for an ambiguous result. Audit insertion may fail after storage commits; that state is disclosed and is **not** permission to duplicate the record.
- Public Product, canonical project and output updates, Inventory posting/reversal, customer or staff communication, media rights, provider calls and Master Shell event publication are explicitly absent.
- The 38 proposed Build 656 module checkpoints and their official completion percentages remain independent and **UNKNOWN / HOLD**, as does original Comms connection state pending external proof.

## Reversible runtime preservation

To keep the protected Release 465 performance ceilings intact, four previously unreferenced standalone banner clients, with no active HTML or JS references, are stored byte-identically in `docs/operations/historical/`. Brand imagery and the active Brand V3 runtime are retained.

| Dormant original runtime path | Recoverable archive | Original SHA-256 |
| --- | --- | --- |
| `public/js/brand-v3-ontario-banners-236-245.js` | `docs/operations/historical/RETIRED_UNREFERENCED_BRAND_V3_ONTARIO_BANNERS_236_245.js.txt` | `cab6ec8e591d8843ff7d2092a3e2ca6b6b3dd6e34be87f71daad2be6976fa6c5` |
| `public/js/brand-v3-secondary-banners-266-275.js` | `docs/operations/historical/RETIRED_UNREFERENCED_BRAND_V3_SECONDARY_BANNERS_266_275.js.txt` | `2fba8779e5f90c4edc4cb93713c6b102959da5ac4f25fd7f877ac104c28fe33f` |
| `public/js/brand-v3-account-banners-246-255.js` | `docs/operations/historical/RETIRED_UNREFERENCED_BRAND_V3_ACCOUNT_BANNERS_246_255.js.txt` | `87d65177b0022f5ff00008cacee6c37e70fd25717d360e25d30e60e6921b9fc7` |
| `public/js/brand-v3-editorial-banners-226-235.js` | `docs/operations/historical/RETIRED_UNREFERENCED_BRAND_V3_EDITORIAL_BANNERS_226_235.js.txt` | `4a3f3b38765079f97facbad9e7bb1b6ea10156b1d2ecb3b4c4c53d9aaf1d17d8` |

## Verification and next build

- Regression: `node --test scripts/release467_build657_workshop_production_lifecycle.test.mjs` (14 tests).
- Full quality: `python scripts/current_application_quality_gate.py`.
- Release budget: `python scripts/release465_performance_budget_gate.py`.
- Admin route inventory: `node scripts/release467_build556_admin_interface_inventory.mjs --check`.
- Code: `functions/api/_lib/workshopLifecycle657.mjs`, `functions/api/admin/workshop-production-657.js`, `admin/workshop-production/index.html`, `public/js/admin-workshop-production-657.js`.

**Next proposed Build 658:** Inventory, Supplies, Tools & Physical Stock Reconciliation. It must reuse Inventory's actual stock and ownership rules, with real counts and independently authorized correction decisions—not modify quantities through this production-review journal.
