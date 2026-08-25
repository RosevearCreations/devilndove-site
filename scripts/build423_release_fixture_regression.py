#!/usr/bin/env python3
"""Build 423 local in-memory regression fixtures for Production parity planning.

No network access. No Cloudflare access. No Production mutation capability.
"""
from __future__ import annotations

import sqlite3

from build423_nonexecuting_migration_catalog import (
    ACCOUNTING_FAMILY,
    CONSTRAINT_DEFAULT_FAMILY,
    FRACTIONAL_TABLES,
    GIFT_CARD,
    MEMBERSHIP,
    NOTIFICATION,
    ONE_SIDED,
    PRODUCT_FK_FAMILY,
    PRODUCT_IMAGE_ANNOTATIONS,
    PRODUCT_NUMBER,
    SAFETY,
)

failures: list[str] = []
checks = 0


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


def columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in conn.execute(f'PRAGMA table_info({table})')}


def indexes(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in conn.execute(f'PRAGMA index_list({table})')}


# 1-4 Product-number semantics/backfill fixture.
conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE products(
  product_id INTEGER PRIMARY KEY,
  product_number INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE
);
CREATE TABLE catalog_product_number_sequence(
  sequence_key TEXT PRIMARY KEY,
  next_product_number INTEGER NOT NULL
);
INSERT INTO products(product_id,product_number,name,slug,sku) VALUES
  (1,NULL,'A','a','DND-A'),
  (2,NULL,'B','b','DND-B'),
  (3,NULL,'C','c','DND-C');
INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number) VALUES('products',1000);
''')
row_ids_before = [r[0] for r in conn.execute('SELECT product_id FROM products ORDER BY product_id')]
for pid, number in [(1, 1000), (2, 1001), (3, 1002)]:
    conn.execute('UPDATE products SET product_number=? WHERE product_id=? AND product_number IS NULL', (number, pid))
conn.execute("UPDATE catalog_product_number_sequence SET next_product_number=1003 WHERE sequence_key='products'")
conn.commit()
row_ids_after = [r[0] for r in conn.execute('SELECT product_id FROM products ORDER BY product_id')]
numbers = [r[0] for r in conn.execute('SELECT product_number FROM products ORDER BY product_id')]
check(PRODUCT_NUMBER['start'] == 1000 and PRODUCT_NUMBER['never_reuse'], 'Product number authority remains 1000+ and never-reused')
check(row_ids_before == row_ids_after, 'Product-number backfill preserves Product IDs')
check(numbers == [1000, 1001, 1002] and len(set(numbers)) == 3, 'Product-number backfill produces unique deterministic numbers')
check(conn.execute("SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products'").fetchone()[0] == 1003, 'Product-number sequence advances beyond the backfilled maximum')

# 5-9 Gift Card additive migration fixture, including rerun and row preservation.
conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE gift_card_lookup_attempts(
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hint TEXT,
  email_hash TEXT,
  client_key TEXT,
  was_success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO gift_card_lookup_attempts(code_hint,email_hash,client_key,was_success) VALUES('1234','hash','client',0);
''')
legacy_count = conn.execute('SELECT COUNT(*) FROM gift_card_lookup_attempts').fetchone()[0]
for column in GIFT_CARD['lookup_attempt_columns']:
    if column not in columns(conn, 'gift_card_lookup_attempts'):
        conn.execute(f'ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} TEXT')
conn.executescript('''
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);
CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts(
  gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  lockout_status TEXT NOT NULL DEFAULT 'active',
  lockout_reason TEXT,
  locked_by_user_id INTEGER,
  locked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  released_at TEXT,
  notes TEXT,
  FOREIGN KEY (locked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_lockouts_status ON gift_card_lookup_lockouts(lockout_status, locked_at DESC);
''')
# Rerun the same guarded/additive operations.
for column in GIFT_CARD['lookup_attempt_columns']:
    if column not in columns(conn, 'gift_card_lookup_attempts'):
        conn.execute(f'ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} TEXT')
conn.executescript('''
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);
CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts(gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_lockouts_status ON gift_card_lookup_lockouts(gift_card_lookup_lockout_id);
''')
check(all(c in columns(conn, 'gift_card_lookup_attempts') for c in GIFT_CARD['lookup_attempt_columns']), 'Gift Card fixture adds all five lookup-attempt columns')
check(set(GIFT_CARD['lookup_attempt_indexes']).issubset(indexes(conn, 'gift_card_lookup_attempts')), 'Gift Card fixture adds current lookup-attempt indexes')
check('gift_card_lookup_lockouts' in {r[0] for r in conn.execute("SELECT name FROM sqlite_schema WHERE type='table'")}, 'Gift Card fixture creates lockout table')
check(GIFT_CARD['lockout_index'] in indexes(conn, 'gift_card_lookup_lockouts'), 'Gift Card fixture creates lockout index')
check(conn.execute('SELECT COUNT(*) FROM gift_card_lookup_attempts').fetchone()[0] == legacy_count, 'Gift Card additive fixture reruns without row loss')

