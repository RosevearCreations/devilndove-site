# Build 423 Validation

## Status

**EVIDENCE COMPLETE — LOCAL FIXTURES PASS 20/20 / PRODUCT-NUMBER RELEASE GATE CORRECTLY BLOCKED / PRODUCTION WRITES CLOSED**

Owner-run evidence on August 25, 2026 proved Development and Production contain the same 45 logical Products but neither database has legacy Product numbers populated:

```text
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 45
Development duplicate product_number: False
Development number range: None..None
Production missing product_number: 45
Production existing numbered rows: 0
Development sequence table exists: True
Production sequence table exists: True
Non-executing mapping safe to prepare: NO
BUILD 423 PRODUCT NUMBER BACKFILL EVIDENCE: BLOCKED
```

The Build 423 in-memory fixture suite passed:

```text
BUILD 423 LOCAL RELEASE FIXTURE REGRESSION: PASS (20/20)
Gift Card additive/idempotent fixture: PASS
Notification additive fixture: PASS
Membership preservation fixture: PASS
Fractional Inventory preservation fixture: PASS
Product/FK orphan refusal fixture: PASS
Product-number uniqueness/sequence fixture: PASS
```

The final Build 423 local gate failed only the three assertions that intentionally required a populated Development Product-number source mapping. This was correct fail-closed behavior:

```text
05. FAIL — Product-number live identity evidence is safe to prepare as a non-executing backfill map
08. FAIL — Development has a complete unique Product-number mapping
10. FAIL — Non-executing Product-number map contains 45 unique IDs and 45 unique 1000+ numbers
```

## Root cause

Build 195 introduced the never-reused sequence but explicitly did not change existing Product numbers. The pre-existing 45 legacy Products therefore remained NULL in both databases.

Build 424 must determine a never-reused reservation block from current sequence/history evidence rather than copying Development values or blindly starting at 1000.

## Safety result

- Build 423 D1 access: **read-only only**.
- Development mutation: **none**.
- Production mutation: **none**.
- R2/provider mutation: **none**.
- executable Production helper: **none**.
- Production promotion: **closed**.

Next authority: `BUILD424_TWENTY_ITEM_PRODUCT_NUMBER_RESERVATION.md`.
