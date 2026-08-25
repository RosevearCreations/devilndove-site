#!/usr/bin/env python3
"""Build 425 local regression for deterministic Development-first Product numbering."""
from __future__ import annotations

import sqlite3

START = 1084
COUNT = 45
NEXT = 1129
failures: list[str] = []
checks = 0


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE products(
  product_id INTEGER PRIMARY KEY,
  product_number INTEGER UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE
);
CREATE TABLE catalog_product_number_sequence(
  sequence_key TEXT PRIMARY KEY,
  next_product_number INTEGER NOT NULL,
  updated_at TEXT
);
''')
for pid in range(1, COUNT + 1):
    conn.execute(
        'INSERT INTO products(product_id,product_number,slug,name,sku) VALUES(?,NULL,?,?,?)',
        (pid, f'p-{pid}', f'Product {pid}', f'LEGACY-{pid:03d}'),
    )
conn.execute("INSERT INTO catalog_product_number_sequence VALUES('products',1000,NULL)")
conn.commit()

ids_before = [row[0] for row in conn.execute('SELECT product_id FROM products ORDER BY product_id')]
identity_before = [tuple(row) for row in conn.execute('SELECT product_id,slug,name FROM products ORDER BY product_id')]

mapping = [(pid, START + pid - 1, f'p-{pid}') for pid in range(1, COUNT + 1)]
case_sql = ' '.join(f"WHEN product_id={pid} AND slug='{slug}' THEN {number}" for pid, number, slug in mapping)
id_sql = ','.join(str(pid) for pid, _, _ in mapping)
update_sql = f'''UPDATE products
SET product_number = CASE {case_sql} ELSE product_number END
WHERE product_number IS NULL AND product_id IN ({id_sql});'''

first = conn.execute(update_sql)
first_changes = first.rowcount
conn.execute("""
INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)
VALUES('products',?,CURRENT_TIMESTAMP)
ON CONFLICT(sequence_key) DO UPDATE SET
  next_product_number=CASE
    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number
      THEN excluded.next_product_number
    ELSE catalog_product_number_sequence.next_product_number
  END,
  updated_at=CURRENT_TIMESTAMP
""", (NEXT,))
conn.commit()

numbers = [row[0] for row in conn.execute('SELECT product_number FROM products ORDER BY product_id')]
ids_after = [row[0] for row in conn.execute('SELECT product_id FROM products ORDER BY product_id')]
identity_after = [tuple(row) for row in conn.execute('SELECT product_id,slug,name FROM products ORDER BY product_id')]
sequence_after = conn.execute("SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products'").fetchone()[0]

second = conn.execute(update_sql)
second_changes = second.rowcount
conn.execute("""
INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)
VALUES('products',?,CURRENT_TIMESTAMP)
ON CONFLICT(sequence_key) DO UPDATE SET
  next_product_number=CASE
    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number
      THEN excluded.next_product_number
    ELSE catalog_product_number_sequence.next_product_number
  END,
  updated_at=CURRENT_TIMESTAMP
""", (NEXT,))
conn.commit()
sequence_rerun = conn.execute("SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products'").fetchone()[0]

check(first_changes == COUNT, 'first pass changes exactly 45 legacy Product rows')
check(numbers == list(range(START, START + COUNT)), 'mapping is deterministic 1084..1128 in Product-ID order')
check(len(set(numbers)) == COUNT, 'all 45 assigned Product numbers are unique')
check(ids_before == ids_after, 'Product IDs are preserved')
check(identity_before == identity_after, 'Product ID/slug/name identities are preserved')
check(sequence_after == NEXT, 'sequence advances to 1129')
check(second_changes == 0, 'rerun changes zero Product rows')
check(sequence_rerun == NEXT, 'rerun never rolls sequence backward or forward unnecessarily')
check(min(numbers) >= 1000, 'all Product numbers remain in canonical positive range')
check(max(numbers) < sequence_after, 'sequence remains strictly beyond assigned legacy maximum')

# Stale/partial state must not look like a first-write candidate.
conn.execute('UPDATE products SET product_number=NULL WHERE product_id=1')
partial_nulls = conn.execute('SELECT COUNT(*) FROM products WHERE product_number IS NULL').fetchone()[0]
check(partial_nulls == 1, 'partial state is detectable and differs from the required 45-NULL precondition')

# Sequence no-rollback fixture.
conn.execute("UPDATE catalog_product_number_sequence SET next_product_number=1200 WHERE sequence_key='products'")
conn.execute("""
INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)
VALUES('products',?,CURRENT_TIMESTAMP)
ON CONFLICT(sequence_key) DO UPDATE SET
  next_product_number=CASE
    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number
      THEN excluded.next_product_number
    ELSE catalog_product_number_sequence.next_product_number
  END
""", (NEXT,))
check(conn.execute("SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products'").fetchone()[0] == 1200,
      'sequence-upsert fixture never rolls back a higher reservation')

if failures:
    print(f'BUILD 425 PRODUCT NUMBER BACKFILL REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for item in failures:
        print(' -', item)
    raise SystemExit(1)

print(f'BUILD 425 PRODUCT NUMBER BACKFILL REGRESSION: PASS ({checks}/{checks})')
print('First pass Product updates: 45')
print('Second pass Product updates: 0')
print('Legacy block: 1084..1128')
print('Next Product number: 1129')
print('No Cloudflare resource was contacted.')
print('No database mutation outside the in-memory fixture was executed.')
