-- Build 442 I.T. & Platform Development D1 verification.
-- Read-only. Exact rows are intentionally visible for operator evidence.

SELECT module_key, display_name, is_enabled, requires_login, default_route,
       load_priority, background_activity_enabled
FROM app_modules
WHERE module_key = 'it-platform';

SELECT module_key, role_code, is_allowed, access_level
FROM app_module_role_access
WHERE module_key = 'it-platform'
ORDER BY role_code;

SELECT COUNT(*) AS active_admin_count
FROM users
WHERE is_active = 1 AND LOWER(TRIM(role)) = 'admin';

SELECT COUNT(*) AS active_it_manager_count
FROM app_module_user_access aua
INNER JOIN users u ON u.user_id = aua.user_id
WHERE aua.module_key = 'it-platform'
  AND aua.is_allowed = 1
  AND aua.access_level = 'manage'
  AND u.is_active = 1;

SELECT aua.module_key, aua.user_id, u.email, u.role, aua.is_allowed,
       aua.access_level, aua.granted_by_user_id, aua.created_at, aua.updated_at
FROM app_module_user_access aua
INNER JOIN users u ON u.user_id = aua.user_id
WHERE aua.module_key = 'it-platform'
ORDER BY aua.user_id;

PRAGMA foreign_key_check;
