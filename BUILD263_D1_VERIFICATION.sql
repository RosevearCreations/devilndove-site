-- Build 263 read-only verification
SELECT name FROM sqlite_master WHERE type='table' AND name='packaging_printer_profiles';
SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_packaging_printer_profiles_active_default','ux_packaging_printer_profiles_one_default') ORDER BY name;
SELECT migration_key,file_name,status,destructive,applied_at FROM schema_migration_ledger WHERE migration_key='build263_packaging_my_printers';
SELECT packaging_printer_profile_id,profile_name,paper_stock,margin_mm,gap_mm,scale_percent,auto_rotate,is_default_label,is_active FROM packaging_printer_profiles ORDER BY is_default_label DESC,profile_name;
SELECT COUNT(*) AS active_default_label_printers FROM packaging_printer_profiles WHERE is_active=1 AND is_default_label=1;
