#!/usr/bin/env python3
"""Build 426 local regression for Production release-candidate assembly."""
from __future__ import annotations

from build426_production_release_candidate_package import assemble

failures: list[str] = []
checks = 0


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


mapping = [
    {'product_id': i + 1, 'slug': f'product-{i + 1}', 'name': f'Product {i + 1}', 'product_number': 1084 + i}
    for i in range(45)
]
synthetic = {
    'product_number_candidate_ready': True,
    'product_number_candidate_next': 1129,
    'product_mapping': mapping,
    'gift_card': {
        'missing_lookup_attempt_columns': ['lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'],
        'lockout_table_exists': False,
        'lookup_attempt_rows': 2,
    },
    'notification': {
        'metadata_json_exists': False,
        'missing_indexes': [
            'idx_notification_outbox_kind_destination',
            'idx_notification_outbox_order',
            'idx_notification_outbox_payment',
            'idx_notification_outbox_product',
        ],
        'outbox_rows': 3,
    },
    'product_image_annotations': {'build197_index_exists': False, 'rows': 4},
    'membership': {'requires_rebuild': True, 'production_rows': 3},
    'fractional_tables': {
        'site_item_inventory': {'production_rows': 1041, 'type_changed_columns': ['on_hand_quantity']},
        'site_inventory_movements': {'production_rows': 0, 'type_changed_columns': ['quantity_delta']},
        'creative_project_inventory_posts': {'production_rows': 0, 'type_changed_columns': ['stock_quantity_consumed']},
        'creative_project_inventory_reversals': {'production_rows': 0, 'type_changed_columns': ['stock_quantity_restored']},
        'product_material_return_audit': {'production_rows': 0, 'type_changed_columns': ['previous_on_hand_quantity']},
    },
    'orphan_counts': {'x': 0},
    'zero_orphans': True,
    'one_sided_counts': {'search_query_terms': 5, '__sql_test': 0},
    'caip_media_upload_files_rows': 113,
}

sql, manifest = assemble(synthetic)
lines = sql.splitlines()
updates = [line for line in lines if line.startswith('UPDATE products SET product_number=')]

check(len(updates) == 45, 'package contains exactly 45 guarded Product-number updates')
check('product_number=1084' in updates[0] and 'product_number=1128' in updates[-1], 'Product-number candidate spans exact 1084..1128 block')
check(all('product_number IS NULL' in line for line in updates), 'every Product update requires legacy NULL state')
check(all('NOT EXISTS' in line for line in updates), 'every Product update includes collision refusal')
check("VALUES('products',1129,CURRENT_TIMESTAMP)" in sql, 'sequence candidate advances to 1129')
check('catalog_product_number_sequence.next_product_number < excluded.next_product_number' in sql, 'sequence candidate cannot roll back')
check(all(f'ADD COLUMN {column} TEXT;' in sql for column in ['lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status']), 'Gift Card candidate contains all five missing additive columns')
check('CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts' in sql, 'Gift Card lockout table candidate is present')
check('ALTER TABLE notification_outbox ADD COLUMN metadata_json TEXT;' in sql, 'Notification metadata additive candidate is present')
check(sql.count('idx_notification_outbox_') >= 4, 'Notification current index candidates are present')
check('idx_product_image_annotations_product_image_build197' in sql, 'Build 197 Product-image annotation index candidate is present')
check('REVIEW-REQUIRED / DEFERRED FAMILIES' in sql, 'rebuild families are separated from bounded ready candidate SQL')
check('Membership Build 395 data-preserving rebuild required: True' in sql, 'Membership rebuild remains review-gated')
check('site_item_inventory: prod_rows=1041' in sql, 'Inventory rebuild blueprint carries exact 1,041-row preservation boundary')
check('search_query_terms preserved: rows=5' in sql and '__sql_test untouched: rows=0' in sql, 'one-sided tables remain preserve/no-action')
check('CAIP/private-R2 delta excluded from parity release' in sql and '113' in sql, 'CAIP 113-row delta remains excluded')
check(manifest['production_execution_enabled'] is False, 'manifest disables Production execution')
check(manifest['production_backup_created_by_build426'] is False, 'Build 426 does not pretend a Production backup exists')
check(manifest['production_mutation_executed'] is False, 'manifest records no Production mutation')
check(manifest['production_promotion_open'] is False, 'Production promotion remains closed')

if failures:
    print(f'BUILD 426 RELEASE-CANDIDATE REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for item in failures:
        print(' -', item)
    raise SystemExit(1)

print(f'BUILD 426 RELEASE-CANDIDATE REGRESSION: PASS ({checks}/{checks})')
print('Product-number 45-row candidate: PASS')
print('Gift Card additive candidate: PASS')
print('Notification additive candidate: PASS')
print('Product-image index candidate: PASS')
print('Rebuild-family review boundaries: PASS')
print('Production execution enabled: NO')
print('No Cloudflare resource was contacted.')
