# Release 467 Build 411 — Provider Evidence Audit Lifecycle, Destination Status Snapshot Governance & Exception Escalation

- Explicit Admin click reads one Product and one destination, plus for Etsy one existing local draft. Latest 12 audit entries only; no global scans, automatic polling, provider calls, or secrets.
- Captures immutable historical snapshots into existing `admin_action_audit`, keyed by Etsy draft UUID or Facebook Product ID. Snapshot records original D1 source signature, Build 399 attempt claim, Build 400 verification receipt, Build 410 case status and channel reviews. Zero new D1 schema.
- Historical snapshot is marked REVIEW_DUE after 24 hours or when source evidence changes; it is **not** live provider verification. No scheduled task is created and no old audit row deleted automatically.
- Explicit owner-review escalation is available for Etsy remote-outcome unknown/conflict or Facebook API permission HOLD. Escalations are D1-only records; not emails or tickets, and never give publishing authority.
- Resolution only with an OPEN owner escalation, an unchanged source snapshot, and an existing Build 410 CLOSED_WITH_VERIFIED_DRAFT_PROOF case backed by Build 400 exact Etsy unpublished-draft reconciliation. Facebook escalation cannot be closed without a later permitted provider workflow.
- Owner note and no-retry / no-publication / U.S. shipping suspension acknowledgments mandatory. Request keys, optimistic latest snapshot/escalation receipt checks and bounded reads protect concurrent operations.
- Does not clear the durable Build 399 single-attempt claim; no Etsy/Meta writes, provider activation, U.S. shipping enablement, or automatic retry.
- Existing Build 410 evidence dashboard remains unchanged. The Build 411 panel in I.T. Integrations can use the same Product and draft selection.
- **Release GREEN means CI and Production checks, not live Etsy/Meta approval.**

## Next proposed
Build 412 — Escalation Work Queue, Operator Assignment & Verified Destination Change Review.
