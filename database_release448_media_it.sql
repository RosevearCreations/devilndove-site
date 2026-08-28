-- Devil n Dove Release 448 — media quality, Movie verification, and I.T. integration registry.
-- Development-first additive migration. No image binaries, secret values, provider calls, or Production targets are stored here.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_image_quality_assessments (
  product_image_quality_assessment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  scorer_kind TEXT NOT NULL DEFAULT 'browser_deterministic' CHECK (scorer_kind IN ('browser_deterministic','vision_assisted','manual')),
  scorer_version TEXT NOT NULL DEFAULT 'r448-browser-v1',
  total_score REAL NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  lighting_score REAL NOT NULL CHECK (lighting_score BETWEEN 0 AND 20),
  clarity_score REAL NOT NULL CHECK (clarity_score BETWEEN 0 AND 20),
  background_score REAL NOT NULL CHECK (background_score BETWEEN 0 AND 15),
  framing_score REAL NOT NULL CHECK (framing_score BETWEEN 0 AND 15),
  resolution_score REAL NOT NULL CHECK (resolution_score BETWEEN 0 AND 10),
  color_balance_score REAL NOT NULL CHECK (color_balance_score BETWEEN 0 AND 10),
  artifact_score REAL NOT NULL CHECK (artifact_score BETWEEN 0 AND 5),
  consistency_score REAL NOT NULL CHECK (consistency_score BETWEEN 0 AND 5),
  width_px INTEGER,
  height_px INTEGER,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'machine_scored' CHECK (status IN ('unverified','machine_scored','reviewed','approved','rejected')),
  review_notes TEXT,
  scored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(product_id,image_key,scorer_kind,scorer_version)
);
CREATE INDEX IF NOT EXISTS idx_product_image_quality_product ON product_image_quality_assessments(product_id,total_score DESC,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_image_quality_status ON product_image_quality_assessments(status,total_score,updated_at DESC);

CREATE TABLE IF NOT EXISTS movie_metadata_reviews (
  movie_id INTEGER PRIMARY KEY,
  name_review_status TEXT NOT NULL DEFAULT 'pending' CHECK (name_review_status IN ('pending','unverified','verified')),
  core_metadata_status TEXT NOT NULL DEFAULT 'pending' CHECK (core_metadata_status IN ('pending','incomplete','unverified','verified')),
  evidence_reference TEXT,
  review_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_movie_metadata_reviews_state ON movie_metadata_reviews(core_metadata_status,name_review_status,updated_at DESC);
INSERT OR IGNORE INTO movie_metadata_reviews(movie_id,name_review_status,core_metadata_status,review_notes)
SELECT id,'pending','pending','Release 448 compatibility review: existing Movie metadata remains pending until checked; no title/year data was guessed.' FROM movies;

CREATE TABLE IF NOT EXISTS it_integration_registry (
  it_integration_registry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL UNIQUE,
  platform_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  consuming_module TEXT NOT NULL CHECK (consuming_module IN ('storefront','creators','socials','financials','it-platform')),
  credential_reference TEXT,
  callback_url TEXT,
  webhook_url TEXT,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  environment TEXT NOT NULL DEFAULT 'development',
  configured_status TEXT NOT NULL DEFAULT 'pending' CHECK (configured_status IN ('pending','not_configured','configured','disabled')),
  tested_status TEXT NOT NULL DEFAULT 'unverified' CHECK (tested_status IN ('unverified','pending','passed','failed','deferred')),
  last_tested_at TEXT,
  last_safe_error TEXT,
  correction_mechanics TEXT,
  evidence_reference TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (credential_reference IS NULL OR (instr(lower(credential_reference),'secret=')=0 AND instr(lower(credential_reference),'token=')=0 AND length(credential_reference)<=200))
);
CREATE INDEX IF NOT EXISTS idx_it_integration_registry_state ON it_integration_registry(consuming_module,environment,configured_status,tested_status,is_active);

SELECT name FROM sqlite_master WHERE type='table' AND name IN ('product_image_quality_assessments','movie_metadata_reviews','it_integration_registry') ORDER BY name;
PRAGMA foreign_key_check;
