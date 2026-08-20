# Build 277 Deployment Checklist

Build 277 is a **code-only Packaging Studio release**. Do not run a new D1 migration.

1. Confirm the production database already has the Build 276 Packaging migration if Build 276 features are in use:
   - `database_build276_packaging_inventory_inci_capacity.sql`
2. Deploy the Build 277 application package.
3. Hard-refresh `/admin/packaging-studio/` so `styles.css?v=277` and `admin-packaging-studio.js?v=277` load.
4. Open an existing soap label.
5. Confirm the preview shows:
   - French `INGRÉDIENTS` in its dedicated panel;
   - English `INGREDIENTS` in its dedicated panel;
   - no `CONTINUED / SUITE` one-list layout.
6. If French structured ingredient values are missing, use the French draft helper, review/correct them, then save. Generated French remains a draft until reviewed.
7. Confirm claim icons do not touch each other or the claim copy. Build 277 widens both icon-to-text clearance and stacked row spacing.
8. Run a 100% physical print proof before approving production output.
9. If either complete English or French ingredient list cannot fit legibly, use an extended/peel-back/other reviewed extended presentation; do not shrink/clamp away ingredients.

No Inventory quantity or stock behavior changes in Build 277. Packaging Studio's Build 276 Inventory links remain reference/traceability only.