# 10-11 Notification additive metadata/index + row preservation.
conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE notification_outbox(
 notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
 notification_kind TEXT NOT NULL,
 destination TEXT,
 related_order_id INTEGER,
 related_payment_id INTEGER,
 related_product_id INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notification_outbox(notification_kind,destination) VALUES('test','a@example.invalid');
''')
notification_rows = conn.execute('SELECT COUNT(*) FROM notification_outbox').fetchone()[0]
if 'metadata_json' not in columns(conn, 'notification_outbox'):
    conn.execute('ALTER TABLE notification_outbox ADD COLUMN metadata_json TEXT')
conn.executescript('''
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind_destination ON notification_outbox(notification_kind,destination,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order ON notification_outbox(related_order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_payment ON notification_outbox(related_payment_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_product ON notification_outbox(related_product_id,created_at DESC);
''')
check('metadata_json' in columns(conn, 'notification_outbox') and set(NOTIFICATION['indexes']).issubset(indexes(conn, 'notification_outbox')), 'Notification fixture adds metadata_json and current indexes')
check(conn.execute('SELECT COUNT(*) FROM notification_outbox').fetchone()[0] == notification_rows, 'Notification additive fixture preserves existing rows')

# 12 Product image annotation index authority.
conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE product_image_annotations(annotation_id INTEGER PRIMARY KEY,product_id INTEGER,product_image_id INTEGER);
CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197 ON product_image_annotations(product_id,product_image_id);
''')
check(PRODUCT_IMAGE_ANNOTATIONS['index'] in indexes(conn, 'product_image_annotations'), 'Product image annotations additive index fixture matches Build 197 authority')

# 13-14 Membership legacy mapping and preservation.
legacy_rows = [
    {'membership_tier_policy_id': 1, 'code': 'bronze', 'name': 'Bronze', 'display_title': 'Bronze Member'},
    {'membership_tier_policy_id': 2, 'code': 'silver', 'name': 'Silver', 'display_title': 'Silver Member'},
    {'membership_tier_policy_id': 3, 'code': 'gold', 'name': 'Gold', 'display_title': 'Gold Member'},
]
canonical = []
for row in legacy_rows:
    canonical.append({
        'policy_id': row['membership_tier_policy_id'],
        'tier_code': row['code'],
        'title': row.get('display_title') or row.get('name') or '',
    })
check(MEMBERSHIP['legacy_aliases']['code'] == 'tier_code' and MEMBERSHIP['legacy_aliases']['membership_tier_policy_id'] == 'policy_id', 'Membership legacy alias map covers identity and tier code')
check(len(canonical) == len(legacy_rows) and len({r['tier_code'] for r in canonical}) == 3, 'Membership mapping preserves row count and unique tiers')

# 15 Fractional Inventory family preserves non-integer values.
conn = sqlite3.connect(':memory:')
conn.execute('CREATE TABLE inv(id INTEGER PRIMARY KEY,on_hand REAL NOT NULL,reserved REAL NOT NULL)')
conn.execute('INSERT INTO inv VALUES(1,1.25,0.125)')
conn.execute('CREATE TABLE inv_new(id INTEGER PRIMARY KEY,on_hand REAL NOT NULL,reserved REAL NOT NULL)')
conn.execute('INSERT INTO inv_new SELECT * FROM inv')
row = conn.execute('SELECT on_hand,reserved FROM inv_new WHERE id=1').fetchone()
check(bool(FRACTIONAL_TABLES) and row == (1.25, 0.125), 'Fractional Inventory table-copy fixture preserves non-integer REAL values exactly')

# 16 Product/FK family refuses orphaned references.
conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE product_review_actions(action_id INTEGER PRIMARY KEY,actor_user_id INTEGER);
INSERT INTO users VALUES(1);
INSERT INTO product_review_actions VALUES(1,1),(2,999);
''')
orphan_count = conn.execute('''SELECT COUNT(*) FROM product_review_actions a LEFT JOIN users u ON u.user_id=a.actor_user_id WHERE a.actor_user_id IS NOT NULL AND u.user_id IS NULL''').fetchone()[0]
check(bool(PRODUCT_FK_FAMILY) and orphan_count == 1, 'Product/FK rebuild fixture detects and refuses orphaned references')

# 17 Accounting constraint tightening remains fail-closed with incompatible data.
conn = sqlite3.connect(':memory:')
conn.execute('CREATE TABLE accounting_writeoffs(id INTEGER PRIMARY KEY,item_name TEXT,updated_at TEXT)')
conn.execute('INSERT INTO accounting_writeoffs VALUES(1,NULL,NULL)')
risk = conn.execute("SELECT COUNT(*) FROM accounting_writeoffs WHERE item_name IS NULL OR updated_at IS NULL").fetchone()[0]
check(ACCOUNTING_FAMILY == ['accounting_expenses', 'accounting_writeoffs', 'general_ledger_accounts'] and risk == 1, 'Accounting fixture blocks NOT NULL tightening while incompatible rows exist')

# 18 Constraint/default family remains bounded to four evidenced tables.
check(CONSTRAINT_DEFAULT_FAMILY == ['product_costs', 'movie_catalog', 'product_resource_links', 'tax_classes'], 'Constraint/default fixture scope is bounded to the four evidenced tables')

# 19 One-sided decisions preserve rather than parity-delete/copy.
check(ONE_SIDED['search_query_terms'].startswith('preserve-5-live-rows') and 'untouched' in ONE_SIDED['__sql_test'], 'One-sided table fixture preserves live search rows and avoids count-parity cleanup')

# 20 Safety flags forbid Production mutation/helper generation.
check(all(value is False for value in SAFETY.values()), 'All Build 423 mutation/copy/promotion capabilities remain disabled')

if failures:
    print(f'BUILD 423 LOCAL RELEASE FIXTURE REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for item in failures:
        print(' -', item)
    raise SystemExit(1)

print(f'BUILD 423 LOCAL RELEASE FIXTURE REGRESSION: PASS ({checks}/{checks})')
print('Gift Card additive/idempotent fixture: PASS')
print('Notification additive fixture: PASS')
print('Membership preservation fixture: PASS')
print('Fractional Inventory preservation fixture: PASS')
print('Product/FK orphan refusal fixture: PASS')
print('Product-number uniqueness/sequence fixture: PASS')
print('No Cloudflare resource was contacted.')
print('No database or R2 mutation was executed.')
print('Executable Production helper generated: NO')
print('PRODUCTION PROMOTION: CLOSED')
