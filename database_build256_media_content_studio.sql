-- Devil n Dove Build 256 — Media & Content Management Studio + Packaging Amazon material import support.
-- Apply after Build 255. This migration is idempotent.

CREATE TABLE IF NOT EXISTS managed_media_metadata (
  media_asset_id INTEGER PRIMARY KEY,
  display_name TEXT,
  alt_text TEXT,
  image_title TEXT,
  caption TEXT,
  description TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  search_keywords TEXT,
  media_type TEXT NOT NULL DEFAULT 'photo',
  decorative INTEGER NOT NULL DEFAULT 0 CHECK (decorative IN (0,1)),
  focal_x REAL,
  focal_y REAL,
  attribution TEXT,
  license_notes TEXT,
  consent_notes TEXT,
  captured_at TEXT,
  source_type TEXT,
  archived_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(media_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS media_content_slots (
  media_content_slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  slot_label TEXT NOT NULL,
  slot_type TEXT NOT NULL DEFAULT 'image' CHECK (slot_type IN ('image','background','text')),
  target_selector TEXT NOT NULL,
  target_attribute TEXT NOT NULL DEFAULT 'src',
  source_snapshot TEXT,
  source_alt_snapshot TEXT,
  is_required INTEGER NOT NULL DEFAULT 0 CHECK (is_required IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, slot_key),
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_content_slots_page ON media_content_slots(page_path,is_active,slot_type);
CREATE INDEX IF NOT EXISTS idx_media_content_slots_selector ON media_content_slots(page_path,target_selector);

CREATE TABLE IF NOT EXISTS media_content_assignments (
  media_content_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_content_slot_id INTEGER NOT NULL,
  media_asset_id INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_content_slot_id) REFERENCES media_content_slots(media_content_slot_id) ON DELETE CASCADE,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(media_asset_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_content_assignments_active_slot
  ON media_content_assignments(media_content_slot_id) WHERE active=1;
CREATE INDEX IF NOT EXISTS idx_media_content_assignments_media ON media_content_assignments(media_asset_id,active);

CREATE TABLE IF NOT EXISTS managed_content_blocks (
  managed_content_block_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_content_slot_id INTEGER NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'text',
  draft_text TEXT,
  published_text TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0,1)),
  protected_static INTEGER NOT NULL DEFAULT 0 CHECK (protected_static IN (0,1)),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  FOREIGN KEY (media_content_slot_id) REFERENCES media_content_slots(media_content_slot_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_managed_content_blocks_page ON managed_content_blocks(page_path,published);

CREATE TABLE IF NOT EXISTS media_content_change_audit (
  media_content_change_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  media_asset_id INTEGER,
  media_content_slot_id INTEGER,
  page_path TEXT,
  actor_user_id INTEGER,
  old_value_json TEXT,
  new_value_json TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(media_asset_id) ON DELETE SET NULL,
  FOREIGN KEY (media_content_slot_id) REFERENCES media_content_slots(media_content_slot_id) ON DELETE SET NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_content_audit_target ON media_content_change_audit(page_path,media_content_slot_id,media_asset_id,created_at);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES('build256_media_content_studio','database_build256_media_content_studio.sql',NULL,'applied',0,CURRENT_TIMESTAMP,
'Adds managed media metadata, explicit page/image/text slots, safe assignments, published text overrides and audit history. Public page requests use bounded D1 manifests; R2 enumeration remains explicit admin-only.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,status='applied',destructive=0,applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
