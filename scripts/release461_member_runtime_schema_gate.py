from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
ROUTES=[ROOT/'functions/api/member/wishlist.js',ROOT/'functions/api/member/reviews.js']
HELPER=ROOT/'functions/api/_lib/memberRuntimeSchemaReadiness.js'
MIGRATION=ROOT/'migrations/dev/20260829_release461_member_runtime_schema_authority.sql'
DDL=re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b',re.I)
for path in ROUTES:
    body=path.read_text(encoding='utf-8'); assert not DDL.search(body),f'request-time DDL remains in {path}'
    assert 'memberRuntimeSchemaReadiness.js' in body
helper=HELPER.read_text(encoding='utf-8'); assert not DDL.search(helper)
for token in ('PRAGMA table_info(${tableName})','hasMemberWishlistSchema','hasProductReviewSchema','member_wishlists','product_reviews'): assert token in helper
wishlist=ROUTES[0].read_text(encoding='utf-8'); reviews=ROUTES[1].read_text(encoding='utf-8')
assert 'member_wishlist_schema_unavailable' in wishlist
assert 'product_review_schema_unavailable' in reviews
migration=MIGRATION.read_text(encoding='utf-8'); assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b',migration,re.I)
for token in ('CREATE TABLE IF NOT EXISTS member_wishlists','CREATE TABLE IF NOT EXISTS product_reviews','idx_member_wishlists_user_created','idx_product_reviews_member','idx_product_reviews_public','PRAGMA foreign_key_check'): assert token in migration
print('RELEASE 461 MEMBER RUNTIME SCHEMA SOURCE GATE: PASS')
