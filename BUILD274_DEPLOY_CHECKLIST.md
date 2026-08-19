# Build 274 Deployment Checklist

1. Back up the production D1 database before changing schema.
2. Confirm Build 269 CAIP migration is already present if this production database uses the current CAIP upload workflow.
3. Apply **once**: `database_build274_creative_process_lifecycle_corrections.sql`.
4. Run `BUILD274_D1_VERIFICATION.sql`; confirm the four columns, index, migration-ledger row and `PRAGMA foreign_key_check` are clean.
5. Deploy Build 274 code/assets and hard-refresh `/admin/creative-process/?project_id=7` and `/admin/`.
6. Project 7 concept test: add a planned material timeline entry and verify Inventory on-hand does not change.
7. Goat's Milk repair: find the mistaken posted entry; use **Remove / undo entire entry**, enter a clear reason, and confirm stock is restored once and the event appears only in **Voided / corrected history**.
8. Correction test (small disposable fixture preferred): post a small actual usage, use **Correct actual usage**, and confirm the original post is reversed while the corrected event becomes active.
9. Content-only test: open the hair-dye project, record actual inventory only for supplies physically used, upload/review media in the same CAIP workspace, and create/refresh one Content Studio package without making a fake Product.
10. Admin Dashboard: use **Release & Go-Live Center** as the primary release path; confirm individual stages remain available under **Advanced release tools**.

Do not rerun the Build 274 migration after it has succeeded. Do not hard-delete inventory-post history to repair a project quantity.
