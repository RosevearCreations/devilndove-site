-- Devil n Dove Release 461 — Development-only member runtime schema authority.
-- Authenticated customer traffic must never create or alter schema. No historical replay.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_wishlists (
  member_wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_member_wishlists_user_created ON member_wishlists(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS product_reviews (
  product_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  order_id INTEGER,
  user_id INTEGER,
  reviewer_name TEXT,
  reviewer_email TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  review_text TEXT,
  review_kind TEXT NOT NULL DEFAULT 'testimonial',
  status TEXT NOT NULL DEFAULT 'pending_review',
  is_featured INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_member ON product_reviews(user_id, reviewer_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_public ON product_reviews(status, product_id, is_featured, created_at DESC);

SELECT COUNT(*) AS release461_member_wishlist_columns FROM pragma_table_info('member_wishlists') WHERE name IN ('member_wishlist_id','user_id','product_id','created_at');
SELECT COUNT(*) AS release461_product_review_columns FROM pragma_table_info('product_reviews') WHERE name IN ('product_review_id','product_id','order_id','user_id','reviewer_name','reviewer_email','rating','review_text','review_kind','status','is_featured','admin_notes','created_at','updated_at');
SELECT COUNT(*) AS release461_member_indexes FROM sqlite_master WHERE type='index' AND name IN ('idx_member_wishlists_user_created','idx_product_reviews_member','idx_product_reviews_public');
PRAGMA foreign_key_check;
