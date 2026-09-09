#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 83."""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def req(ok, message):
    if not ok:
        FAIL.append(message)


def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2400:]}")


workflow = read('public/js/modules/packaging/release-workflow-v83.mjs')
client = read('public/js/admin-packaging-release-workflow-v83.js')
compat = read('public/js/admin-packaging-compatibility-v301.js')
css = read('css/admin-packaging-release-workflow-v83.css')
read_service = read('functions/api/_lib/packagingReadService.js')
production = read('functions/api/admin/packaging-label-production.js')
doc = read('docs/operations/RELEASE_467_BUILD_83_LABELING_PACKAGING_STUDIO.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

for token in (
    'PACKAGING_RELEASE_WORKFLOW_BUILD = 83',
    "'template'", "'content'", "'components'", "'artwork'",
    "'proof'", "'approval'", "'export'", "'reprint'",
    "read_only_projection: true",
    "request_time_schema_mutation: false",
    "d1_mutation: false",
    "r2_mutation: false",
    "print_execution: false",
    "export_execution: false",
    "reprint_execution: false",
    "publication_execution: false",
    "provider_execution: false",
    "existing_packaging_write_authority_preserved: true",
    "existing_build44_production_lane_preserved: true",
):
    req(token in workflow, f'Build 83 pure workflow missing token: {token}')
for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\(', r'\bXMLHttpRequest\b'):
    req(not re.search(forbidden, workflow), f'Build 83 pure workflow gained forbidden behavior: {forbidden}')

for token in (
    "const BUILD = 83",
    "/public/js/modules/packaging/release-workflow-v83.mjs?v=46783",
    "/css/admin-packaging-release-workflow-v83.css?v=46783",
    "DDPackagingClient",
    "client.request(null, projectId)",
    "data-build83-refresh",
    "data-build83-production",
    "DDPackagingLabelProduction",
    "dd:packaging-release-workflow-active",
    "readOnlyProjection: true",
    "printExecution: false",
    "exportExecution: false",
    "publicationExecution: false",
    "providerExecution: false",
    "build44ProductionOwnerPreserved: true",
):
    req(token in client, f'Build 83 browser workflow missing token: {token}')
req('setInterval(' not in client, 'Build 83 browser workflow must not poll')
req("method: 'POST'" not in client and 'method:"POST"' not in client, 'Build 83 browser workflow must not create a POST/write lane')
req('button.click()' not in client, 'Build 83 must not trigger production printing itself')

for token in (
    'const RELEASE_WORKFLOW_BUILD = 83',
    '/public/js/admin-packaging-release-workflow-v83.js?v=46783',
    'loadReleaseWorkflow',
    'LABEL_PRODUCTION_BUILD,loadReleaseWorkflow',
    'releaseWorkflowBuild',
    'releaseWorkflowOverallStatus',
    "'dd:packaging-release-workflow-active'",
):
    req(token in compat, f'Packaging 301 compatibility loader missing Build 83 token: {token}')

for token in (
    '.packaging-release-stage-grid',
    '.packaging-release-evidence',
    '.packaging-release-actions',
    '@media(max-width:700px)',
    '@media(max-width:460px)',
):
    req(token in css, f'Build 83 responsive CSS missing token: {token}')

for token in (
    'packaging_project_versions',
    'packaging_export_history',
    'soap_label_print_tests',
    'packaging_components',
    'component_summary',
    'preflight',
):
    req(token in read_service, f'Existing Packaging read authority missing Build 83 evidence source: {token}')

for token in (
    "version_review_status: 'approved'",
    'immutable_svg_required: true',
    "physical_qa_status: 'passed'",
    'printer_scale_percent: 100',
    'd1_mutation: false',
    'r2_mutation: false',
    'authoritative_readback: true',
):
    req(token in production, f'Build 44 production/reuse owner missing preserved token: {token}')
req('onRequestPost' not in production, 'Build 44 production/reuse endpoint must remain read-only')

for token in (
    'Build 82 — Orders / Fulfilment Workflow',
    'a3520373fb4b53f1f00b98b4082c096bab09edc2',
    'nine of nine successful',
    'eight-stage',
    'Build 44',
    'exact 100% scale',
    'no',
    'Build 84 — Creators / CAIP Workflow',
):
    req(token.lower() in doc.lower(), f'Build 83 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 83 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 83 must remain schema-neutral')
req("run_current_contract('scripts/release467_build83_gate.py', 'Release 467 Build 83')" in provenance, 'Current System Gate does not chain Build 83')

for path in (
    'public/js/modules/packaging/release-workflow-v83.mjs',
    'public/js/admin-packaging-release-workflow-v83.js',
    'public/js/admin-packaging-compatibility-v301.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')

run(['node', 'scripts/release467_build83_packaging_runtime_test.mjs'], 'Build 83 runtime proof')
run(['python3', 'scripts/current_packaging_safe_area_gate.py'], 'Build 41 safe-area contract')
run(['python3', 'scripts/current_packaging_material_intelligence_gate.py'], 'Build 42 material intelligence contract')
run(['python3', 'scripts/current_packaging_label_composition_gate.py'], 'Build 43 label composition contract')
run(['python3', 'scripts/current_packaging_label_production_gate.py'], 'Build 44 production/reuse contract')
run(['python3', 'scripts/release467_build82_gate.py'], 'carried Build 82 boundary')

if FAIL:
    print('RELEASE 467 BUILD 83 LABELING & PACKAGING STUDIO: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 83 LABELING & PACKAGING STUDIO: PASS')
print('Workflow stages: 8 / TEMPLATE-TO-REPRINT')
print('Packaging 301 + Builds 41-44: PRESERVED')
print('Production/reprint owner: BUILD 44 / PRESERVED')
print('Automatic write/print/export/publication/provider execution: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
