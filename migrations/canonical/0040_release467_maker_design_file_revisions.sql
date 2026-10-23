-- Build 444: private maker-design originals, immutable revision lineage and explicit output traceability.
-- No existing Product, media, Creative Project or Inventory rows are modified.
CREATE TABLE IF NOT EXISTS maker_design_file_revisions (
 maker_design_file_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 design_key TEXT NOT NULL CHECK(length(design_key) BETWEEN 2 AND 80),
 revision_no INTEGER NOT NULL CHECK(revision_no > 0),
 parent_revision_id INTEGER REFERENCES maker_design_file_revisions(maker_design_file_revision_id) ON DELETE RESTRICT,
 design_title TEXT NOT NULL CHECK(length(design_title) BETWEEN 2 AND 180),
 original_filename TEXT NOT NULL,
 file_extension TEXT NOT NULL CHECK(file_extension IN ('stl','3mf','svg','dxf','gcode','nc','step','stp','obj','pdf','png','jpg','jpeg','webp','zip')),
 object_key TEXT NOT NULL UNIQUE,
 sha256_hex TEXT NOT NULL CHECK(length(sha256_hex)=64),
 file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes BETWEEN 1 AND 12582912),
 source_license TEXT NOT NULL CHECK(source_license IN ('own_work','licensed','third_party_reference','unknown')),
 source_note TEXT NOT NULL DEFAULT '',
 machine_readiness TEXT NOT NULL DEFAULT 'unreviewed' CHECK(machine_readiness IN ('unreviewed','needs_changes','ready')),
 revision_note TEXT NOT NULL DEFAULT '',
 created_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 request_key TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_work_project_id,design_key,revision_no),
 UNIQUE(created_by_user_id,request_key)
);
CREATE INDEX IF NOT EXISTS idx_maker_design_revision_project ON maker_design_file_revisions(creative_work_project_id,design_key,revision_no DESC);
CREATE TRIGGER IF NOT EXISTS maker_design_revision_parent_guard BEFORE INSERT ON maker_design_file_revisions BEGIN
 SELECT CASE WHEN COALESCE(NEW.parent_revision_id,0)<>COALESCE((
   SELECT maker_design_file_revision_id FROM maker_design_file_revisions
   WHERE creative_work_project_id=NEW.creative_work_project_id AND design_key=NEW.design_key ORDER BY revision_no DESC LIMIT 1),0)
 THEN RAISE(ABORT,'Parent must be the latest exact design revision') END;
 SELECT CASE WHEN NEW.revision_no<>1+COALESCE((SELECT MAX(revision_no) FROM maker_design_file_revisions
   WHERE creative_work_project_id=NEW.creative_work_project_id AND design_key=NEW.design_key),0)
 THEN RAISE(ABORT,'Revision number must advance by one') END;
END;

CREATE TABLE IF NOT EXISTS maker_design_revision_reviews (
 maker_design_revision_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_design_file_revision_id INTEGER NOT NULL REFERENCES maker_design_file_revisions(maker_design_file_revision_id) ON DELETE RESTRICT,
 review_status TEXT NOT NULL CHECK(review_status IN ('approved','needs_changes','rejected')),
 review_note TEXT NOT NULL CHECK(length(review_note) BETWEEN 12 AND 1200),
 reviewed_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_design_reviews_revision ON maker_design_revision_reviews(maker_design_file_revision_id,maker_design_revision_review_id DESC);

CREATE TABLE IF NOT EXISTS maker_design_output_links (
 maker_design_output_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 creative_work_output_id INTEGER NOT NULL REFERENCES creative_work_outputs(creative_work_output_id) ON DELETE RESTRICT,
 maker_design_file_revision_id INTEGER NOT NULL REFERENCES maker_design_file_revisions(maker_design_file_revision_id) ON DELETE RESTRICT,
 link_note TEXT NOT NULL CHECK(length(link_note) BETWEEN 12 AND 1200),
 linked_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_design_output_links_output ON maker_design_output_links(creative_work_output_id,maker_design_output_link_id DESC);
CREATE TRIGGER IF NOT EXISTS maker_design_output_guard BEFORE INSERT ON maker_design_output_links BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM creative_work_outputs o WHERE o.creative_work_output_id=NEW.creative_work_output_id AND o.creative_work_project_id=NEW.creative_work_project_id)
 THEN RAISE(ABORT,'Output project identity mismatch') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM maker_design_file_revisions r WHERE r.maker_design_file_revision_id=NEW.maker_design_file_revision_id AND r.creative_work_project_id=NEW.creative_work_project_id)
 THEN RAISE(ABORT,'Revision project identity mismatch') END;
 SELECT CASE WHEN COALESCE((SELECT v.review_status FROM maker_design_revision_reviews v WHERE v.maker_design_file_revision_id=NEW.maker_design_file_revision_id ORDER BY v.maker_design_revision_review_id DESC LIMIT 1),'pending')<>'approved'
 THEN RAISE(ABORT,'Only a currently approved design revision may be linked') END;
END;

-- Private originals and factual lineage are append-only. Status changes are new review rows;
-- changed output assignments are new link rows (older links remain traceable).
CREATE TRIGGER IF NOT EXISTS maker_design_revision_no_update BEFORE UPDATE ON maker_design_file_revisions BEGIN SELECT RAISE(ABORT,'Design originals and revisions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS maker_design_revision_no_delete BEFORE DELETE ON maker_design_file_revisions BEGIN SELECT RAISE(ABORT,'Design originals and revisions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS maker_design_review_no_update BEFORE UPDATE ON maker_design_revision_reviews BEGIN SELECT RAISE(ABORT,'Design reviews are append-only'); END;
CREATE TRIGGER IF NOT EXISTS maker_design_review_no_delete BEFORE DELETE ON maker_design_revision_reviews BEGIN SELECT RAISE(ABORT,'Design reviews are append-only'); END;
CREATE TRIGGER IF NOT EXISTS maker_design_link_no_update BEFORE UPDATE ON maker_design_output_links BEGIN SELECT RAISE(ABORT,'Output links are append-only'); END;
CREATE TRIGGER IF NOT EXISTS maker_design_link_no_delete BEFORE DELETE ON maker_design_output_links BEGIN SELECT RAISE(ABORT,'Output links are append-only'); END;
PRAGMA foreign_key_check;
