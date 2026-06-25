# Database Schema Reference — Build 196

Build 196 adds `product_material_return_audit`. Apply `database_build196_product_correction_material_returns.sql` after Build 195.

- `catalog_product_number_sequence` keeps internal product System # values permanent and non-reusable.
- `product_deletion_audit` records factual deleted-product information.
- `product_material_return_audit` records every reviewed reservation release or raw-supply on-hand return chosen during an unused-product correction/delete.
- `site_inventory_item_descriptions` remains for legacy data compatibility but is no longer displayed below raw inventory/tool images or overwritten by normal edits.

Use `database_full_schema.sql` for a fresh database. Use the numbered build migration files in order for an existing deployed database.
