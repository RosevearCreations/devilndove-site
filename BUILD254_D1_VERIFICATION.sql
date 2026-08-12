-- Build 254 read-only D1 verification. Do not modify data.
SELECT migration_key,file_name,status,applied_at FROM schema_migration_ledger WHERE migration_key='build254_startup_smoke_runtime_hardening';
SELECT setting_key,setting_value FROM app_settings WHERE setting_key='site.startup_readiness.runtime_contract';
SELECT COUNT(*) AS active_startup_gate_count FROM startup_readiness_items WHERE is_active=1;
SELECT item_key,item_status,updated_at FROM startup_readiness_items WHERE item_key IN ('deployment_preflight_standalone','backup_migrate_deploy','post_deploy_smoke_standalone') ORDER BY sort_order;
SELECT name,type FROM sqlite_master WHERE name IN ('post_deploy_smoke_test_results','idx_post_deploy_smoke_results_recent','idx_startup_readiness_active_key','idx_startup_readiness_history_recent') ORDER BY type,name;
SELECT COUNT(*) AS stored_smoke_result_count FROM post_deploy_smoke_test_results;
