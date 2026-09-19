# Release 467 Build 194 — D1 Evidence Headroom Optimization + Home Media Reliability

## Goal

Recover safe D1 headroom in the two tightest retained evidence paths **and** close the owner-reported Home-page image assignment failure without weakening evidence, raising any existing ceiling, or creating a second presentation authority.

## Accepted predecessor

- Release 467 Build 193 is merged to protected `main` at `649650b317bc2ad8ad6fbc0b42b0965d9653f9a7`.
- Build 194 starts from that exact Production tree.
- Development remains the only environment allowed to run this build's provider-metered D1 proof.
- Production promotion is code-only and must not execute remote Production D1 queries.

## Measured starting point

### Media evidence — retained Build 190 proof

- **19,282 / 20,000 rows read**
- Headroom: **718 rows**
- 43 active Products
- 238 gallery images
- 1,040 active Inventory items
- 2 blank Inventory images
- 141 external Inventory image references

### Inventory evidence — retained Build 189 proof

- **15,487 / 20,000 rows read**
- Headroom: **4,513 rows**
- 1,040 active Inventory items
- 8 duplicate-identity rows
- 898 missing supplier names
- 326 missing source references
- 1,040 count-due rows
- 143 catalog references not matched

## D1 optimization scope

Build 194 preserves the exact Build 189 and Build 190 classifications while removing avoidable repeated scans. It uses one active-Inventory window plus one normalized Catalog rollup for Inventory evidence, and single aggregate passes over Product-image and Inventory-media facts for media evidence. One-record rechecks remain selected-record-only; media rechecks retain at most one selected-object R2 HEAD and never list the bucket.

The historical **20,000 rows-read hard ceilings remain unchanged**. Build 194 targets Inventory evidence **<= 10,000 rows read** and media evidence **<= 12,500 rows read** and never raises a ceiling merely to pass.

## Home Media Studio repair

Owner acceptance reported that changing front-page images could appear to do nothing: no visible confirmation/error and no visible Home update.

Build 194 requires:

1. explicit JSON headers for Media Studio writes;
2. a live status region in the picker, not only at the top of the long Studio page;
3. visible in-progress state for existing-image assignment and upload-and-use;
4. a server re-read of the exact page slot after the assignment batch;
5. success only when the requested media ID is verified as the active assignment for the requested slot;
6. the verified assignment and refreshed slot state in the response;
7. versioned admin slot preview URLs so browser cache cannot mask the changed object;
8. a deterministic public `dd:media-content-ready` signal;
9. Home carousel precedence that yields whenever `home.hero.image` has a Media Studio override;
10. an admin fresh-preview query that bypasses a stale manifest cache without disabling bounded caching for ordinary visitors.

## Safety boundary

No schema migration, Product/Inventory business-data mutation, automatic duplicate merge, count write, supplier/source invention, R2 mutation, image reassignment outside an explicit owner action, purchasing, provider action, publication, payment, refund, or accounting posting.

The owner-requested explicit Media Studio assignment remains a normal admin D1 write. Build 194 itself performs no automatic page-image mutation.

## Acceptance

- JavaScript syntax GREEN for every modified runtime/admin/API file.
- Static regression tokens prove verified assignment, local feedback and Home hero authority.
- Retained Build 189, 190 and 193 gates remain GREEN.
- Exact Development provider-metered proofs are GREEN.
- Inventory provider rows_read **<= 10,000** and retained hard ceiling 20,000.
- Media provider rows_read **<= 12,500** and retained hard ceiling 20,000.
- Provider proof D1 mutation: zero.
- Provider proof R2 mutation/listing: zero.
- Protected-main Production promotion occurs only after Development is GREEN.
- Exact protected-main Production deployment/runtime proof is GREEN.
