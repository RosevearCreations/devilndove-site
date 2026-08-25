# Build 424 Validation

## Status

**READY — ONE LIVE READ-ONLY RESERVATION GATE + LOCAL INERT PREVIEW / 20-ITEM GATE**

Build 424 does not mutate Development or Production. It computes a safe candidate legacy Product-number block above all evidenced sequence/history reservations, writes a local JSON evidence artifact, then generates a fully commented SQL preview.

## Run

From `dev`:

```bash
git pull origin dev

python -m py_compile \
  scripts/build424_product_number_reservation_evidence.py \
  scripts/build424_nonexecuting_product_number_preview.py \
  scripts/build424_twenty_item_nonexecuting_gate.py

python -u scripts/build424_product_number_reservation_evidence.py --run 2>&1 | tee build424_product_number_reservation.txt

python scripts/build424_nonexecuting_product_number_preview.py

python scripts/build424_twenty_item_nonexecuting_gate.py
```

Do not use `set -e`; keep the terminal open if a gate blocks so the evidence can be copied back for review.

## Expected live evidence

The exact reservation numbers are deliberately not predicted in advance. They depend on the live sequence/history boundary.

Expected shape:

```text
=== BUILD 424 PRODUCT NUMBER RESERVATION ===
Development Products: 45
Production Products: 45
Shared Product IDs: 45
Identity mismatches: 0
Development missing product_number: 45
Production missing product_number: 45
Invalid historical numeric rows: 0
Historical maximum Product number: <live value>
Development sequence next: <live value>
Production sequence next: <live value>
Candidate reservation block: <start>..<end>
Candidate next Product number: <end+1>
Non-executing preview safe to prepare: YES
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
BUILD 424 PRODUCT NUMBER RESERVATION EVIDENCE: PASS
```

If the helper reports `BLOCKED`, preserve the complete output. Do not guess a number range manually.

## Expected preview result

```text
BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: PASS
Mapped Products: 45
Candidate block: <same start>..<same end>
Candidate next number: <same end+1>
Executable statements generated: ZERO
No Cloudflare resource was contacted.
No database or R2 mutation was executed.
PRODUCTION PROMOTION: CLOSED
```

## Expected 20-item gate

```text
BUILD 424 TWENTY-ITEM LOCAL NON-EXECUTING RESERVATION GATE: PASS (20/20)
Candidate Product-number block: <start>..<end>
Candidate next Product number: <end+1>
Executable statements in preview: ZERO
No Cloudflare resource was contacted by this local gate.
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
```

## Safety

- reservation evidence: SELECT/inspection only;
- Development Product-number write: **none**;
- Production Product-number write: **none**;
- generated SQL preview: **all mutation lines commented**;
- executable helper: **none**;
- Production promotion: **closed**.
