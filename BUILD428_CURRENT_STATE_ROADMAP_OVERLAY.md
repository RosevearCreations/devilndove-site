# Build 428 — Current Parity Roadmap Overlay

This is the active parity-release roadmap overlay until the two canonical project documents are refreshed after Production parity closes.

## Completed

- Fresh-install schema reconstruction/parity investigation through Builds 417–426.
- Development Product-number backfill: `1084..1128`, sequence `1129`.
- Production Product-number backup, guarded backfill and post-proof: `1084..1128`, sequence `1129`.
- Exact Dev/Prod Product identity parity preserved.

## Current Build 428 checkpoint

Run only source/local/read-only remaining-parity validation:

1. Build 428 local 20-check safety regression.
2. Fresh read-only remaining-family evidence.
3. Inert Membership Build 395 rebuild preview.
4. Build 428 local 20-check authorization-boundary gate.

No remaining Production mutation is authorized by this checkpoint.

## Remaining execution order

1. Gift Card Build 384 additive family — separate authorization, backup, targeted apply, row-preservation proof.
2. Notification Build 403 additive family — separate authorization, backup, targeted apply, row-preservation proof.
3. Product-image annotation Build 197 index — separate authorization, backup, targeted apply, row-preservation proof.
4. Fresh semantic snapshot before rebuild work.
5. Membership Build 395 — separate backed-up three-row data-preserving rebuild.
6. Fractional Inventory/Creative Project rebuilds — bounded groups, exact REAL values and Inventory row preservation.
7. Product/FK rebuilds — only while immediate orphan scans remain zero.
8. Accounting/default/nullability families — only with fresh compatibility evidence and family-specific rollback boundaries.
9. Full semantic parity rerun.
10. Development/Production browser/read-contract smoke and provider fail-closed checks.
11. Merge final parity state into `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
12. Open Production promotion only if every final gate is green.

## Explicit non-goals for parity release

- Do not copy Production business data broadly into Development.
- Do not copy CAIP D1 metadata without its matching private R2 objects.
- Do not delete `search_query_terms` rows just to equalize table counts.
- Do not drop `__sql_test` merely because Development lacks it.
- Do not combine rebuild families into one opaque all-or-nothing migration.
- Do not treat Cloudflare `7403` as schema evidence.

## Current safety state

```text
Product-number parity             COMPLETE
Remaining additive authorization PENDING PER FAMILY
Rebuild authorization             PENDING
Production promotion              CLOSED
```
