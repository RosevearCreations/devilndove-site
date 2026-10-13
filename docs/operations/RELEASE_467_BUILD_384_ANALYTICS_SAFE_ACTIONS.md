# Release 467 Build 384 — System-Wide Analytics, Automation & Operational Reliability

**Workspace:** `/admin/system-operations/`. **Read-only endpoint:** `GET /api/admin/system-operations-analytics`.

## New default admin action acknowledgement
`/public/js/admin-action-ack-v384.js` loads through shared `/public/js/auth.js` (and its legacy `/public/js/admin-auth.js` compatibility entrypoint) or `/js/main.js`, with a singleton install check. On every same-origin mutation via `window.fetch` or `DDAuth.apiFetch` initiated by an Admin button/form: show `Saving…`, `Adding…`, `Updating…` or `Deleting…`; disable that initiating control and set `aria-busy`; restore the original label and disabled state when the request settles. A fixed live-region acknowledgement reports **OK** only on successful server HTTP/API response, error when rejected, and **unknown outcome** on network interruption or 5xx (verify before retrying). Matching in-flight JSON requests in the *same page* share one network operation with cloneable responses. Button double-click while busy is blocked.

**Limitations:** A browser-only guard cannot prevent resubmission from another device/browser tab, direct API clients, reloads, unguarded XMLHttpRequest, or different JSON payloads. Existing server unique request keys, DB constraints, auth/Origin policies, and conditional mutations still own strong idempotency. For each further mutation workflow add persistent server-side receipts and source-specific guard tests (next Build 385). Do not optimistically report success for ambiguous errors. A background autosave without an initiating button deliberately does not generate repeated toast notifications. The feature is non-persistent and consumes **zero extra D1 writes**.

## System-wide metrics
The Admin-only API uses exactly seven capped `SELECT ... ORDER BY ... LIMIT 101` reads across canonical project, customer request, real work-order event, reserved material, calendar, commission, and finance review sources. It returns at most the newest 100 rows for each source, explicit truncation, no raw customer identities, and no estimated global totals. It does not sum material quantities measured in incompatible stock units. Read-only reporting is performed only on explicit page load/refresh. It does not poll, run scheduled actions, post to accounting, automate communications, or mutate source business data. Other specialist analytics remain in their existing screens.

## Verification and deployment
`python scripts/release467_build384_gate.py`; verify duplicate identical simultaneous POST uses one network request, waiting label/aria busy, clear OK feedback, network ambiguity warning, bounded analytics, and no D1/business mutations. Validate exact-head Dev quality, I.T., hygiene, D1 fan-out and System Gate/Preview, promote identical GREEN tree to main, verify Production Pages/live integrity. No new canonical migration.

**Next proposed queue:** Build 385 — Durable Server-Side Write Idempotency & Operation Receipts.
