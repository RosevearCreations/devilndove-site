# Build 429 — Twenty-Item Gift Card Production Authorization Boundary

## Status

**READY FOR GIFT CARD LIVE READ-ONLY PREFLIGHT + LOCAL 20/20 GATES / GIFT CARD AUTHORIZATION PENDING / ALL OTHER PRODUCTION FAMILIES LOCKED / PROMOTION CLOSED**

Build 428 passed its repaired twenty-item authorization-boundary gate:

```text
BUILD 428 TWENTY-ITEM REMAINING PARITY AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
Product-number Production stage: COMPLETE / PROVEN
Gift Card authorization: NOT RECEIVED
Notification authorization: NOT RECEIVED
Annotation-index authorization: NOT RECEIVED
Rebuild-family authorization: NOT RECEIVED
Production mutation executed by Build 428: NO
PRODUCTION PROMOTION: CLOSED
```

Build 429 narrows the next Production decision to the Build 384 Gift Card lookup-attempt/lockout additive family only. It does not authorize or execute a Production write.

## Build 429 — 20 completed source/safety changes

1. Recorded the repaired Build 428 local gate as PASS (20/20).
2. Closed Build 428 with Product numbers proven and all remaining Production authorizations false.
3. Added a dedicated Build 429 Gift Card read-only Production authorization preflight.
4. Anchored the Gift Card preflight to the green Build 427 Product-number postcheck and Production range `1084..1128`.
5. Hard-pinned the Gift Card preflight to `devilndove-prod` UUID `0dc8fa3e-319c-45f7-a515-34c8acd89fcf`.
6. Added Windows UTF-8/replacement-safe console handling to the Gift Card preflight.
7. Limited live reads to Gift Card Product prerequisite/schema/index/row evidence; no Notification, annotation or rebuild query is needed for this boundary.
8. Added exact five-column lookup-attempt gap evidence for `lookup_email`, `code_suffix`, `ip_hash`, `user_agent`, and `result_status`.
9. Added exact three-index Gift Card evidence for lookup-created, lookup-email, and lockout-status indexes.
10. Added explicit evidence that `gift_card_lookup_lockouts` is still absent before authorization.
11. Added live preservation counts for `gift_card_lookup_attempts`, `gift_cards`, and `gift_card_redemptions`.
12. Added an exact-known-gap flag so unexpected out-of-band Gift Card drift blocks authorization rather than being silently normalized.
13. Added explicit false flags for Gift Card backup, Gift Card authorization, Production mutation, Notification authorization, annotation authorization, rebuild authorization, and Production promotion.
14. Added a local 20-check Gift Card authorization safety regression against Build 384 authority and the Build 428 executor.
15. The regression proves the future Gift Card stage requires the exact token `AUTHORIZE-BUILD428-PROD-GIFT-CARD`.
16. The regression proves the future Gift Card stage requires a full remote Production D1 export with byte count, SHA-256 and <=30-minute age validation.
17. The regression proves the future Gift Card apply re-reads targeted before-state and requires lookup-attempt row preservation.
18. The regression proves the additive executor contains no Membership, fractional Inventory, Product/FK, or Accounting rebuild path.
19. Added a local 20-check Gift Card authorization-boundary gate requiring fresh live Gift evidence and no inferred authorization.
20. Build 429 contains no Production backup/apply invocation; Gift Card authorization remains a separate explicit owner decision and Production promotion remains closed.

## Reviewed Build 384 Gift Card gap

The canonical authority is `database_gift_card_runtime_parity.sql`.

Expected current Production gap before authorization:

```text
Missing lookup-attempt columns:
  code_suffix
  ip_hash
  lookup_email
  result_status
  user_agent

Missing indexes:
  idx_gift_card_lookup_attempts_created
  idx_gift_card_lookup_attempts_email
  idx_gift_card_lookup_lockouts_status

Missing table:
  gift_card_lookup_lockouts
```

The future authorized stage must preserve the pre-write row counts of:

```text
gift_card_lookup_attempts
gift_cards
gift_card_redemptions
```

No default-template seed or unrelated Gift Card table rebuild is part of this bounded stage.

## Gift Card authorization token — prepared, not authorized

```text
AUTHORIZE-BUILD428-PROD-GIFT-CARD
```

A successful Build 429 read-only/local gate does **not** authorize use of that token. The owner must explicitly provide it in a later turn.

## Future authorized Gift Card execution boundary

After explicit authorization only, the existing Build 428 additive controller may be invoked for `--stage gift`.

Before any write it must:

1. verify the green Product-number postcheck;
2. hard-pin Production name/UUID;
3. create a fresh full Production D1 export dedicated to Gift Card;
4. record backup byte count, SHA-256, UTC creation time and <=30-minute age;
5. re-read the targeted Gift Card before-state;
6. apply only the missing Build 384 lookup columns/indexes/lockout table;
7. re-read the Gift Card state;
8. prove the lookup-attempt row count is preserved.

Notification, annotation-index and rebuild families remain separately locked.

## Safety boundary

```text
Product-number Production remediation        COMPLETE / PROVEN
Gift Card Production authorization           NOT RECEIVED
Gift Card Production backup                  NOT CREATED FOR BUILD 429 EXECUTION
Gift Card Production mutation                NOT EXECUTED
Notification Production authorization        NOT RECEIVED
Annotation-index Production authorization    NOT RECEIVED
Membership/fractional/FK/accounting rebuild  NOT AUTHORIZED
R2/provider mutation                         DISABLED
CAIP D1-only copy                            FORBIDDEN
Production promotion                         CLOSED
```

## Next 20 ordered changes — Build 430

1. Record Build 429 Gift Card preflight/regression/gate evidence as PASS in Markdown.
2. Accept Gift Card Production authorization only through the exact `AUTHORIZE-BUILD428-PROD-GIFT-CARD` token.
3. Rerun the targeted Gift Card before-state immediately before the authorized backup/apply sequence.
4. Create a fresh full Production D1 export dedicated to the Gift Card stage.
5. Verify the Gift Card backup path, nonzero byte count, SHA-256, target UUID, and <=30-minute age.
6. Re-read the Gift Card targeted before-state after backup and refuse unexpected drift.
7. Apply only the missing Build 384 lookup-attempt columns.
8. Apply only the missing Build 384 lookup-attempt indexes and `gift_card_lookup_lockouts` table/index.
9. Prove `gift_card_lookup_attempts` row count is unchanged after the write.
10. Prove `gift_cards` and `gift_card_redemptions` row counts remain unchanged.
11. Prove all five canonical lookup columns, three canonical indexes, and the lockout table now exist.
12. Record the Gift Card backup/apply/postcheck evidence and keep Production promotion closed.
13. Add a dedicated read-only Notification Production authorization preflight after Gift Card is green.
14. Refresh Notification `metadata_json`, four-index and outbox-row evidence from live Production.
15. Add a local Notification authorization safety regression against Build 403 authority.
16. Add a local Notification authorization-boundary gate with no inferred authorization.
17. Keep annotation-index authorization false until Notification has its own separately reviewed boundary.
18. Keep Membership preview inert and rebuild authorization false.
19. Update the current parity handoff/roadmap overlay with the completed Gift Card stage and pending Notification boundary.
20. Produce the next twenty-item gate; Production promotion remains closed until all approved schema work plus browser/read-contract smoke is green.

## Gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   PASS (20/20)
Build 429  Gift Card authorization boundary          READY

Production promotion                                 CLOSED
```
