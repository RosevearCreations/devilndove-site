-- Build 263 - My Printers-only packaging print profiles and default label printer.
-- Additive and idempotent. Apply after the current Build 259 media-slot migration boundary.

CREATE TABLE IF NOT EXISTS packaging_printer_profiles (
  packaging_printer_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_name TEXT NOT NULL UNIQUE,
  paper_stock TEXT NOT NULL DEFAULT 'Letter 8.5 × 11 in',
  margin_mm REAL NOT NULL DEFAULT 0,
  gap_mm REAL NOT NULL DEFAULT 0,
  scale_percent REAL NOT NULL DEFAULT 100,
  auto_rotate INTEGER NOT NULL DEFAULT 1 CHECK(auto_rotate IN (0,1)),
  settings_note TEXT,
  is_default_label INTEGER NOT NULL DEFAULT 0 CHECK(is_default_label IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_printer_profiles_active_default ON packaging_printer_profiles(is_active,is_default_label,profile_name);
CREATE UNIQUE INDEX IF NOT EXISTS ux_packaging_printer_profiles_one_default ON packaging_printer_profiles(is_default_label) WHERE is_active=1 AND is_default_label=1;

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES('build263_packaging_my_printers','database_build263_packaging_my_printers_label_alignment.sql',NULL,'applied',0,CURRENT_TIMESTAMP,
'Adds persistent My Printers profiles for Packaging Studio. Printer dropdowns no longer scan Inventory or print history; one active printer can be the default label printer. Also accompanies Build 263 front-oval text/rose alignment changes.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,status='applied',destructive=0,applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
