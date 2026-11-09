# Release 467 — Devil n Dove Build 656 Owner Module Evidence & Device Acceptance

**Release scope:** Local authenticated Admin review/checkpoint tracking. This is **not** a Master Shell completion certification, original-source signer enrollment, payment/provider release, owner identity proof or Comms connection.

## Why this exists

The owners requested a verifiable, role/device-aware completion picture rather than percentages inferred from implementation counts or successful deployment checks. The Build 652 completion baseline was deliberately provisional. Build 655 prepared a source-readiness contract but held event publication. Build 656 adds a real private source record for deciding what has *actually been inspected* on Devil n Dove.

## Entry and operator steps

1. Sign in with an active Devil n Dove **Admin** account with enabled **I.T. Platform** module access. Visit **Admin → Maker Owner Trials → Module evidence and owner signoff** or `/admin/module-acceptance/`.
2. Select **Load current owner reviews**. This explicitly reads the private source record; nothing is fetched merely by loading the page.
3. Choose one stable requirement ID. For a customer, worker or admin checkpoint, choose the precise **desktop, tablet or mobile** role/device experience you actually exercised. An emulator is not a physical-device acceptance.
4. Enter what happened, the genuine device/browser, time of observation, and an existing authorized local evidence reference (`docs/...` or `urn:rosevear:evidence:...`). Do not enter personal customer information, secrets or inaccessible imaginary artifacts.
5. Choose **HOLD** when evidence is absent/inadequate, **rejected** when the observed feature failed, or **accepted locally** only if personally observed, current, and substantiated by the original reference.
6. Confirm that this is an intentional **local authenticated Admin attestation** and click **Record private owner review** once. On a network timeout, click **Check uncertain original receipt** with the exact original request key before doing anything else. The page never automatically retries a possibly committed write.
7. Explicitly reload current owner reviews before beginning the next decision. Older decisions remain in the private history and are superseded by the newest decision for that requirement.

## Scope and acceptance rules

| Evidence dimension | State in Build 656 | What remains to claim complete |
| --- | --- | --- |
| Customer/worker/admin device matrix | Six checkpoint types per role: two tasks × desktop/tablet/mobile (18 total) | Authenticated real-device field testing with appropriate actual role and privacy checks |
| Business modules | 20 proposed checkpoints for projects, work, stock, supplies, tools, products, customers, finance, IT, integration, social and production QA | Final owner-ratified requirements/weights and actual original-source evidence |
| Local owner history | Private authenticated Admin writes; optimistic revision protection; 160-receipt ceiling; receipt lookup by original request key | Independent reviewer/signer validation and witnessed source-custody decisions |
| Accepted review coverage | Local ratio of latest accepted **proposed checkpoints**, explicitly labelled as owner-attested | **No certified percentage** until denominator and independent evidence are approved |
| Official Master Shell completion | **UNKNOWN / HOLD** (`null` in source summaries) | Approved schema, source signatures, reader authorization, fresh receipt and V1 ingestion verified |
| Rosevear Comms status | Original connection **DISCONNECTED / HOLD**; this build sends nothing | Separate independently verified original QL-365D trust and owner-consented event routing |
| Financial/provider/customer operations | No mutation and no public disclosure | Dedicated authority and production-provider verification per workflow |

The proposed 38-point checklist is intentionally not equivalent to the complete product requirement set. A missing requirement, unreviewed device or rejected observation cannot be turned into `100%` by a deployment result.

## Security and safe storage

- Source record: private `app_settings` row under `site.admin.module_acceptance.v656.<authenticated_user_id>`, `is_public=0`. No customer, tenant or master-owner identity is inferred from a Dev/Dove Admin sign-in.
- The route is classified as **I.T. Platform** and enforced by the existing module middleware and real active Admin session. POST requires same origin and exact bounded payload fields; payloads are not accepted from arbitrary bearer headers or query parameters.
- Reviews are append-only inside the private versioned document. The write checks `setting_value`/`is_public` in a compare-and-swap condition and confirms original source readback. Duplicate request keys with the same payload return the original receipt; key reuse with changed payload fails.
- No automatic source read, poll, retry, external API call, email, customer action, inventory adjustment, original provider action or fake Master event.
- The audit table is best-effort after durable source write; if audit insertion fails, the response flags that explicitly. The private receipt must not be recorded again to “repair” it.
- For a real owner-signed / independent acceptance status, an approved separate signer/witness and evidence-custody process is still required. A logged-in Admin checkbox alone **cannot certify the original owner signature**.

## Protected runtime and recoverability

The protected Release 465 production-performance budget remains at **1,854 runtime files maximum / 18,610,000 bytes maximum**. The new active route and client use room made by preserving byte-identical, verified unreferenced historical clients outside the runtime tree:

| Retired runtime path | Recoverable historical copy | Original SHA-256 |
| --- | --- | --- |
| `public/js/admin-edit-product.js` | `docs/operations/historical/RETIRED_UNREFERENCED_ADMIN_EDIT_PRODUCT.js.txt` | `d8a845a022a8fc5750ec6c5a8cd8f759f86a40307107f2c17391c562a1535dcb` |
| `public/js/admin-dashboard-smoke-badges.js` | `docs/operations/historical/RETIRED_ADMIN_DASHBOARD_SMOKE_BADGES.js.txt` | `dda2fe5ee2af73ed1d1b3aaca407821dd80380e7cb6610b4446694012bfacdde` |
| `public/js/admin-dashboard-notification-actions.js` | `docs/operations/historical/RETIRED_ADMIN_DASHBOARD_NOTIFICATION_ACTIONS.js.txt` | `4906d49aebac94c09ffb697194e7c6e3c41c25e440727972ed1124c5dc8f143d` |

These original clients were not loaded by any active admin page and were already flagged by historical smoke/security gate coverage. Source copies are preserved for recovery; do not delete the archive to save room. Budget and static admin-route inventory validation are part of release verification.

## Evidence and next work

- Build 656 regression: `node --test scripts/release467_build656_module_evidence_owner_signoff.test.mjs`.
- Integrity: `python scripts/current_application_quality_gate.py`, `python scripts/release465_performance_budget_gate.py`, and `node scripts/release467_build556_admin_interface_inventory.mjs --check`.
- Source routes: `functions/api/admin/module-acceptance-656.js`, `functions/api/_lib/moduleAcceptance656.mjs`, `functions/api/_lib/appModuleRoutes.js`; owner UI: `admin/module-acceptance/index.html`, `public/js/admin-module-acceptance-656.js`.
- Prior Master Shell readiness source: `docs/operations/RELEASE_467_BUILD_655_MASTER_SHELL_SOURCE_READINESS.md`; proposed queue: `docs/operations/RELEASE_467_MASTER_SHELL_QUEUE_655_668.md`.

**Next proposed Build 657:** Workshop Production Lifecycle, Job Progress, QA & Rework Evidence. Retain maker-specific workflows, including experiments undertaken purely as therapy, failure/rework and salvage outcomes without mandating a sale or unapproved inventory adjustment.
