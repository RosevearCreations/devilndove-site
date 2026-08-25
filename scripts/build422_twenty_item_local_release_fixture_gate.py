#!/usr/bin/env python3
"""Build 422 twenty-item local release-fixture gate.

No Cloudflare, D1, R2 or provider access. This gate consumes Build 421 local
evidence and verifies that migration-family source authorities and fail-closed
release constraints remain intact before any executable Production helper exists.
"""
from __future__ import annotations

from pathlib import Path
import re
import subprocess
import sys

from build422_blocker_mapper import EVIDENCE_PATH, OUTPUT_PATH, parse_items
from build422_release_fixture_catalog import (
    ACCOUNTING_REBUILD_TABLES,
    BROAD_PRODUCTION_TO_DEVELOPMENT_COPY_ALLOWED,
    CAIP_D1_ONLY_COPY_ALLOWED,
    CONSTRAINT_REVIEW_TABLES,
    EXECUTABLE_PRODUCTION_HELPER_ALLOWED,
    FRACTIONAL_TABLE_COLUMNS,
    GIFT_CARD_LOOKUP_COLUMNS,
    GIFT_CARD_LOOKUP_INDEXES,
    MEMBERSHIP_CANONICAL_COLUMNS,
    NOTIFICATION_OUTBOX_INDEXES,
    PRODUCT_FK_FAMILIES,
    PRODUCTION_MUTATION_ENABLED,
    ROLLOUT_PHASES,
)

ROOT = Path(__file__).resolve().parents[1]
BUILD421_MANIFEST = ROOT / 'build421_non_executing_production_migration_manifest.local.md'
BUILD422_DOC = ROOT / 'BUILD422_TWENTY_ITEM_RELEASE_FIXTURES.md'


class Gate:
    def __init__(self) -> None:
        self.total = 0
        self.failures: list[str] = []

    def check(self, condition: bool, label: str) -> None:
        self.total += 1
        state = 'PASS' if condition else 'FAIL'
        print(f'{self.total:02d}. {state} — {label}')
        if not condition:
            self.failures.append(label)


def read(rel: str) -> str:
    path = ROOT / rel
    return path.read_text(encoding='utf-8', errors='replace') if path.exists() else ''


