# Build 436 Membership Rebuild Authorization Boundary — Superseded by Build 437

Build 436 prepared the guarded shadow-table rebuild and its exact authorization token. Build 437 incorporates the owner-run findings that followed, including preservation of the intentional legacy sort index.

Current Membership authority:

`BUILD437_MEMBERSHIP_COMPLETION_RELEASE.md`

The exact token remains unchanged and remains **not authorized** until supplied literally:

```text
AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD
```

Build 437 requires the reviewed legacy index:

```text
idx_membership_tier_policies_sort(sort_order, code)
```

to be recreated canonically as:

```text
idx_membership_tier_policies_sort(sort_order, tier_code)
```

No other user-defined Membership index/trigger is accepted. Inbound/outbound foreign keys and rebuild-name collisions must remain zero. The complete three-row source and canonical fingerprints must remain unchanged immediately before the guarded backup/apply sequence.

```text
Membership Production backup                 NOT CREATED
Membership Production mutation               NOT EXECUTED
Later rebuild-family authorization            NOT RECEIVED
Production promotion                          CLOSED
```
