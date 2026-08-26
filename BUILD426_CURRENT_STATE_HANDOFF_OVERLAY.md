# Build 426 — Current Parity Handoff Overlay

> Use this overlay as the authoritative current parity/release state until `AI_HANDOFF.md` is refreshed after the Production parity release closes. Historical Build 279 prose remains useful architecture history but is not current parity authority.

## Current authoritative parity state

```text
Build 410  Development D1 parity overlay             PASS
Build 412  Local RC                                  PASS
Build 416  Development browser/read contracts        PASS
Build 417  Live schema/data mapping                  PASS
Build 418  Live semantic classification              PASS
Build 419  Exact structural drift evidence           PASS
Build 420  20-item parity hardening                  PASS (20/20)
Build 421  Production evidence/manifest              PASS (20/20, 1 blocker)
Build 422  Local release fixtures                    PASS (20/20)
Build 423  Product-number evidence                   COMPLETE — Dev+Prod legacy NULL gap
Build 424  Product-number reservation                PASS (20/20), 1084..1128
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     CURRENT
```

## Product-number disposition

- The 45 logical Products match by `product_id + slug + name` between Development and Production.
- Build 195 created the permanent never-reused sequence but intentionally did not backfill legacy Product numbers.
- Production sequence had already advanced to 1084, so Builds 424–425 reserved `1084..1128` for the shared 45-row legacy mapping.
- Development now contains exact unique Product numbers `1084..1128` and sequence next `1129`.
- Production still contains 45 NULL Product numbers and sequence next `1084`.
- Production Product-number mutation remains closed until a fresh Production backup and stale-evidence proof are completed in a later explicit execution gate.

## Production parity families

### Bounded candidate families

- Product-number legacy backfill: guarded 45-row mapping from proven Development identity.
- Gift Card Build 384 additive parity: five lookup-attempt columns, lookup indexes, lockout table/index.
- Notification Build 403 additive parity: `metadata_json` and current indexes.
- Product image annotations Build 197 composite index.

### Review-required data-preserving rebuild families

- Membership Build 395 legacy → canonical mapping.
- Fractional Inventory/Creative Project quantity affinity changes.
- Product/FK families, only while fresh orphan counts remain zero.
- Accounting/default/nullability families, only while compatibility evidence remains clean.

### Explicit preserve/exclude decisions

- `search_query_terms`: preserve five Production rows pending authority decision.
- `__sql_test`: leave empty Production residue untouched pending retirement authority.
- CAIP: 113 Production D1 metadata rows plus private R2 originals remain outside schema parity; never copy D1 metadata alone.

## Safety boundary

```text
Production D1 mutation                  CLOSED
Production Product-number write         CLOSED
Provider mutation                       DISABLED
Broad Production -> Development copy    CANCELLED
CAIP D1-only copy                       FORBIDDEN
Production promotion                    CLOSED
```

Build 426 may assemble candidates and perform read-only live evidence. It must not execute Production DDL/DML.
