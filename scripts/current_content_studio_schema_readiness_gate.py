#!/usr/bin/env python3
"""Fail-closed Release 467 Build 51 Content Studio schema-readiness authority gate."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, message):
    if not ok:
        FAIL.append(message)


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def load(path):
    return json.loads(read(path))


authority = load('release467-build51-content-studio-schema-readiness.json')
content_route = read('functions/api/admin/content-studio.js')
bridge_route = read('functions/api/admin/product-content-bridge.js')
readiness = read('functions/api/_lib/contentAutomationSchemaReadiness.js')

req(authority.get('release') == 467 and authority.get('build') == 51, 'Build 51 release authority identity is wrong')
base = authority.get('source_base') or {}
req(base.get('dev_sha') == 'd14e41cf4c1b0c12ce597f6fe3ab05d74901a0fa', 'Build 51 must ingest exact Build 50 final dev SHA')
req(base.get('tree_sha') == 'c01d433a0434e893a8b21d9ffded8587732f9a32', 'Build 51 must ingest exact Build 50 final tree SHA')
proofs = base.get('proofs') or {}
req(proofs.get('system_gate_run') == 33931172444, 'Build 51 source base missing final Build 50 System Gate')
req(proofs.get('current_application_quality_run') == 33931172515, 'Build 51 source base missing final Build 50 quality proof')
req(proofs.get('it_admin_runtime_proof_run') == 33931172403, 'Build 51 source base missing final Build 50 I.T. proof')
req(proofs.get('branch_hygiene_run') == 33931172411, 'Build 51 source base missing final Build 50 branch hygiene proof')
req(base.get('proof_state') == 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN', 'Build 51 source base must be exact-head four-proof GREEN')
req(authority.get('canonical_d1_migration_count') == 4, 'Build 51 must keep canonical D1 migration count at four')

for text, label in ((content_route, 'Content Studio'), (bridge_route, 'Product Content bridge')):
    req("from '../_lib/contentAutomationSchemaReadiness.js'" in text, f'{label} must import the explicit schema-readiness authority')
    req('requireContentAutomationSchema' in text, f'{label} must require Content Studio schema readiness')
    req('ensureContentAutomationSchema' not in text, f'{label} must not use the ambiguous legacy ensure alias')
    req(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', text, re.I), f'{label} must contain no request-time schema DDL')

req('export async function requireContentAutomationSchema' in readiness, 'readiness authority must export requireContentAutomationSchema')
req('PRAGMA table_info' in readiness and 'PRAGMA index_list' in readiness, 'readiness authority must verify table and index shape read-only')
req(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', readiness, re.I), 'schema-readiness authority must remain read-only')
req('Apply the current Development migration authority.' in readiness, 'schema-readiness failure must direct operators to the migration authority')

scope = authority.get('scope') or {}
for key in ('request_time_ddl_authorized', 'schema_change_authorized', 'canonical_migration_added', 'renderer_execution_authorized', 'provider_execution_authorized', 'publication_authorized', 'social_queue_authorized', 'r2_mutation_authorized', 'main_mutation_authorized', 'production_mutation_authorized'):
    req(scope.get(key) is False, f'Build 51 boundary must keep {key}=false')

if FAIL:
    print('CURRENT CONTENT STUDIO SCHEMA READINESS GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT CONTENT STUDIO SCHEMA READINESS GATE: PASS')