def current_branch() -> str:
    result = subprocess.run(
        ['git', 'branch', '--show-current'], cwd=ROOT, text=True,
        encoding='utf-8', errors='replace', stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else ''


def count_numbered_items(text: str, marker: str) -> int:
    if marker not in text:
        return 0
    tail = text.split(marker, 1)[1]
    stop = tail.find('\n## ')
    if stop >= 0:
        tail = tail[:stop]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def all_present(text: str, values) -> bool:
    return all(str(value) in text for value in values)


def main() -> int:
    print('BUILD 422 TWENTY-ITEM LOCAL RELEASE FIXTURE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()
    build421_doc = read('BUILD421_TWENTY_ITEM_PRODUCTION_EVIDENCE.md')
    build422_doc = read('BUILD422_TWENTY_ITEM_RELEASE_FIXTURES.md')
    gift_sql = read('database_gift_card_runtime_parity.sql')
    gift_readiness = read('functions/api/_lib/giftCardSchemaReadiness.js')
    membership_sql = read('database_membership_tier_policy_runtime_parity.sql')
    build410 = read('scripts/build410_apply_development_parity_overlays.py')
    notification_sql = read('database_notification_runtime_parity.sql')
    inventory_regression = read('scripts/build244_inventory_authority_fractional_usage_regression.py')
    build419_doc = read('BUILD419_TARGETED_STRUCTURAL_DRIFT_EVIDENCE.md')
    build420_doc = read('BUILD420_PRODUCTION_PARITY_HARDENING.md')

    evidence_items = []
    if EVIDENCE_PATH.exists():
        evidence_items = parse_items(EVIDENCE_PATH.read_text(encoding='utf-8', errors='replace'))
    blockers = [item for item in evidence_items if item.state == 'BLOCKER']

    gate.check(current_branch() == 'dev', 'current git branch is dev')
    gate.check(
        'PASS — 20/20 LIVE READ-ONLY EVIDENCE COMPLETE / 1 ROLLOUT BLOCKER' in build421_doc,
        'Build 421 Markdown records 20/20 completion with one blocker',
    )
    gate.check(EVIDENCE_PATH.exists(), 'Build 421 local evidence file is present')
    gate.check(len(evidence_items) == 20, 'Build 421 local evidence parses exactly 20 items')
    gate.check(len(blockers) == 1, 'Build 421 local evidence parses exactly one rollout blocker')
    gate.check(BUILD421_MANIFEST.exists(), 'Build 421 non-executing local migration manifest is present')
    manifest = BUILD421_MANIFEST.read_text(encoding='utf-8', errors='replace') if BUILD421_MANIFEST.exists() else ''
    gate.check(
        'Executable Production helper generated: **NO**' in manifest
        or 'Executable Production helper: **REFUSED / NOT GENERATED**' in manifest,
        'Build 421 manifest keeps executable Production helper disabled',
    )
    gate.check(
        OUTPUT_PATH.exists(),
        'Build 422 local blocker mapping has been generated',
    )
    gate.check(
        all_present(gift_sql, [f'{name} TEXT' for name in GIFT_CARD_LOOKUP_COLUMNS])
        and all_present(gift_sql, GIFT_CARD_LOOKUP_INDEXES),
        'Gift Card additive column/index authority is complete',
    )
    gate.check(
        'CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts' in gift_sql
        and 'gift_card_lookup_attempts' in gift_readiness
        and 'gift_card_lookup_lockouts' in gift_readiness,
        'Gift Card lockout/readiness authority remains fail-closed',
    )
    gate.check(
        all_present(membership_sql, MEMBERSHIP_CANONICAL_COLUMNS)
        and all_present(build410, ['MEMBERSHIP_SHADOW', 'MEMBERSHIP_BACKUP', 'rebuild_membership_policy_table']),
        'Membership canonical shape and data-preserving rebuild fixture authority are present',
    )
    gate.check(
        'metadata_json TEXT' in notification_sql
        and all_present(notification_sql, NOTIFICATION_OUTBOX_INDEXES),
        'Notification additive metadata/index authority is complete',
    )
    gate.check(
        set(FRACTIONAL_TABLE_COLUMNS) == {
            'site_item_inventory', 'site_inventory_movements',
            'creative_project_inventory_posts', 'creative_project_inventory_reversals',
            'product_material_return_audit',
        }
        and all_present(inventory_regression, ['on_hand_quantity REAL', 'reserved_quantity REAL', 'incoming_quantity REAL']),
        'Fractional Inventory rebuild family is explicitly cataloged and REAL authority is retained',
    )
    gate.check(
        'expected 1041' not in inventory_regression.lower()
        and '1,041 existing rows' in build420_doc,
        '1,041-row Inventory preservation is a release assertion, not a hard-coded fixture seed',
    )
    gate.check(
        set(PRODUCT_FK_FAMILIES) == {
            'product_media_score_history', 'product_review_actions', 'products',
            'site_page_views', 'supplier_purchase_order_items',
        }
        and 'Product/FK rebuild group' in build420_doc,
        'Product/FK rebuild family and orphan-gate scope are explicit',
    )
    gate.check(
        ACCOUNTING_REBUILD_TABLES == ('accounting_expenses', 'accounting_writeoffs', 'general_ledger_accounts')
        and all_present(build419_doc, ACCOUNTING_REBUILD_TABLES),
        'Accounting rebuild family is bounded to the three evidenced tables',
    )
    gate.check(
        CONSTRAINT_REVIEW_TABLES == ('product_costs', 'movie_catalog', 'product_resource_links', 'tax_classes')
        and all_present(build419_doc, CONSTRAINT_REVIEW_TABLES),
        'Constraint/default review family is bounded to four evidenced tables',
    )
    gate.check(
        'search_query_terms' in build422_doc and 'preserve' in build422_doc.lower()
        and '__sql_test' in build422_doc and 'count parity' in build422_doc.lower(),
        'One-sided table decisions preserve search rows and reject count-parity cleanup',
    )
    gate.check(
        len(ROLLOUT_PHASES) == 13
        and ROLLOUT_PHASES[0] == 'backup_and_export_evidence'
        and ROLLOUT_PHASES[-1] == 'promotion_decision',
        'Production rollout sequence has explicit backup-first and promotion-last boundaries',
    )
    gate.check(
        count_numbered_items(build422_doc, '## Next 20 ordered changes') == 20
        and not PRODUCTION_MUTATION_ENABLED
        and not EXECUTABLE_PRODUCTION_HELPER_ALLOWED
        and not BROAD_PRODUCTION_TO_DEVELOPMENT_COPY_ALLOWED
        and not CAIP_D1_ONLY_COPY_ALLOWED,
        'Build 422 records exactly next 20 and all mutation/copy capabilities remain disabled',
    )

    print()
    if gate.failures:
        print(f'BUILD 422 TWENTY-ITEM LOCAL RELEASE FIXTURE GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for label in gate.failures:
            print(' -', label)
        return 1

    print(f'BUILD 422 TWENTY-ITEM LOCAL RELEASE FIXTURE GATE: PASS ({gate.total}/{gate.total})')
    if blockers:
        print(f'Build 421 blocker retained fail-closed: {blockers[0].label}')
        if blockers[0].summary:
            print(f'Blocker evidence: {blockers[0].summary}')
    print('No Cloudflare resource was contacted.')
    print('No database or R2 mutation was executed.')
    print('Executable Production helper generated: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: execute the next 20 ordered Build 423 fixture/remediation items from BUILD422_TWENTY_ITEM_RELEASE_FIXTURES.md.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
