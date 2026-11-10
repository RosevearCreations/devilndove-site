# Devil n Dove — Release 467 Build 668 Master Shell cross-app pilot and recovery

**Purpose:** a source-owned, **read-only/offline negative-case pilot** to prepare Devil n Dove for independently authorized six-application Master Shell acceptance. This does not replace a real provider connection, signed owner decision, live source evidence or isolated recovery test.

## Architecture and source identities

AI Data Platform is the **master intelligence, monitoring and evidence plane**. Rosevear Comms Hub is the **master communications/operations and incident plane**. Devil n Dove is an independent **owned-business source**. The other sources retain their original product/business boundaries:

| Source ID | Role at Master Shell | Original authority |
| --- | --- | --- |
| `yw` | Yard Workers product shell | Not Rosevear Landscaping or its business tenant |
| `icamp` | iCamp product shell | Not Camp Rosevear or a campground tenant |
| `rosiedazzlers` | Owned-business source | Detailing orders and customers stay private |
| `devilndove` | Owned-business source | Maker Products, workshop, stock, orders, employees and customers stay private |
| `ai-data-platform` | Intelligence master/broker | Read-only metrics and evidence authority; no customer transactions |
| `rosevear-ai-hub` | Original Windows support source | Local device/process support, not a business tenant |

The exact repositories and QL-364 handler paths are captured in the [Build 668 source contract](RELEASE_467_BUILD_668_MASTER_SHELL_PILOT_CONTRACT.json), based on [Comms QL-365D](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md). Devil n Dove's manifest is `.well-known/rosevear-integration-manifest.json`; its real source GET implementation remains `functions/api/_lib/ql364-source-health.mjs`.

## Actual software test scope

```bash
node --test scripts/release467_build668_cross_app_pilot.test.mjs
node scripts/release467_build668_cross_app_pilot.mjs --check
```

This reads the original Build 655/666 source register, Build 667 Comms consent gates and QL-364 function. It exercises **local negative HTTP Request objects only**, without a network connection:

- A non-GET source method and forged business/child header are refused.
- An unsigned private QL-364 GET remains **503 / DISCONNECTED / HOLD** without independently installed source-owner approval, nonce and signing callbacks.
- A credential-bearing remote recovery target is rejected. **No HEAD request or restore is executed**; R2 object visibility is not evidence of an independent D1/R2 backup restore.
- All six source IDs appear in a reference map. Five **external application origins are not contacted or authenticated**; Devil n Dove is the single local software source under test.
- The source manifest's historical revision is reported **STALE** when it does not match local Git `HEAD`; matching locally would still be unsigned.

The sample result reports `PASS_LOCAL_NEGATIVE_ONLY` only for actual local negative gates; unknown original owner/witness, production source revision, TLS, audience, signer, signed QL-365D TEST, one-use replay, backup snapshot, isolated restore, rollback and customer/device acceptance remain **HOLD**.

## Independent owner-supervised acceptance before CONNECTED

1. Verify protected **GitHub `main` and production deployment** independently. Save immutable source commit, actual handler and manifest digests, approved origin, source ID and exact audience. Do not confuse a repository commit with an installed-host receipt.
2. Confirm the real Devil n Dove source owner/issuer, independent witness, and separate master owner actor, using the previously agreed original-host keys and **only their public fingerprints**. Do not paste private keys or passwords into chat.
3. Authorize **one source only** under QL-365D for one private TLS-pinned `GET /api/integration/v1/shell/health`, with an expiry and **durably one-use** operation ID. Verify the source-signed reply and original receiver. A TEST receipt does not turn on persistent messages.
4. For AI Data Platform, accept only versioned, redacted source-health/module evidence. For Comms, accept only separately consented notification/incident routes. Verify tenant isolation with explicit negative tests: no access to customers, staff, Camp Rosevear, Rosevear Landscaping or other companies by impersonating a product shell.
5. Inspect original D1/R2 backup inventories, retention windows, encrypted copy custody and an **isolated witnessed restoration** under a documented rollback plan. Capture actual independently signed recovery evidence; **do not** restore into production during this pilot.
6. Only after both original owners approve the exact audience, data scope, expiry, replay handling and recovery may a future executable source adapter enable persistent connections. Missing or stale evidence stays **HOLD**.

**Production GREEN for Build 668** means its code and software checks deployed successfully. It is not a verified six-app LIVE connection or an original independent recovery certification.

**Next proposed Build 669:** Master Shell Owner Acceptance Casebook, Single-Source Trust Gaps & Recovery Follow-Up Queue (subject to renewed owner priority; do not repeat already approved connection work).
