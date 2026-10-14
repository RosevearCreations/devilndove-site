# Release 467 Build 396 — Etsy Monitoring Reliability, Alert Routing & Audit Closure

**Status: Development closure candidate — NOT Production GREEN until exact source and live checks pass.**

## Implemented scope
- Read current stored Etsy connection or one-Product price-source exception only when an administrator requests it.
- Route a specific active exception into the **internal Admin queue** with an operator-chosen priority and non-secret work reference. The queue uses the existing `admin_action_audit` table, not new schema.
- Explicit operator acknowledgement; separate close-reviewed action only after stored evidence shows recovery and the route has been acknowledged.
- Immutable actor-linked receipts, idempotency key and exact source fingerprint. Stale audit-head writes are rejected by a conditional single-statement insert, including concurrent operator actions.
- Bounded recent internal routes and per-exception history. List rows are historical routes, **not current unresolved issue counts**.
- Unknown D1/read results fail closed. No automatic retry, reauthorization, provider polling, Product adjustment, Etsy listing write, SMS or email delivery.

## Safety limitations
Routing here means **internal staff queue only**, not external notification delivery. A user must open this I.T. Integrations workspace to view the queue. Live Etsy connectivity is not independently probed, and a recorded source price may be operator-attested rather than independently validated. Synthetic CI does not count as human browser/operator acceptance.

## Previous exact release
Build 395 Development: `aeb8d787cf414932b5c6a3012924f055e7ccf691`, source tree `8d9869b3f0ad94f1f3cdfece5fda677cff39abdd`.
System 38505175037, Quality 38505174883, I.T. 38505174943, Hygiene 38505174923.
Build 395 Production: `62dc580df54721ea15d9274ac7dba2509c0161bc`, Pages 38505357264, Live Integrity 38505426778.

## Release checklist
- [ ] Build 396 alert regression passes on exact candidate SHA.
- [ ] System Gate, Application Quality, I.T. Runtime and Branch Hygiene all pass at that same SHA.
- [ ] Development preview deploy passes.
- [ ] Promote identical approved source tree to `main` only after development green; never merge unrelated divergent branch commits.
- [ ] Production Pages deploy and independent Production Live Resource Integrity pass for promoted main SHA.
- [ ] Track authenticated live operator interaction as a distinct follow-up; do not pretend this CI validates user-entered evidence.

**Next queued: Build 397 — Etsy Connection Observability & Price Review Outcomes.**
