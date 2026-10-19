# Release 467 Build 425 — Explicit Owner Acceptance Receipt & Manual Closure Decision Readiness Audit

Build 425 introduces a **verified Admin, selected-case, owner-only** review and explicit **local acceptance** receipt. It builds on the bounded Build 423/424 chain and reads its current owner, source signature, and seven local source receipt IDs.

1. **GET** `/api/admin/provider-owner-acceptance-425` returns bounded (100+1) acceptance history, valid/stale chain checks, owner proof, and an always-separate manual closure audit HOLD.
2. **POST** appends one local `admin_action_audit` row only when the current assigned owner supplies a 20–600 character note, explicit confirmations, an idempotency key, exact current source receipts, handoff, decision, owner acknowledgement and previous acceptance IDs.
3. SQL uses conditional insert with optimistic guards on the seven source audit types, latest exception decision, Build 422 acknowledgement, latest Build 425 acceptance receipt, and duplicate request key. Conflict or incomplete scan **fails closed**. Identical retries return the same receipt, not a second insert.
4. The Admin UI requires a deliberate action and displays unresolved manual closure requirements. The local acceptance **never** verifies live provider state, closes an exception, reassigns a case, reopens a case, notifies users or publishes listings. U.S. shipping remains suspended.

**Manual closure is NOT authorized by Build 425**, including after a valid acceptance receipt. Independently verified provider evidence and a separate authorized human closure decision are required; no such write/approval operation is provided by this build.

Next proposed: **Build 426 — Bounded Acceptance Continuity, Provider Evidence Provenance & Manual Closure Gate Review.**
