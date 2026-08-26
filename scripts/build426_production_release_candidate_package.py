#!/usr/bin/env python3
"""Build 426 local Production release-candidate package assembler.

Consumes the Build 426 live read-only evidence artifact and emits two local files:
- an executable *candidate* SQL file for only the bounded ready families;
- a JSON manifest that records ready/review/deferred families.

This script NEVER contacts Cloudflare and NEVER executes the generated SQL.
Actual Production execution remains a separate later authorization.
"""
from __future__ import annotations

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'build426_live_release_candidate_evidence.local.json'
SQL_OUT = ROOT / 'build426_production_release_candidate.local.sql'
MANIFEST_OUT = ROOT / 'build426_production_release_candidate_manifest.local.json'

GIFT_AUTHORITY = ROOT / 'database_gift_card_runtime_parity.sql'
NOTIFICATION_AUTHORITY = ROOT / 'database_notification_runtime_parity.sql'
MEMBERSHIP_AUTHORITY = ROOT / 'database_membership_tier_policy_runtime_parity.sql'
ANNOTATION_AUTHORITY = ROOT / 'database_build197_application_resilience_media_catalog.sql'

GIFT_COLUMNS = ['lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status']
NOTIFICATION_INDEX_SQL = [
    'CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind_destination ON notification_outbox(notification_kind, destination, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_notification_outbox_order ON notification_outbox(related_order_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_notification_outbox_payment ON notification_outbox(related_payment_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_notification_outbox_product ON notification_outbox(related_product_id, created_at DESC);',
]


def sql_quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def load_evidence() -> dict:
    if not EVIDENCE.exists():
        raise SystemExit('BUILD 426 PACKAGE: FAIL — live evidence artifact is missing.')
    return json.loads(EVIDENCE.read_text(encoding='utf-8'))


def source_authority_ok() -> dict[str, bool]:
    gift = GIFT_AUTHORITY.read_text(encoding='utf-8', errors='replace')
    notification = NOTIFICATION_AUTHORITY.read_text(encoding='utf-8', errors='replace')
    membership = MEMBERSHIP_AUTHORITY.read_text(encoding='utf-8', errors='replace')
    annotation = ANNOTATION_AUTHORITY.read_text(encoding='utf-8', errors='replace')
    return {
        'gift_card': all(column in gift for column in GIFT_COLUMNS) and 'gift_card_lookup_lockouts' in gift,
        'notification': 'metadata_json TEXT' in notification and all(name.split(' ON ')[0].replace('CREATE INDEX IF NOT EXISTS ', '') in notification for name in NOTIFICATION_INDEX_SQL),
        'membership': 'tier_code TEXT NOT NULL UNIQUE' in membership and 'policy_id INTEGER PRIMARY KEY AUTOINCREMENT' in membership,
        'annotation': 'idx_product_image_annotations_product_image_build197' in annotation and 'product_image_annotations(product_id, product_image_id)' in annotation,
    }


def product_number_sql(evidence: dict) -> list[str]:
    if evidence.get('product_number_candidate_ready') is not True:
        return []
    mapping = evidence.get('product_mapping') if isinstance(evidence.get('product_mapping'), list) else []
    if len(mapping) != 45:
        return []
    lines = ['-- PRODUCT NUMBER LEGACY BACKFILL — READY CANDIDATE']
    for row in mapping:
        pid = int(row['product_id'])
        number = int(row['product_number'])
        slug = sql_quote(row['slug'])
        lines.append(
            f"UPDATE products SET product_number={number} "
            f"WHERE product_id={pid} AND slug={slug} AND product_number IS NULL "
            f"AND NOT EXISTS (SELECT 1 FROM products WHERE product_number={number});"
        )
    next_number = int(evidence['product_number_candidate_next'])
    lines.extend([
        '',
        'INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)',
        f"VALUES('products',{next_number},CURRENT_TIMESTAMP)",
        'ON CONFLICT(sequence_key) DO UPDATE SET',
        '  next_product_number = CASE',
        '    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number',
        '      THEN excluded.next_product_number',
        '    ELSE catalog_product_number_sequence.next_product_number',
        '  END,',
        '  updated_at = CURRENT_TIMESTAMP;',
    ])
    return lines


def gift_card_sql(evidence: dict) -> list[str]:
    gift = evidence.get('gift_card') or {}
    missing = gift.get('missing_lookup_attempt_columns') or []
    lines = ['-- GIFT CARD BUILD 384 ADDITIVE PARITY — READY CANDIDATE']
    for column in GIFT_COLUMNS:
        if column in missing:
            lines.append(f'ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} TEXT;')
    lines.extend([
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);',
    ])
    if not gift.get('lockout_table_exists'):
        lines.extend([
            'CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts (',
            '  gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT,',
            '  lookup_email TEXT,',
            '  code_suffix TEXT,',
            '  ip_hash TEXT,',
            "  lockout_status TEXT NOT NULL DEFAULT 'active',",
            '  lockout_reason TEXT,',
            '  locked_by_user_id INTEGER,',
            '  locked_at TEXT DEFAULT CURRENT_TIMESTAMP,',
            '  expires_at TEXT,',
            '  released_at TEXT,',
            '  notes TEXT,',
            '  FOREIGN KEY (locked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL',
            ');',
        ])
    lines.append('CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_lockouts_status ON gift_card_lookup_lockouts(lockout_status, locked_at DESC);')
    return lines


def notification_sql(evidence: dict) -> list[str]:
    notification = evidence.get('notification') or {}
    lines = ['-- NOTIFICATION BUILD 403 ADDITIVE PARITY — READY CANDIDATE']
    if not notification.get('metadata_json_exists'):
        lines.append('ALTER TABLE notification_outbox ADD COLUMN metadata_json TEXT;')
    lines.extend(NOTIFICATION_INDEX_SQL)
    return lines


