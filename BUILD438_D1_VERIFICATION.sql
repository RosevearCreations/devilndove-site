-- Devil n Dove Build 438 read-only D1 verification.
-- Safe for Development or Production after the migration has been deliberately applied.

SELECT 'app_modules' AS object_name, type, sql
FROM sqlite_schema
WHERE name = 'app_modules';

SELECT 'app_module_role_access' AS object_name, type, sql
FROM sqlite_schema
WHERE name = 'app_module_role_access';

SELECT module_key, display_name, is_enabled, requires_login,
       default_route, load_priority, background_activity_enabled
FROM app_modules
ORDER BY load_priority, module_key;

SELECT module_key, role_code, is_allowed, access_level
FROM app_module_role_access
ORDER BY module_key, role_code;

SELECT name, tbl_name, sql
FROM sqlite_schema
WHERE type = 'index'
  AND name IN (
    'idx_app_modules_enabled_priority',
    'idx_app_module_role_access_role'
  )
ORDER BY name;

SELECT
  (SELECT COUNT(*) FROM app_modules) AS module_count,
  (SELECT COUNT(*) FROM app_module_role_access) AS role_access_count,
  (SELECT COUNT(*) FROM app_modules WHERE is_enabled = 1) AS enabled_module_count,
  (SELECT COUNT(*) FROM app_modules WHERE module_key IN ('commerce-operations','creative-production','business-administration')) AS expected_module_count;
