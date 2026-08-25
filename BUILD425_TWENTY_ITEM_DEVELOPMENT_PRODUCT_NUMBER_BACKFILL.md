# Build 425 — Twenty-Item Development-First Product-Number Backfill

## Status

**READY FOR GUARDED DEVELOPMENT-ONLY WRITE + LIVE POST-WRITE PROOF / PRODUCTION WRITES CLOSED**

Build 424 passed its live reservation evidence and local 20/20 gate.

Recorded safe reservation:

```text
Development Products                     45
Production Products                      45
Shared Product IDs                       45
Identity mismatches                       0
Development missing product_number       45
Production missing product_number        45
Historical maximum Product number         0
Development sequence next              1000
Production sequence next               1084
Candidate legacy block             1084..1128
Candidate next Product number          1129
Executable statements in preview          0
```

The Production sequence is the higher never-reused reservation boundary, so Development deliberately skips 1000–1083 and uses the shared 1084–1128 legacy block. This preserves future Dev/Prod identity alignment without reusing numbers the Production sequence has already reserved.

Production remains untouched in Build 425.

## Build 425 — 20 source/safety changes

1. Recorded Build 424 as PASS with candidate Product-number block 1084–1128 and next value 1129.
2. Added a Development-only Product-number backfill helper with no Production write command.
3. Added a hard Development database-name guard for `devilndove-dev`.
4. Added a hard Development database UUID guard for `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
5. Added refusal when `wrangler.toml` unexpectedly contains the Production D1 UUID.
6. Added live pre-write Product identity checks against the Build 424 45-row map.
7. Added live pre-write requirement that all 45 Development Product numbers are still NULL.
8. Added live read-only confirmation that all 45 Production Product numbers remain NULL.
9. Added exact Development and Production sequence stale-evidence checks against Build 424.
10. Added live collision checks across every Product-number-bearing table identified by Build 424.
11. Added DND-formatted SKU overlap reporting without conflating SKU identity with Product-number identity.
12. Added a full remote Development D1 SQL export before the first Product-number write.
13. Added SHA-256 recording for the Development backup export.
14. Added one deterministic guarded Development update covering the exact 45 Product IDs/slugs and only NULL Product-number cells.
15. Added monotonic sequence upsert to 1129 that can advance but never roll back a higher sequence.
16. Added local in-memory regression proving first pass = 45 Product updates and second pass = 0 Product updates.
17. Added live Development post-write proof for exact 45 unique values, exact 1084–1128 mapping, unchanged Product IDs/slugs/names, and sequence >=1129.
18. Added live Production untouched proof after the Development write and a read-only next-allocation preview without creating a Product.
19. Added an inert Production Product-number preview that is generated only after Development post-write proof passes; all Production mutation-looking lines remain comments.
20. Added a local twenty-item Build 425 completion gate; Production mutation and promotion remain closed.

## Development write safety sequence

Build 425 is intentionally split into separate commands:

```text
1. local source compile/regression
2. live Development/Production read-only preflight
3. explicit Development-only apply command
4. live Development post-write + Production untouched proof
5. inert Production preview generation
6. local 20-item completion gate
```

The Development apply command requires the literal confirmation token:

```text
DEV-ONLY-PRODUCT-NUMBERS
```

If SKU overlap evidence exists, the helper stops before writing unless the overlap was reviewed and `--ack-sku-overlap` is supplied.

## Backup boundary

Before any Development Product-number write, Build 425 runs a full remote D1 export using current Wrangler 4.126.0 syntax:

```text
npx --yes wrangler@4.126.0 d1 export devilndove-dev --remote --config wrangler.toml --skip-confirmation --output=<local backup>
```

The local backup is stored below `local_backups/`, and Build 425 records its SHA-256 and byte size in the local apply-evidence artifact.

## Expected successful Development state

```text
Development Products                     45
Development mapped Product numbers       45
Development unique Product numbers       45
Development Product-number range  1084..1128
Development sequence next              >=1129
Product IDs/slugs/names unchanged        YES
Read-only next allocation preview       1129