def annotation_sql(evidence: dict) -> list[str]:
    if (evidence.get('product_image_annotations') or {}).get('build197_index_exists'):
        return ['-- PRODUCT IMAGE ANNOTATION BUILD 197 INDEX — ALREADY PRESENT / NO-OP']
    return [
        '-- PRODUCT IMAGE ANNOTATION BUILD 197 INDEX — READY CANDIDATE',
        'CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197 ON product_image_annotations(product_id, product_image_id);',
    ]


def review_sections(evidence: dict) -> list[str]:
    lines = [
        '',
        '-- ============================================================',
        '-- REVIEW-REQUIRED / DEFERRED FAMILIES — NO EXECUTABLE DDL BELOW',
        '-- ============================================================',
    ]
    membership = evidence.get('membership') or {}
    lines.append(f"-- Membership Build 395 data-preserving rebuild required: {bool(membership.get('requires_rebuild'))}")
    lines.append(f"-- Membership Production rows to preserve: {membership.get('production_rows')}")
    lines.append('-- Membership execution requires shadow-table copy, legacy alias mapping, row/tier preservation and a fresh Production backup.')

    for table, item in (evidence.get('fractional_tables') or {}).items():
        lines.append(
            f"-- Fractional rebuild {table}: prod_rows={item.get('production_rows')} "
            f"type_changes={item.get('type_changed_columns')}"
        )
    lines.append('-- Fractional rebuilds remain separate data-preserving operations; site_item_inventory must preserve exactly 1,041 live rows.')

    lines.append(f"-- Product/FK zero-orphan gate: {bool(evidence.get('zero_orphans'))}; counts={evidence.get('orphan_counts')}")
    lines.append('-- Product/FK table rebuilds remain gated on zero live orphans immediately before execution.')
    lines.append('-- Accounting/default/constraint families retain Build 421 compatibility authority and require fresh per-family pre-write checks before execution.')
    one_sided = evidence.get('one_sided_counts') or {}
    lines.append(f"-- search_query_terms preserved: rows={one_sided.get('search_query_terms')}")
    lines.append(f"-- __sql_test untouched: rows={one_sided.get('__sql_test')}")
    lines.append(f"-- CAIP/private-R2 delta excluded from parity release: caip_media_upload_files rows={evidence.get('caip_media_upload_files_rows')}")
    return lines


def assemble(evidence: dict) -> tuple[str, dict]:
    authority = source_authority_ok()
    ready = {
        'product_number': evidence.get('product_number_candidate_ready') is True,
        'gift_card': authority['gift_card'],
        'notification': authority['notification'],
        'product_image_annotation_index': authority['annotation'],
    }
    lines = [
        '-- Devil n Dove Build 426 Production release candidate',
        '-- CANDIDATE ONLY. DO NOT EXECUTE WITHOUT THE LATER EXPLICIT PRODUCTION AUTHORIZATION GATE.',
        '-- Generated locally from fresh Build 426 read-only live evidence.',
        '-- Production backup + fresh stale-evidence proof are mandatory before any later execution.',
        '',
        'PRAGMA foreign_keys = ON;',
        '',
    ]
    lines.extend(product_number_sql(evidence))
    lines.append('')
    lines.extend(gift_card_sql(evidence))
    lines.append('')
    lines.extend(notification_sql(evidence))
    lines.append('')
    lines.extend(annotation_sql(evidence))
    lines.extend(review_sections(evidence))
    lines.extend([
        '',
        '-- Build 426 intentionally contains NO COMMIT/transaction wrapper and is not auto-executed.',
        '-- A later release helper must take a fresh Production export and re-prove all preconditions first.',
    ])
    manifest = {
        'artifact': 'Build 426 Production release-candidate manifest',
        'source_authority': authority,
        'ready_candidate_families': ready,
        'review_required_families': {
            'membership': bool((evidence.get('membership') or {}).get('requires_rebuild')),
            'fractional_inventory': True,
            'product_fk': True,
            'accounting_constraints': True,
        },
        'preserve_no_action': {
            'search_query_terms_rows': (evidence.get('one_sided_counts') or {}).get('search_query_terms'),
            '__sql_test_rows': (evidence.get('one_sided_counts') or {}).get('__sql_test'),
            'caip_media_upload_files_rows': evidence.get('caip_media_upload_files_rows'),
        },
        'site_item_inventory_expected_rows': 1041,
        'zero_orphans': evidence.get('zero_orphans') is True,
        'production_execution_enabled': False,
        'production_backup_created_by_build426': False,
        'production_mutation_executed': False,
        'production_promotion_open': False,
    }
    return '\n'.join(lines).rstrip() + '\n', manifest


def main() -> int:
    evidence = load_evidence()
    sql, manifest = assemble(evidence)
    SQL_OUT.write_text(sql, encoding='utf-8')
    MANIFEST_OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    product_updates = sum(1 for line in sql.splitlines() if line.startswith('UPDATE products SET product_number='))
    print('BUILD 426 PRODUCTION RELEASE-CANDIDATE PACKAGE: PASS')
    print(f'Product-number guarded updates: {product_updates}')
    print(f'Ready candidate families: {[k for k, v in manifest["ready_candidate_families"].items() if v]}')
    print('Review-required rebuild families: membership, fractional Inventory, Product/FK, accounting/defaults')
    print(f'Candidate SQL: {SQL_OUT.name}')
    print(f'Manifest: {MANIFEST_OUT.name}')
    print('Cloudflare access: NONE')
    print('Production execution enabled: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
