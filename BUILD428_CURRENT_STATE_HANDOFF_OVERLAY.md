# Build 428 — Current Parity Handoff Overlay

Use this overlay as the current schema-parity/release authority until the active Production parity sequence closes and `AI_HANDOFF.md` is refreshed.

## Current gate state

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production Product-number stage           PASS
Build 428  Remaining parity authorization boundary   CURRENT
```

## Product-number authority

The legacy Product-number blocker is closed in both environments:

```text
Development Products        45 unique numbers 1084..1128
Development sequence next   1129
Production Products         45 unique numbers 1084..1128
Production sequence next    1129
Product identities          exact by ID + slug + name
```

The pre-write Production backup for that stage was 19,002,028 bytes with SHA-256 `5ec4fd7731706c598e2958e831ad5a9ddce327b2a78c4dec261a718b0261ceed`.

## Remaining additive families

Fresh Build 428 read-only evidence is the authority for whether each gap still exists before authorization:

- Gift Card Build 384 lookup-attempt columns/indexes and lookup-lockout table/index.
- Notification Build 403 `metadata_json` and current indexes.
- Product-image annotation Build 197 composite index.

Each remaining additive family has a separate Build 428 token and must take its own fresh full Production D1 export before its own write. Product-number authorization does not authorize any of them.

## Remaining rebuild families

- Membership Build 395: separate three-row data-preserving rebuild; Build 428 preview is inert only.
- Fractional Inventory/Creative Project: five bounded table families, preserve REAL values and exact Inventory row counts.
- Product/FK: execute only while immediately refreshed orphan counts are zero.
- Accounting/default/nullability: execute only after family-specific compatibility evidence and rollback boundary.

## Preserve/exclude

```text
search_query_terms          preserve live rows pending authority decision
__sql_test                  leave untouched pending retirement authority
CAIP/private R2             excluded from schema parity; never copy D1 metadata alone
```

## Safety boundary

```text
Gift Card authorization                 NOT RECEIVED
Notification authorization              NOT RECEIVED
Annotation-index authorization          NOT RECEIVED
Rebuild-family authorization            NOT RECEIVED
Provider/R2 mutation                    DISABLED
Production promotion                    CLOSED
```
