#!/usr/bin/env python3
"""Build 436 local-only 20-item Membership rebuild authorization gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BUILD435 = ROOT / 'build435_membership_value_mapping_preflight.local.json'
BUILD436 = ROOT / 'build436_membership_rebuild_authorization_preflight.local.json'
CONTROLLER = ROOT / 'scripts' / 'build436_production_membership_rebuild.py'
REGRESSION = ROOT / 'scripts' / 'build436_membership_rebuild_regression.py'
DOC = ROOT / 'BUILD436_TWENTY_ITEM_MEMBERSHIP_REBUILD_AUTHORIZATION_BOUNDARY.md'
AUTH_TOKEN = 'AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def main() -> int:
    print('BUILD 436 TWENTY-ITEM MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    b435 = load(BUILD435)
    b436 = load(BUILD436)
    controller_text = CONTROLLER.read_text(encoding='utf-8') if CONTROLLER.exists() else ''
    regression_text = REGRESSION.read_text(encoding='utf-8') if REGRESSION.exists() else ''
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 437', 1)[1] if '## Next 20 ordered changes — Build 437' in doc_text else ''
    next_block = next_section.split('## Current safety state', 1)[0] if next_section else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_block)

    check(branch == 'dev', 'current git branch is dev')
    check(b435.get('lossless_mapping_possible') is True and b435.get('safe_to_prepare_membership_execution_boundary') is True, 'Build 435 lossless Membership mapping remains green')
    check(b435.get('membership_row_count') == 3 and set(b435.get('raw_codes') or []) == EXPECTED_TIERS, 'Build 435 exact three-tier source boundary remains green')
    check(len(str(b435.get('source_rows_sha256') or '')) == 64, 'Build 435 complete source-row SHA-256 boundary is present')
    check(bool(b436), 'Build 436 rebuild authorization preflight artifact exists')
    check(b436.get('build435_mapping_green') is True and b436.get('membership_row_count') == 3, 'Build 436 preflight is anchored to the green three-row Build 435 mapping')
    check(len(str(b436.get('source_rows_sha256') or '')) == 64 and b436.get('source_rows_sha256') == b435.get('source_rows_sha256'), 'Build 436 source fingerprint matches fresh Build 435 evidence')
    check(len(str(b436.get('canonical_preview_sha256') or '')) == 64, 'Build 436 canonical-preview SHA-256 boundary is present')
    check(b436.get('policy_ids_valid') is True and len(b436.get('policy_ids') or []) == 3, 'Membership policy IDs are positive, unique, and complete')
    check(b436.get('canonical_required_values_nonnull') is True, 'all canonical Build 395 mapped values are non-null')
    check(b436.get('canonical_tiers_exact') is True and set(b436.get('raw_codes') or []) == EXPECTED_TIERS, 'canonical tier identities remain exactly bronze/silver/gold')
    check(b436.get('no_user_defined_indexes_or_triggers') is True, 'no unhandled Membership user index/trigger dependency exists')
    check(b436.get('no_outbound_foreign_keys') is True, 'no outbound Membership foreign-key dependency exists')
    check(b436.get('no_inbound_foreign_keys') is True, 'no inbound Membership foreign-key dependency exists')
    check(b436.get('no_rebuild_name_collisions') is True, 'no Build 436 shadow/assert object-name collision exists')
    check(b436.get('legacy_sequence_compatible') is True, 'legacy Membership sqlite_sequence boundary is compatible')
    check(b436.get('safe_to_request_membership_rebuild_authorization') is True, 'Build 436 preflight is safe to request separate Membership rebuild authorization')
    check(b436.get('production_backup_created') is False and b436.get('membership_rebuild_authorization_received') is False and b436.get('production_mutation_executed') is False, 'no Membership backup, authorization, or mutation is inferred')
    check(AUTH_TOKEN in controller_text and "export_backup('membership')" in controller_text and 'BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION' in regression_text, 'future Membership execution is separately token-gated, backup-gated, and locally regression-tested')
    check(len(next_items) == 20 and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 436 records exactly next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 436 TWENTY-ITEM MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 436 TWENTY-ITEM MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION GATE: PASS ({checks}/{checks})')
    print('Build 435 lossless mapping: COMPLETE / PROVEN')
    print('Membership source rows: 3 / fingerprinted')
    print(f'Source-row SHA-256: {b436.get("source_rows_sha256")}')
    print(f'Canonical-preview SHA-256: {b436.get("canonical_preview_sha256")}')
    print('Unhandled indexes/triggers/FKs/collisions: NONE')
    print('Membership Production backup: NOT CREATED')
    print('Membership rebuild authorization: NOT RECEIVED')
    print('Membership Production mutation executed: NO')
    print('Later rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print(f'NEXT: explicit token {AUTH_TOKEN} is required before the guarded backup/apply sequence.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
