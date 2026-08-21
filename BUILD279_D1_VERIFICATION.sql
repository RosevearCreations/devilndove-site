-- Build 279 — read-only production D1 verification
-- No Build 279 migration is required. These checks confirm that the earlier
-- analytics attribution compatibility columns and the Build 269 CAIP columns
-- already exist before the lightweight request paths are relied on.

SELECT
  'site_visitor_sessions' AS table_name,
  SUM(CASE WHEN name='utm_source' THEN 1 ELSE 0 END) AS utm_source,
  SUM(CASE WHEN name='utm_medium' THEN 1 ELSE 0 END) AS utm_medium,
  SUM(CASE WHEN name='utm_campaign' THEN 1 ELSE 0 END) AS utm_campaign,
  SUM(CASE WHEN name='utm_content' THEN 1 ELSE 0 END) AS utm_content,
  SUM(CASE WHEN name='utm_term' THEN 1 ELSE 0 END) AS utm_term
FROM pragma_table_info('site_visitor_sessions');

SELECT
  'site_page_views' AS table_name,
  SUM(CASE WHEN name='utm_source' THEN 1 ELSE 0 END) AS utm_source,
  SUM(CASE WHEN name='utm_medium' THEN 1 ELSE 0 END) AS utm_medium,
  SUM(CASE WHEN name='utm_campaign' THEN 1 ELSE 0 END) AS utm_campaign,
  SUM(CASE WHEN name='utm_content' THEN 1 ELSE 0 END) AS utm_content,
  SUM(CASE WHEN name='utm_term' THEN 1 ELSE 0 END) AS utm_term
FROM pragma_table_info('site_page_views');

SELECT
  'caip_media_upload_files' AS table_name,
  SUM(CASE WHEN name='content_fingerprint' THEN 1 ELSE 0 END) AS content_fingerprint,
  SUM(CASE WHEN name='content_fingerprint_version' THEN 1 ELSE 0 END) AS content_fingerprint_version,
  SUM(CASE WHEN name='recovery_of_file_id' THEN 1 ELSE 0 END) AS recovery_of_file_id
FROM pragma_table_info('caip_media_upload_files');

SELECT
  name AS required_table
FROM sqlite_master
WHERE type='table'
  AND name IN (
    'site_visitors','site_visitor_sessions','site_page_views','site_search_events','cart_activity',
    'caip_media_upload_sessions','caip_media_upload_files','caip_media_upload_parts'
  )
ORDER BY name;

PRAGMA foreign_key_check;
