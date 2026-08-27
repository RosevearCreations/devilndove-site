-- Devil n Dove Build 443 — editable Home carousel authority.
-- Additive only. No slide is seeded, so the existing static Home hero remains the
-- public fallback until an administrator deliberately publishes an approved slide.

CREATE TABLE IF NOT EXISTS home_carousel_slides (
  slide_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body_text TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','paused','archived')),
  sort_order INTEGER NOT NULL DEFAULT 100 CHECK (sort_order BETWEEN 1 AND 999999),
  starts_at TEXT,
  ends_at TEXT,
  auto_advance_seconds INTEGER NOT NULL DEFAULT 7
    CHECK (auto_advance_seconds BETWEEN 5 AND 20),
  supersedes_slide_id INTEGER,
  created_by INTEGER,
  updated_by INTEGER,
  published_by INTEGER,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(title)) BETWEEN 1 AND 120),
  CHECK (length(COALESCE(body_text,'')) <= 320),
  CHECK (length(trim(image_url)) BETWEEN 1 AND 500),
  CHECK (length(trim(alt_text)) BETWEEN 1 AND 220),
  CHECK (length(COALESCE(cta_label,'')) <= 80),
  CHECK (length(COALESCE(cta_url,'')) <= 500),
  CHECK ((COALESCE(trim(cta_label),'') = '' AND COALESCE(trim(cta_url),'') = '') OR
         (COALESCE(trim(cta_label),'') <> '' AND COALESCE(trim(cta_url),'') <> '')),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR datetime(ends_at) > datetime(starts_at)),
  CHECK (supersedes_slide_id IS NULL OR supersedes_slide_id <> slide_id),
  FOREIGN KEY (supersedes_slide_id) REFERENCES home_carousel_slides(slide_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (published_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_home_carousel_public
  ON home_carousel_slides(status, sort_order, starts_at, ends_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_home_carousel_one_open_replacement
  ON home_carousel_slides(supersedes_slide_id)
  WHERE supersedes_slide_id IS NOT NULL AND status IN ('draft','paused');

CREATE TABLE IF NOT EXISTS home_carousel_events (
  carousel_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id INTEGER NOT NULL,
  action_type TEXT NOT NULL
    CHECK (action_type IN ('created','saved','published','paused','archived','reordered')),
  actor_user_id INTEGER,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slide_id) REFERENCES home_carousel_slides(slide_id) ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_home_carousel_events_slide
  ON home_carousel_events(slide_id, created_at DESC, carousel_event_id DESC);
