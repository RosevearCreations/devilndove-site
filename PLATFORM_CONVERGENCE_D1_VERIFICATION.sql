-- Release 447 Development D1 verification. Read-only.
PRAGMA foreign_keys = ON;

SELECT 'canonical_modules' AS check_name, COUNT(*) AS actual, 5 AS expected
FROM app_modules
WHERE module_key IN ('storefront','creators','socials','financials','it-platform');

SELECT 'legacy_modules_retired' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM app_modules
WHERE module_key IN ('commerce-operations','creative-production','business-administration');

SELECT 'canonical_role_rows' AS check_name, COUNT(*) AS actual, 10 AS expected
FROM app_module_role_access
WHERE module_key IN ('storefront','creators','socials','financials','it-platform')
  AND role_code IN ('member','admin');

SELECT 'it_role_grants' AS check_name, COUNT(*) AS actual, 0 AS expected
FROM app_module_role_access
WHERE module_key='it-platform' AND is_allowed<>0;

SELECT 'it_explicit_managers' AS check_name, COUNT(*) AS actual
FROM app_module_user_access
WHERE module_key='it-platform' AND is_allowed=1 AND access_level='manage';

SELECT 'required_tables' AS check_name, COUNT(*) AS actual, 5 AS expected
FROM sqlite_master
WHERE type='table'
  AND name IN ('app_modules','app_module_role_access','app_module_user_access','home_carousel_slides','home_carousel_events');

SELECT module_key,display_name,is_enabled,requires_login,default_route,load_priority,background_activity_enabled
FROM app_modules
ORDER BY load_priority,module_key;

SELECT module_key,role_code,is_allowed,access_level
FROM app_module_role_access
ORDER BY module_key,role_code;

PRAGMA foreign_key_check;
