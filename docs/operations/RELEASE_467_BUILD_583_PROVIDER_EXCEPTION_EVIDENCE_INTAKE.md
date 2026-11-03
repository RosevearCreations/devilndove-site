# Devil n Dove Release 467 — Build 583

**Independent Provider Exception Evidence Intake & Owner Trial Authorization Decision Readiness**

Build 583 adds section 8 to `/admin/channel-trials/`, following the exact-source exception handoff in Build 582.

## What an owner can do

1. Recompute the exact original receipt, owner review, trial gate, and open provider exceptions in sections 3–7.
2. Choose an outstanding Etsy, Facebook Page, or Instagram exception. Add a **redacted** external case/receipt reference, optional provider correlation ID, account identity, claimed scope, independent reviewer and precise requested owner trial scope.
3. Recheck source-pinned intake. Account mismatches, repeated evidence locators, and evidence from a replaced provider claim remain visible and unresolved.
4. Copy an owner-readable decision-readiness packet for later independent provider authentication and an explicit owner decision.

## Verified boundary

- Saved items reside in browser localStorage and are always `SUBMITTED_UNVERIFIED`.
- A typed provider ID or reviewer reference is **not** authenticated evidence; even matching source references cannot verify a provider or close an exception.
- The packet reports **zero** authenticated receipts, verified scopes, owner trial approvals, exception closures, provider writes and D1 operations.
- Owner trial decision is `NOT_RECORDED`, sign-off `PENDING`, and disposition `HOLD_PENDING_INDEPENDENT_PROVIDER_EVIDENCE_AND_EXPLICIT_OWNER_DECISION`.
- No Etsy draft creation/update, image upload, Meta publication, OAuth grant or provider POST is authorized. A failed/unknown Etsy POST must be read back using the real provider before a retry. Facebook Marketplace classified listings remain manual.
- Never enter access tokens, passwords, client secrets, API keys, customer information or private media links.

## Acceptance

`node --test scripts/release467_build583_provider_intake.test.mjs` verifies fail-closed intake, tampering, source staleness, mismatches, duplicate locators, no-write UI and the production marker. CI's Current Application Quality Proof runs it alongside the established release checks.

## Next candidate

**Build 584 — Authenticated Provider Evidence Witness Review & Explicit Owner Trial Authorization Gate**, gated by genuine external provider receipts and separate owner authorization. No real provider trial is automatically authorized by this proposal.
