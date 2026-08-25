# Build 425 Validation

## Status

**READY — DEVELOPMENT-ONLY PRODUCT-NUMBER WRITE / PRODUCTION WRITES CLOSED**

Build 424 proved the collision-free legacy block `1084..1128`, next `1129`, with zero historical Product-number values and exact 45/45 Product identity parity.

Build 425 is the first write in this parity sequence, and it is restricted to **Development D1 only**.

## Stage A — source compile + local regression

```bash
git pull origin dev

python -m py_compile \
  scripts/build425_development_product_number_backfill.py \
  scripts/build425_product_number_backfill_regression.py \
  scripts/build425_nonexecuting_production_product_number_preview.py \
  scripts/build425_twenty_item_completion_gate.py

python scripts/build425_product_number_backfill_regression.py
```

Expected:

```text
BUILD 425 PRODUCT NUMBER BACKFILL REGRESSION: PASS
First pass Product updates: 45
Second pass Product updates: 0
Legacy block: 1084..1128
Next Product number: 1129
```

## Stage B — live read-only preflight

```bash
python -u scripts/build425_development_product_number_backfill.py --preflight 2>&1 | tee build425_development_product_number_preflight.txt
```

Expected core result:

```text
BUILD 425 DEVELOPMENT PRODUCT NUMBER PREFLIGHT
Target: devilndove-dev (dbc1615b-dcbe-4951-973b-b47c99c73bfa)
Candidate block: 1084..1128
Candidate next: 1129
Identity/state/sequence fresh: YES
SKU overlaps: <count> (informational; review before write)
Production mutation capability: NONE
BUILD 425 DEVELOPMENT PREFLIGHT: PASS
```

### SKU overlap rule

If `SKU overlaps: 0`, proceed with the normal Development apply command below.

If `SKU overlaps` is greater than zero, **do not apply yet**. Preserve/paste the preflight output so the overlaps can be reviewed. SKU and Product number are separate fields, but Build 425 deliberately requires human acknowledgement before a write when encoded DND SKU values overlap the reserved block.

## Stage C — guarded Development-only write

When Stage B is PASS with zero SKU overlaps:

```bash
python -u scripts/build425_development_product_number_backfill.py \
  --apply-development \
  --confirm DEV-ONLY-PRODUCT-NUMBERS \
  2>&1 | tee build425_development_product_number_apply.txt
```

If reviewed SKU overlaps must be explicitly acknowledged later, the same command additionally requires:

```text
--ack-sku-overlap
```

Before the write, the helper automatically creates a full remote Development D1 export under `local_backups/` using current Wrangler 4.126.0 `d1 export --remote --output=... --skip-confirmation` syntax. The export SHA-256 is recorded locally.

The write helper contains no Production D1 execute/export-mutation target. Production is queried only by the pre/post read-only proof.

## Stage D — live post-write proof

```bash
python -u scripts/build425_development_product_number_backfill.py --postcheck 2>&1 | tee build425_development_product_number_postwrite.txt
```

Expected:

```text
=== BUILD 425 DEVELOPMENT POST-WRITE PROOF ===
Development Products: 45
Development mapping exact: True
Development unique Product numbers: 45
Development Product-number range: 1084..1128
Development sequence next: 1129
Read-only next allocation preview: 1129
Production Products: 45
Production still all Product numbers NULL: True
Production sequence next: 1084
Production write executed: NO
BUILD 425 DEVELOPMENT POST-WRITE PROOF: PASS
```

A sequence greater than `1129` is only acceptable if the live evidence explains a later legitimate Development allocation; the Build 425 completion gate requires it to remain at least `1129`.

## Stage E — inert Production preview + local completion gate

Only after Stage D passes:

```bash
python scripts/build425_nonexecuting_production_product_number_preview.py
python scripts/build425_twenty_item_completion_gate.py
```

Expected:

```text
BUILD 425 NON-EXECUTING PRODUCTION PRODUCT NUMBER PREVIEW: PASS
Mapped Products: 45
Candidate block: 1084..1128
Candidate next: 1129
Executable statements generated: ZERO
Production mutation executed: NO

BUILD 425 TWENTY-ITEM DEVELOPMENT PRODUCT NUMBER COMPLETION GATE: PASS (20/20)
Development legacy Product numbers: 1084..1128
Development next Product number: 1129
Production Product numbers: unchanged / still NULL
Production preview executable statements: ZERO
PRODUCTION PROMOTION: CLOSED
```

## Failure handling

- A compile/regression failure is a source defect; do not contact D1 to work around it.
- A preflight failure means Build 424 evidence is stale or live state changed; do not write Development.
- A D1 export failure means there is no rollback boundary; do not write Development.
- An apply failure means preserve the backup and command output, then run postcheck before deciding anything else.
- A postcheck failure means **Production remains closed** and the Development backup is retained for recovery review.
- Never rerun Builds 417–424 merely because Build 425 fails; diagnose the exact Build 425 stage.

## Current Cloudflare CLI basis

Current Cloudflare D1 documentation supports:

```text
wrangler d1 execute [DATABASE] --remote --file <sql> --yes
wrangler d1 export [DATABASE] --remote --output=<file> --skip-confirmation
```

Build 425 pins `wrangler@4.126.0`, matching the working Build 418–424 Windows path.

## Safety

```text
Development Product-number write       explicit + guarded + backed up
Production Product-number write         disabled
Production schema/data mutation         disabled
Executable Production helper            disabled
Production promotion                    closed
```
