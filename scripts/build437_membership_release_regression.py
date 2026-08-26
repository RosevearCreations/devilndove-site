#!/usr/bin/env python3
"""Build 437 local-only consolidated Membership completion regression."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MIGRATION = ROOT / 'database_membership_tier_policy_runtime_parity.sql'
READ_SERVICE = ROOT / 'functions/api/_lib/membershipTierPolicyReadService.js'
ADMIN_API = ROOT / 'functions/api/admin/tier-policies.js'
MEMBER_API = ROOT / 'functions/api/member/tier-policies.js'
STALE_MEMBER_DUPLICATE = ROOT / 'member/tier-policies.js'
DB_SANITY = ROOT / 'functions/api/_lib/platformDbSanityReadService.js'
PREFLIGHT = ROOT / 'scripts/build436_membership_rebuild_authorization_preflight.py'
CONTROLLER = ROOT / 'scripts/build436_production_membership_rebuild.py'
EXECUTION_WRAPPER = ROOT / 'scripts/build437_production_membership_rebuild.py'
REBUILD_REGRESSION = ROOT / 'scripts/build436_membership_rebuild_regression.py'
AUTH_GATE = ROOT / 'scripts/build436_membership_rebuild_authorization_gate.py'
MANIFEST_GENERATOR = ROOT / 'scripts/generate_release_manifest.py'
NOTES_GENERATOR = ROOT / 'scripts/generate_release_notes.py'
CURRENT_RELEASE = ROOT / 'data/site/current-release.json'
COMPLETION_DOC = ROOT / 'BUILD437_MEMBERSHIP_COMPLETION_RELEASE.md'

EXPECTED_TOKEN = 'AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD'

checks = 0
failures: list[str] = []


def text(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def main() -> int:
    migration = text(MIGRATION)
    read_service = text(READ_SERVICE)
    admin_api = text(ADMIN_API)
    member_api = text(MEMBER_API)
    db_sanity = text(DB_SANITY)
    preflight = text(PREFLIGHT)
    controller = text(CONTROLLER)
    execution_wrapper = text(EXECUTION_WRAPPER)
    rebuild_regression = text(REBUILD_REGRESSION)
    auth_gate = text(AUTH_GATE)
    manifest_generator = text(MANIFEST_GENERATOR)
    notes_generator = text(NOTES_GENERATOR)
    completion_doc = text(COMPLETION_DOC)
    release = json.loads(CURRENT_RELEASE.read_text(encoding='utf-8')) if CURRENT_RELEASE.exists() else {}

    print('BUILD 437 CONSOLIDATED MEMBERSHIP RELEASE REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    check('policy_id INTEGER PRIMARY KEY AUTOINCREMENT' in migration and 'tier_code TEXT NOT NULL UNIQUE' in migration, 'canonical Build 395 Membership table authority is retained')
    check('idx_membership_tier_policies_sort' in migration and 'sort_order ASC, tier_code ASC' in migration, 'canonical Membership sort index is part of schema authority')
    check('export const BUILD = 437;' in read_service and 'export const IMPLEMENTATION_BUILD = 437;' in read_service, 'shared Membership read contract is advanced to Build 437')
    check('membership_tier_policy_id' in read_service and 'display_title' in read_service, 'shared read mapper supports the reviewed legacy ID/title aliases')
    check('readMembershipTierPolicySchemaState' in read_service and 'canonical_schema_ready' in read_service, 'shared service exposes non-mutating canonical write readiness')
    check('const MUTATION_BUILD = 437;' in admin_api and 'readMembershipTierPolicySchemaState' in admin_api and 'if (!schemaState.canonical_schema_ready)' in admin_api, 'admin Membership writes fail closed until canonical schema is active')
    check('CREATE TABLE membership_tier_policies' not in admin_api and 'ALTER TABLE membership_tier_policies' not in admin_api, 'admin request handler performs no Membership DDL')
    check('readMembershipTierPolicies' in member_api and 'FROM membership_tier_policies' not in member_api and not STALE_MEMBER_DUPLICATE.exists(), 'member endpoint uses shared compatibility reads and the stale root duplicate is retired')
    check("membership_tier_policies: ['policy_id']" in db_sanity, 'platform DB sanity expects canonical Membership policy_id')
    check("'membership_tier_policies'" in db_sanity and 'membership_tier_policies' in db_sanity.split('indexChecks', 1)[1], 'platform DB sanity includes Membership index visibility')
    check('legacy_sort_index_compatible' in preflight and "LEGACY_SORT_COLUMNS = ['sort_order', 'code']" in preflight and 'no_unhandled_user_objects' in preflight, 'preflight handles only the reviewed legacy sort index')
    check("SELECT seqno,cid,name FROM pragma_index_info('" in preflight and 'PRAGMA index_info(' not in preflight and 'JOIN pragma_foreign_key_list' not in preflight, 'preflight uses Build 418 SQL-guard-compatible index/FK discovery')
    check('CREATE INDEX {SORT_INDEX}' in controller and 'sort_order ASC, tier_code ASC' in controller, 'guarded rebuild recreates canonical sort-index semantics')
    check(EXECUTION_WRAPPER.exists() and 'guard_compatible_q' in execution_wrapper and "pragma_index_info('" in execution_wrapper and 'executor.q = guard_compatible_q' in execution_wrapper, 'Build 437 execution wrapper makes postcheck index metadata reads SQL-guard-compatible')
    check('Legacy sort index -> canonical sort index: PASS' in rebuild_regression and "CREATE INDEX idx_membership_tier_policies_sort" in rebuild_regression, 'local rebuild regression simulates legacy-to-canonical index preservation')
    check('legacy_sort_index_compatible' in auth_gate and 'no_unhandled_user_objects' in auth_gate, 'authorization gate accepts only the reviewed handled sort index')
    check(EXPECTED_TOKEN in controller and EXPECTED_TOKEN in auth_gate, 'one exact Membership Production authorization token remains enforced')
    check(
        "['git', 'ls-files', '-z']" in manifest_generator
        and "'source_scope': 'git_tracked_release_files'" in manifest_generator
        and 'ROOT.rglob' not in manifest_generator
        and release.get('build_label') == 'Build 437',
        'release manifest is Build 437 and inventories Git-tracked release files only',
    )
    check(
        'release_build' in notes_generator
        and 'production_evidence' in notes_generator
        and "Manifest source scope: `git_tracked_release_files`" in notes_generator
        and 'generate `RELEASE_NOTES.md` first' in notes_generator
        and 'manifest_current' not in notes_generator
        and release.get('authorization_state') == 'membership_production_rebuild_complete_token_spent',
        'release notes use completed Build 437 truth and enforce notes-before-manifest generation order',
    )
    check('Production promotion' in completion_doc and 'CLOSED' in completion_doc and 'Fractional' in completion_doc, 'completion release keeps later families and Production promotion locked')

    print()
    if failures:
        print(f'BUILD 437 CONSOLIDATED MEMBERSHIP RELEASE REGRESSION: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 437 CONSOLIDATED MEMBERSHIP RELEASE REGRESSION: PASS ({checks}/{checks})')
    print('Membership schema authority: CANONICAL + SORT INDEX')
    print('Legacy/canonical read compatibility: PASS')
    print('Canonical write readiness gate: PASS')
    print('Member/admin runtime alignment: PASS')
    print('Stale duplicate Membership endpoint: RETIRED')
    print('DB sanity Membership identity: CANONICAL')
    print('Build 418 SQL-guard compatibility: PASS')
    print('Tracked-file release manifest determinism: PASS')
    print('Notes-before-manifest generation order: PASS')
    print('Completed current-release note authority: PASS')
    print('Membership Production authorization inferred: NO')
    print('Later rebuild authorization inferred: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
