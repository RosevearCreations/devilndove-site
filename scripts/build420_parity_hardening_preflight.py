#!/usr/bin/env python3
"""Build 420 local source/parity hardening gate.

This gate deliberately performs NO Cloudflare/D1/R2/network access. It verifies
20 source-level release invariants that back the Build 420 parity plan before the
next live evidence phase.
"""
from __future__ import annotations

from pathlib import Path
import re
import subprocess

from build420_index_semantics import normalize_index_sql

ROOT = Path(__file__).resolve().parents[1]


class Gate:
    def __init__(self) -> None:
        self.total = 0
        self.failures: list[str] = []

    def check(self, condition: bool, label: str) -> None:
        self.total += 1
        if condition:
            print(f'{self.total:02d}. PASS — {label}')
        else:
            print(f'{self.total:02d}. FAIL — {label}')
            self.failures.append(label)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        return ''
    return path.read_text(encoding='utf-8', errors='replace')


def current_branch() -> str:
    result = subprocess.run(
        ['git', 'branch', '--show-current'],
        cwd=ROOT,
        text=True,
        encoding='utf-8',
        errors='replace',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else ''


def all_present(text: str, needles: list[str]) -> bool:
    return all(needle in text for needle in needles)


def count_next_items(text: str) -> int:
    marker = '## Next 20 ordered changes'
    if marker not in text:
        return 0
    tail = text.split(marker, 1)[1]
    stop = tail.find('\n## ')
    if stop >= 0:
        tail = tail[:stop]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def main() -> int:
    print('BUILD 420 TWENTY-ITEM PARITY HARDENING PREFLIGHT')
    print('Cloudflare/D1/R2 access: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()

    build419_doc = read('BUILD419_TARGETED_STRUCTURAL_DRIFT_EVIDENCE.md')
    build420_doc = read('BUILD420_PRODUCTION_PARITY_HARDENING.md')
    gift_sql = read('database_gift_card_runtime_parity.sql')
    gift_readiness = read('functions/api/_lib/giftCardSchemaReadiness.js')
    membership_sql = read('database_membership_tier_policy_runtime_parity.sql')
    build410 = read('scripts/build410_apply_development_parity_overlays.py')
    notification_sql = read('database_notification_runtime_parity.sql')
    inventory_regression = read('scripts/build244_inventory_authority_fractional_usage_regression.py')
    build419_script = read('scripts/build419_targeted_structural_drift_evidence.py')
    index_helper = read('scripts/build420_index_semantics.py')
    index_regression = read('scripts/build420_index_semantics_regression.py')
    resilient = read('scripts/build418_live_semantic_schema_classification_resilient.py')
    wrangler = read('wrangler.toml')

    gate.check(current_branch() == 'dev', 'current git branch is dev')

    gate.check(
        '**PASS — LIVE READ-ONLY EVIDENCE COMPLETE / PRODUCTION WRITES CLOSED**' in build419_doc,
        'Build 419 live evidence is recorded as PASS',
    )

    gate.check(
        '## Build 420 — 20 completed changes' in build420_doc,
        'Build 420 records the twenty-item completed batch',
    )

    gate.check(
        all_present(
            gift_sql,
            ['lookup_email TEXT', 'code_suffix TEXT', 'ip_hash TEXT', 'user_agent TEXT', 'result_status TEXT'],
        ),
        'Gift Card lookup-attempt canonical columns are migration-owned',
    )

    gate.check(
        all_present(
            gift_sql,
            ['CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts', 'idx_gift_card_lookup_lockouts_status'],
        ),
        'Gift Card lockout table and index are migration-owned',
    )

    gate.check(
        'gift_card_lookup_lockouts' in gift_readiness and 'gift_card_lookup_attempts' in gift_readiness,
        'Gift Card readiness checks attempts and lockouts',
    )

    gate.check(
        all_present(
            membership_sql,
            ['policy_id INTEGER PRIMARY KEY AUTOINCREMENT', 'tier_code TEXT NOT NULL UNIQUE', 'title TEXT NOT NULL DEFAULT', 'benefits_json TEXT NOT NULL DEFAULT', 'badge_color TEXT NOT NULL DEFAULT'],
        ),
        'Build 395 membership canonical shape is present',
    )

    gate.check(
        all_present(
            build410,
            ['MEMBERSHIP_CANONICAL_COLUMNS', 'MEMBERSHIP_SHADOW', 'MEMBERSHIP_BACKUP', 'rebuild_membership_policy_table'],
        ),
        'Build 410 retains data-preserving membership compatibility logic',
    )

    gate.check(
        all_present(
            notification_sql,
            ['metadata_json TEXT', 'idx_notification_outbox_kind_destination', 'idx_notification_outbox_order', 'idx_notification_outbox_payment', 'idx_notification_outbox_product'],
        ),
        'Build 403 notification authority includes metadata and current indexes',
    )

    gate.check(
        all_present(
            inventory_regression,
            [
                'on_hand_quantity REAL NOT NULL DEFAULT 1',
                'reserved_quantity REAL NOT NULL DEFAULT 0',
                'incoming_quantity REAL NOT NULL DEFAULT 0',
                'reorder_level REAL NOT NULL DEFAULT 0',
                'preferred_reorder_quantity REAL NOT NULL DEFAULT 0',
            ],
        ),
        'fractional Inventory quantity authority remains REAL in regression coverage',
    )

    gate.check(
        'UNIQUE(source_type, external_key)' in inventory_regression,
        'Inventory operational identity uniqueness remains covered',
    )

    gate.check(
        all_present(build419_script, ['order_only: list[str]', 'structural: list[str]', 'build420_index_signature']),
        'Build 419 evidence tool separates history/order drift and uses Build 420 index semantics',
    )

    packaging_left = normalize_index_sql(
        'CREATE INDEX idx_dev ON packaging_project_ingredients(site_item_inventory_id,packaging_project_id,sort_order)'
    )
    packaging_right = normalize_index_sql(
        'CREATE INDEX idx_prod ON packaging_project_ingredients(site_item_inventory_id, packaging_project_id, sort_order)'
    )
    gate.check(
        packaging_left == packaging_right,
        'packaging_project_ingredients comma-whitespace index difference normalizes as cosmetic',
    )

    gate.check(
        all_present(index_helper, ['normalize_index_sql', 'UNIQUE, DESC', 'value = re.sub'])
        and all_present(index_regression, ['column order remains material', 'DESC remains material', 'UNIQUE remains material']),
        'index normalizer preserves material UNIQUE/DESC/order semantics',
    )

    gate.check(
        "WRANGLER_VERSION = '4.126.0'" in resilient,
        'Windows live-evidence transport pins Wrangler 4.126.0',
    )

    gate.check(
        'WINDOWS_SAFE_SQL_BATCH_CHARS = 1800' in resilient,
        'Windows live-evidence SQL batching remains capped at 1800 characters',
    )

    gate.check(
        all_present(
            wrangler,
            [
                'name = "devilndove-site-dev"',
                'database_name = "devilndove-dev"',
                'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"',
            ],
        ),
        'wrangler.toml remains pinned to the Development project/D1 target',
    )

    gate.check(
        'Broad Production -> Development data copy         CANCELLED' in build420_doc,
        'broad Production-to-Development data copy remains cancelled',
    )

    gate.check(
        'CAIP D1-only metadata copy                        FORBIDDEN' in build420_doc
        and 'D1 metadata cannot be copied alone' in build420_doc,
        'CAIP metadata-only copy remains forbidden without matching private R2 portability',
    )

    gate.check(
        count_next_items(build420_doc) == 20
        and 'Production schema mutation                        CLOSED' in build420_doc
        and 'Production promotion                              CLOSED' in build420_doc,
        'Build 420 records exactly twenty next items and keeps Production closed',
    )

    print()
    if gate.failures:
        print(f'BUILD 420 TWENTY-ITEM PARITY HARDENING PREFLIGHT: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for item in gate.failures:
            print(' -', item)
        return 1

    print(f'BUILD 420 TWENTY-ITEM PARITY HARDENING PREFLIGHT: PASS ({gate.total}/{gate.total})')
    print('No Cloudflare resource was contacted.')
    print('No database or R2 mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: Build 421 executes the twenty ordered read-only evidence/manifest tasks from BUILD420_PRODUCTION_PARITY_HARDENING.md.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