Production Products                      45
Production Product numbers still NULL    45
Production sequence next                1084
Production write executed                 NO
```

## Generated local artifacts

```text
build425_development_product_number_preflight.local.json
build425_development_product_number_apply.local.json
build425_development_product_number_postwrite.local.json
build425_nonexecuting_production_product_number_preview.local.sql
local_backups/build425_dev_before_product_numbers_<timestamp>.sql
```

These are evidence/rollback artifacts and are not canonical source files.

## Safety boundary

```text
Development Product-number write       EXPLICIT / GUARDED / BACKED UP
Production Product-number write         DISABLED
Production schema mutation              DISABLED
Executable Production helper            DISABLED
Broad Production -> Development copy    DISABLED / CANCELLED
CAIP D1-only metadata copy              DISABLED / FORBIDDEN
Provider mutation                       DISABLED
Production promotion                    CLOSED
```

## Next 20 ordered changes

1. Build 426: record the exact Build 425 Development backfill and post-write proof in Markdown.
2. Build 426: update `AI_HANDOFF.md` with Builds 417–425 authoritative parity status and Product-number disposition.
3. Build 426: update `PROJECT_STATUS_AND_ROADMAP.md` with the same gate state and remaining Production work.
4. Build 426: rerun a bounded live Product-number parity check showing Dev mapped 1084–1128 while Prod remains 45 NULL.
5. Build 426: rebuild the Production Product-number reservation preflight from current live state and invalidate the Build 425 preview if any sequence/history value changed.
6. Build 426: require an exact fresh Production backup/export boundary before any later Product-number write.
7. Build 426: create the reviewed executable Production Product-number migration candidate, but keep execution behind an explicit separate authorization token.
8. Build 426: add Production Product-number post-write proof mirroring all Development assertions.
9. Build 426: assemble Gift Card additive Production migration candidate from Build 384 authority.
10. Build 426: assemble Notification additive Production migration candidate from Build 403 authority.
11. Build 426: assemble the Build 197 Product-image annotation index candidate.
12. Build 426: assemble Membership Build 395 data-preserving Production rebuild with backup/shadow assertions.
13. Build 426: assemble fractional Inventory/Creative Project rebuild candidates with REAL-affinity preservation.
14. Build 426: require exact 1,041-row `site_item_inventory` preservation in every rebuild preview/test.
15. Build 426: assemble Product/FK rebuild candidates only for live zero-orphan families.
16. Build 426: assemble Accounting/constraint candidates only where Build 421 compatibility evidence permits them.
17. Build 426: keep `search_query_terms` five Production rows preserved pending explicit authority decision.
18. Build 426: keep empty `__sql_test` untouched in the parity release pending retirement authority.
19. Build 426: keep the 113-row CAIP/private-R2 delta outside the schema parity release.
20. Build 426: produce a complete Production release-candidate gate/package; actual Production mutation remains a separate explicit decision.

## Gate status

```text
Build 410  Development D1 parity overlay             PASS
Build 412  Local RC                                  PASS
Build 416  Development browser/read contracts        PASS
Build 417  Live schema/data mapping                  PASS
Build 418  Live semantic classification              PASS
Build 419  Exact structural drift evidence           PASS
Build 420  20-item parity hardening                  PASS (20/20)
Build 421  20-item Production evidence/manifest      PASS (20/20, 1 blocker)
Build 422  20-item local release fixtures            PASS (20/20)
Build 423  Product-number evidence/fixtures          COMPLETE — shared legacy NULL gap identified
Build 424  Product-number reservation/preview        PASS (20/20), block 1084..1128
Build 425  Development-first Product-number backfill READY

Production schema/data mutation                      CLOSED
Production promotion                                 CLOSED
```
