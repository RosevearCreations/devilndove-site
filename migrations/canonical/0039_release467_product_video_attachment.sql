-- Release 467 Build 389: Product video attachment is separate from image gallery; forward-only.
CREATE TABLE IF NOT EXISTS product_video_attachments (
 product_video_id INTEGER PRIMARY KEY AUTOINCREMENT,
 product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
 object_key TEXT NOT NULL UNIQUE,
 video_url TEXT NOT NULL,
 original_filename TEXT NOT NULL,
 mime_type TEXT NOT NULL CHECK(mime_type IN ('video/mp4','video/webm','video/quicktime')),
 file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes>0 AND file_size_bytes<=26214400),
 video_title TEXT NOT NULL DEFAULT '',
 caption TEXT NOT NULL DEFAULT '',
 alt_description TEXT NOT NULL DEFAULT '',
 publication_status TEXT NOT NULL DEFAULT 'internal_review'
  CHECK(publication_status IN ('internal_review','product_page_ok','blocked')),
 uploaded_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_video_attachments_product ON product_video_attachments(product_id,product_video_id DESC);
-- Existing media and products are never modified; video publishing stays operator gated.
PRAGMA foreign_key_check;
