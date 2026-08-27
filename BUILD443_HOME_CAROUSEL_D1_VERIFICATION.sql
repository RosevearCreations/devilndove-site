SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('home_carousel_slides','home_carousel_events')
ORDER BY name;

SELECT COUNT(*) AS invalid_slide_count
FROM home_carousel_slides
WHERE status NOT IN ('draft','published','paused','archived')
   OR sort_order < 1
   OR sort_order > 999999
   OR auto_advance_seconds < 5
   OR auto_advance_seconds > 20
   OR trim(title) = ''
   OR trim(image_url) = ''
   OR trim(alt_text) = ''
   OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND datetime(ends_at) <= datetime(starts_at));

PRAGMA foreign_key_check;
