# Release 467 Build 412 — Escalation Work Queue, Operator Assignment & Verified Destination Change Review

## Scope
The existing Build 411 immutable evidence lifecycle is extended, without a schema migration, with:
- A manual, bounded OPEN escalation work queue; at most 100 recent Build 411 escalation events scanned and 20 unresolved cases returned. Old cases outside this bounded view are not represented as resolved or missing.
- Assignment to a real active verified Admin from the existing `users` table. Assignments are append-only `admin_action_audit` receipts. An assignee ID alone cannot grant provider permissions.
- A case detail view independently validates canonical Product/draft identity, Build 399 claim, Build 400 verified Etsy receipt, Build 410 verified closure, and Build 411 current snapshot and escalation.
- Only the currently assigned, still-active Admin can record a local destination-change review. A positive local-evidence review requires matching Build 400, Build 410, current Build 411 source snapshot, and explicit owner acknowledgement. HOLD reviews are available when destination outcome remains unknown.
- Optimistic concurrency for current assignment and review receipts and a unique request-key fence per scope; no provider requests, automatic retries, publication or U.S. shipping enablement.
- Facebook remains an unresolved provider-permission HOLD; assignment/hold notes never authorize remote listing creation.
- Queue is not a scheduled background watch or notification service. Read-only evidence is historical D1 context; only separately approved operator GET of Etsy can confirm current provider draft state.

## Acceptance
From I.T. Integrations open Build 412; click Load OPEN escalation work queue; select a case, Inspect, choose a verified active Admin and record a local assignment; the assigned Admin can document a HOLD or confirm strictly local evidence where required receipts exist. There is no automatic provider call. Build 411 remains the authority to actually close the owner escalation.

## Next proposed
Build 413 — Escalation SLA Tracking, Assignment Handoff Evidence & Owner Follow-Up Readiness.
