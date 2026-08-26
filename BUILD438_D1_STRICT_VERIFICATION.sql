-- Devil n Dove Build 438 strict single-query D1 verification.
-- Read-only. Success means the exact Development module authority is present.
-- A mismatch deliberately triggers SQLite integer overflow so Wrangler exits non-zero.

SELECT CASE WHEN
  (SELECT COUNT(*) FROM app_modules) = 3
  AND (SELECT COUNT(*) FROM app_module_role_access) = 6
  AND (SELECT COUNT(*) FROM app_modules WHERE is_enabled = 1) = 3
  AND (SELECT COUNT(*) FROM app_modules WHERE background_activity_enabled = 1) = 0
  AND (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'index' AND name IN ('idx_app_modules_enabled_priority','idx_app_module_role_access_role')) = 2
  AND (SELECT COUNT(*) FROM app_modules WHERE module_key IN ('business-administration','commerce-operations','creative-production')) = 3
  AND NOT EXISTS (
    SELECT 1
    FROM app_modules
    WHERE module_key NOT IN ('business-administration','commerce-operations','creative-production')
  )
  AND (SELECT COUNT(*) FROM app_module_role_access
       WHERE module_key IN ('business-administration','commerce-operations','creative-production')
         AND role_code IN ('admin','member')) = 6
THEN 1
ELSE abs(-9223372036854775808)
END AS verification_pass;
