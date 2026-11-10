# Devil n Dove — Release 467 Build 667 Comms handoff owner guide

**Devil n Dove is the owned-business source** (`devilndove`); its own actual Creative Projects, source workshop journal, customer information, consent and notification outbox remain under Devil n Dove permissions. **Rosevear Comms Hub** is the complementary suite-wide communications and incident coordination master, not a backdoor for the other business applications to send or change Devil n Dove information.

## What this build prepares

The [Build 667 offline handoff contract](RELEASE_467_BUILD_667_COMMS_HANDOFF_PREVIEW_CONTRACT.json) and `scripts/release467_build667_comms_handoff_preview.mjs` provide a source-revision-aware, **non-sending** preview of five narrow intents:

| Original source intent | Proposed event family | Hold boundary |
| --- | --- | --- |
| Actual workshop project status | `workflow.status.changed` | Read only the original Creative Project event/revision. A Build 657 owner *review* alone cannot publish canonical progress. |
| Workshop quality/rework/private-learning state | `workflow.status.changed` | Private experiments, salvage and notes remain internal; no customer/media release is inferred. |
| Original runtime incident opened | `incident.opened` | Only status/severity metadata, no code path, private note, device, recipient or other tenant payload. |
| Incident review/follow-up update | `incident.updated` | No outbound routing until authorized original case, Comms receiver and operator assignment exist. |
| Local notification intent review | **None** | A review request is not a consent-change event, transport instruction or authorization to send. |

The preview accepts only `kind`, enumerated `status`, exact 40-character local `sourceRevision`, ISO `occurredAt`, and an enumerated `severity` for incidents. Unknown or potentially private fields are refused. A stale observation or drifted source revision stays HOLD. No recipients, customer contact details, staff details, notes, media, provider tokens, signed receipts, case ID or replay nonce are generated.

### Existing independent source systems remain intact

- The authentic workshop status is in the original Creative Projects/Events/Outputs; Build 657's private owner QA ledger is **not** proof of independently verified production completion.
- The existing authenticated Devil n Dove notification outbox supports **its own** Admin step-up and dispatch policy. This build does not call, replace, disable or grant it new permissions; it does **not** route that outbox into Comms Hub.
- The source-owned `functions/api/_lib/ql364-source-health.mjs` and `.well-known/rosevear-integration-manifest.json` are unchanged. Source identity, manifest, owner signer, pinned TLS, nonce replay protection, original QL-365D signed TEST and receiver acceptance remain **DISCONNECTED / HOLD**.

## Check the source handoff safely

```bash
node --test scripts/release467_build667_comms_handoff_preview.test.mjs
node scripts/release467_build667_comms_handoff_preview.mjs --check
```

The second command prints a sample structural, local-only workshop status; it does not contact Comms or send notifications. The exact original Comms counterpart is the [QL-365D six-app handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md), which lists `devilndove` as the owned-business shell, the source handler and manifest path.

## Steps to authorize later (still independent HOLD)

1. Verify one real original Devil n Dove status/incident revision, owner and source scope, keeping private workshop and customer records inside the original app. Decide whether any notice is actually required, to whom, for which purpose and with what documented customer/employee consent.
2. Independently verify exact source and Master owner issuer/witness custody, the production immutable commit, manifest digest, approved origin, receiver and TLS trust. Enroll source-owned signing keys and durable one-use operation claims through the authorized original-host workflow, not by passing passwords through chat.
3. Complete the QL-365D **one-source, one-GET, TEST-only** authorization, signed response and private receiver verification with a time-limited receipt; that TEST receipt does **not** grant persistent messaging permissions.
4. After separate approved audience, retention, opt-out/suppression and incident-ownership contracts, implement an authenticated source-side outbound adapter with idempotent receipt handling. Test consent revocation, duplicate/replay, stale event, cross-tenant/child impersonation and failed/slow receiver.
5. Require an explicit owner approval for a single real notification or incident route. Keep unattended bulk notification, original customer message, social publishing and all ad spend disabled unless separately approved.

**Current outcome:** Build 667 can reach **software Production GREEN** while `comms-connection=HOLD`, `owner-proof=HOLD`, `original-signed-TEST=HOLD`, `notification-dispatch=HOLD`, and `incident-route=HOLD`. That is a truthful deployment result, not a provider connectivity claim.

**Next proposed Build 668:** Master Shell Cross-Application Pilot, Independent Acceptance & Recovery — single-source read-only proofs and owner-reviewed negative cases before any persistent integration.
