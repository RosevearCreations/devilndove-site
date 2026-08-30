const MEMBER_WISHLIST_COLUMNS = [
  'member_wishlist_id','user_id','product_id','created_at'
];
const PRODUCT_REVIEW_COLUMNS = [
  'product_review_id','product_id','order_id','user_id','reviewer_name','reviewer_email','rating',
  'review_text','review_kind','status','is_featured','admin_notes','created_at','updated_at'
];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function tableHasColumns(db, tableName, required) {
  if (!db) return false;
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  const columns = new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  return required.every((name) => columns.has(name));
}

export async function hasMemberWishlistSchema(db) {
  return tableHasColumns(db, 'member_wishlists', MEMBER_WISHLIST_COLUMNS);
}

export async function hasProductReviewSchema(db) {
  return tableHasColumns(db, 'product_reviews', PRODUCT_REVIEW_COLUMNS);
}
