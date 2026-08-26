# Build 427 Validation

## Status

**PASS — PRODUCTION PRODUCT-NUMBER STAGE COMPLETE / DEV+PROD 1084..1128 / PRODUCTION PROMOTION CLOSED**

Build 427 first closed its source/read-only authorization boundary at 20/20, then received explicit authorization for the Product-number-only Production stage.

## Authorization boundary — PASS

```text
BUILD 427 PRODUCTION EXECUTION SAFETY REGRESSION: PASS (20/20)
BUILD 427 PRODUCTION EXECUTION PREFLIGHT: PASS
BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE: PASS (20/20)
```

The Product-number authorization applied only to:

```text
45 guarded products.product_number assignments
catalog_product_number_sequence monotonic advance
```

Gift Card, Notification, Product-image annotation, Membership, fractional Inventory, Product/FK and Accounting/default families were not authorized by that token.

## Production backup — PASS

A full remote Production D1 export was created before mutation and revalidated immediately before the successful write:

```text
Backup: local_backups\build427_prod_before_product_numbers_20260826T003614Z.sql
Bytes: 19002028
SHA-256: 5ec4fd7731706c598e2958e831ad5a9ddce327b2a78c4dec261a718b0261ceed
Existing backup recheck: PASS
Backup age at successful apply: 369 seconds
```

## First apply attempt — safely blocked before DML

The first authorized apply attempt received Cloudflare authorization code `7403` during an unrelated Development Inventory read in the broad Build 426 evidence refresh. It stopped before Product-number DML was submitted.

The immediate postcheck proved Production remained unchanged at that point:

```text
Production Product numbers: 0..0 (0 unique)
Production sequence next: 1084
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Product identities equal: True
```

Build 427 therefore classified `7403` as an authorization/read interruption rather than schema evidence or a partial write.

## Focused pre-write repair — PASS

The Product-number executor was narrowed so the immediate-before-write recheck covers only facts that can invalidate the Product-number stage:

1. exact 45 Product identities in both environments;
2. Development map exactly `1084..1128`;
3. all 45 Production Product numbers still NULL before write;
4. Production sequence still `1084` before write;
5. Development sequence still `>=1129`;
6. no candidate collisions in Production Product-number history tables.

The focused retry reported:

```text
Production identities unchanged: True
Development mapping unchanged: True
Production Product numbers still all NULL: True
Production sequence next: 1084
Development sequence next: 1129
Candidate history collisions: []
Safe for Product-number-only write: YES
```

## Production Product-number apply — COMPLETE

Wrangler executed the explicitly authorized Product-number-only SQL against:

```text
devilndove-prod
0dc8fa3e-319c-45f7-a515-34c8acd89fcf
```

Execution summary:

```text
Processed queries: 47
Rows read: 46
Rows written: 91
Database changed: true
Scope: Product numbers only
Gift Card/Notification/index/rebuild families: NOT EXECUTED
PRODUCTION PROMOTION: CLOSED
```

The row-write count includes the guarded Product updates plus SQLite/index/sequence bookkeeping; scope authority is the generated Product-number-only SQL and the subsequent exact postcheck.

## Immediate Production/Development postcheck — PASS

Owner-run postcheck completed successfully:

```text
Production Product numbers: 1084..1128 (45 unique)
Production sequence next: 1129
Development Product numbers: 1084..1128 (45 unique)
Development sequence next: 1129
Product identities equal: True
PRODUCTION PROMOTION: CLOSED
BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK: PASS
```

This closes the Product-number blocker for both environments.

## Current parity boundary

```text
Build 425  Development Product-number backfill       PASS (20/20)
Build 426  Production release-candidate assembly     PASS (20/20)
Build 427  Production authorization boundary         PASS (20/20)
Build 427  Production Product-number backup          PASS
Build 427  Production Product-number apply           PASS
Build 427  Production Product-number postcheck       PASS

Development Product numbers                          1084..1128
Development sequence next                            1129
Production Product numbers                           1084..1128
Production sequence next                             1129
Product identity parity                              EXACT

Gift Card additive mutation                          NOT AUTHORIZED
Notification additive mutation                       NOT AUTHORIZED
Product-image annotation index mutation              NOT AUTHORIZED
Membership rebuild                                   NOT AUTHORIZED
Fractional Inventory rebuilds                        NOT AUTHORIZED
Product/FK rebuilds                                  NOT AUTHORIZED
Accounting/default rebuilds                          NOT AUTHORIZED
Production promotion                                 CLOSED
```

## Handoff

Proceed to Build 428 as a source/read-only preparation and authorization-boundary pass for the remaining additive and rebuild families. Do not infer authorization for any remaining Production mutation from the successful Product-number stage.
