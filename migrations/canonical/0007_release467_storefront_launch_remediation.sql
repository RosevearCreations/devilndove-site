-- Release 467 Build 206 — Launch-Set Remediation Campaign
-- Forward-only additive campaign metadata. Product/buyer-readiness facts remain owned
-- by their existing authorities; this table stores only explicit admin remediation review.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS storefront_launch_remediation_items (
  storefront_launch_remediation_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  blocker_code TEXT NOT NULL,
  blocker_area TEXT NOT NULL,
  blocker_label TEXT,
  owner TEXT NOT NULL,
  remediation_status TEXT NOT NULL DEFAULT 'open'
    CHECK (remediation_status IN ('open','in_progress','blocked','resolved')),
  due_note TEXT,
  notes TEXT,
  baseline_evidence_token TEXT,
  last_recheck_evidence_token TEXT,
  last_recheck_result TEXT NOT NULL DEFAULT 'not_checked'
    CHECK (last_recheck_result IN ('not_checked','open','cleared','stale')),
  completion_evidence TEXT,
  last_rechecked_at TEXT,
  resolved_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, blocker_code),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_storefront_launch_remediation_status
  ON storefront_launch_remediation_items(remediation_status, blocker_area, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_storefront_launch_remediation_product
  ON storefront_launch_remediation_items(product_id, blocker_code);
