-- Devil n Dove Build 438 strict single-query D1 verification.
-- Read-only. Intended for machine parsing through Wrangler --file ... --json.

SELECT
  (SELECT COUNT(*) FROM app_modules) AS module_count,
  (SELECT COUNT(*) FROM app_module_role_access) AS role_access_count,
  (SELECT COUNT(*) FROM app_modules WHERE is_enabled = 1) AS enabled_module_count,
  (SELECT COUNT(*) FROM app_modules WHERE background_activity_enabled = 1) AS background_enabled_count,
  (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'index' AND name IN ('idx_app_modules_enabled_priority','idx_app_module_role_access_role')) AS expected_index_count,
  (SELECT group_concat(module_key, char(124)) FROM (SELECT module_key FROM app_modules ORDER BY module_key)) AS module_keys;
