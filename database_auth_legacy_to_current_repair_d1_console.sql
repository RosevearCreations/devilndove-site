-- RETIRED SAFETY STUB — production auth migration already completed
--
-- Current production authority: `users` + `sessions`.
-- Production intentionally retains `members_legacy` + `member_sessions_legacy`
-- because historical `blog_posts.author_member_id` and `blog_comments.member_id`
-- still reference `members_legacy`. Do NOT rerun the old rename/backfill migration,
-- do NOT recreate `members`/`member_sessions`, and do NOT drop the legacy tables
-- until blog ownership is migrated with an explicit data-preserving migration.
--
-- This filename is retained only so older documentation/bookmarks cannot trigger
-- a destructive or duplicate auth migration. Use database_auth_runtime_diagnostics.sql
-- for evidence-only checks.

SELECT
  'RETIRED_AUTH_MIGRATION_ALREADY_APPLIED' AS code,
  'users/sessions are current. Legacy member tables remain for blog FK compatibility; no schema mutation was performed by this file.' AS message;
