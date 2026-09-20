# Release 467 Build 210 — Custom Work Intake 2.0

## Goal

Enrich the existing Custom Request intake rather than creating another request system.

## Starting boundary

Starts only after Release 467 Build 209 is exact-SHA Production GREEN.

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Extend existing authority

- /custom-request/
- /admin/custom-request/
- custom_requests
- reference uploads
- existing quote/order journey

## Non-overlap / safety boundary

- Preserve existing budget/deadline/occasion/handoff/reference-image authority.
- No automatic order, reservation, quote acceptance or manufacturing promise.

Permanent release rules also remain in force: exact-green Development before protected-main promotion; Production business data stays Production-owned; no request-time DDL; no unbounded D1/R2 work; no silent cost/setting/fact invention; external provider/payment/publication lanes remain held unless separately authorized.

## Acceptance

1. Quantity, project intent, company/event context, supplied-item flag, material/finish and capability-aware request types are captured.
2. A customer can explicitly choose “help me decide how to make it.”
3. Existing private status journey remains canonical.

## Next

Release 467 Build 211 — Manufacturing Triage & Route Proposal — remains blocked until this build is fully Production GREEN.
