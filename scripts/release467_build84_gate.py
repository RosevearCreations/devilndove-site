#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 84."""
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
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2600:]}")

workflow = read('functions/api/_lib/creatorWorkflow.js')
api = read('functions/api/admin/creator-workflow.js')
client = read('public/js/admin-creator-workflow-v84.js')
page = read('admin/creative-automation/index.html')
css = read('css/admin-creator-workflow-v84.css')
legacy = read('functions/api/admin/creative-automation.js')
legacy_doc = read('CREATIVE_AUTOMATION_STUDIO.md')
private_doc = read('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
doc = read('docs/operations/RELEASE_467_BUILD_84_CREATORS_CAIP_WORKFLOW.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

for token in (
    'CREATOR_WORKFLOW_BUILD = 84',
    "key: 'project'", "key: 'evidence'", "key: 'materials'", "key: 'costs'",
    "key: 'product'", "key: 'content'", "key: 'social_assets'", "key: 'profitability'",
    'Productless Creative Projects remain valid',
    'read_only_projection: true', 'request_time_schema_mutation: false',
    'd1_mutation: false', 'r2_mutation: false', 'raw_media_delete: false',
    'raw_media_public_promotion: false', 'source_file_move: false',
    'inventory_mutation: false', 'accounting_posting: false', 'product_mutation: false',
    'content_mutation: false', 'publication_execution: false', 'provider_execution: false',
    'oauth_execution: false', 'automatic_relationship_write: false',
    'caip_private_media_authority_preserved: true', 'build85_social_oauth_owner_preserved: true',
):
    req(token in workflow, f'Build 84 pure workflow missing token: {token}')
for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\(', r'\bXMLHttpRequest\b'):
    req(not re.search(forbidden, workflow), f'Build 84 pure workflow gained forbidden behavior: {forbidden}')

for token in (
    'onRequestGet', 'project_id is required', 'creative_work_projects',
    'creative_project_evidence_selections', 'creative_project_caip_mirrors',
    'creative_project_material_reviews', 'creative_project_profitability',
    'creative_project_cost_allocations', 'creative_project_inventory_posts',
    'creative_project_content_handoffs', 'content_project_deliverables',
    'authoritative_readback: true', 'read_only_projection: true',
    'request_time_schema_mutation: false', 'd1_mutation: false', 'r2_mutation: false',
):
    req(token in api, f'Build 84 bounded read API missing token: {token}')
req('onRequestPost' not in api, 'Build 84 Creator projection must expose no POST handler')
for forbidden in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in api.upper(), f'Build 84 read endpoint contains forbidden DML/DDL: {forbidden}')

for token in (
    'const BUILD = 84', "const ENDPOINT = '/api/admin/creator-workflow'",
    'creatorWorkflow84Mount', 'MutationObserver', 'selectedProjectId',
    'data-build84-refresh', 'Private/raw media stays protected',
    'Build 85', 'readOnlyProjection: true', 'rawMediaDelete: false',
    'rawMediaPublicPromotion: false', 'oauthExecution: false',
    'providerExecution: false', 'publicationExecution: false',
    'DDCreatorWorkflow84',
):
    req(token in client, f'Build 84 browser workflow missing token: {token}')
req("method: 'POST'" not in client and 'method:"POST"' not in client, 'Build 84 browser workflow must not create a POST lane')
req('setInterval(' not in client, 'Build 84 browser workflow must not poll')
req('queueNotification' not in client and 'processNotificationOutbox' not in client, 'Build 84 browser workflow must not send notifications')

req('data-build84-creator-workflow-mount' in page, 'Build 84 page mount missing')
req('/css/admin-creator-workflow-v84.css?v=46784' in page, 'Build 84 CSS not loaded')
req('/public/js/admin-creator-workflow-v84.js?v=46784' in page, 'Build 84 browser layer not loaded')
req('Release 467 Build 84' in page and 'Creators / CAIP' in page, 'Build 84 page authority label missing')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Creative Automation page must retain exactly one H1')

for token in ('.creator84-stage-grid', '.creator84-boundary', '.creator84-stage-foot', '@media(max-width:700px)', '@media(max-width:460px)'):
    req(token in css, f'Build 84 responsive CSS missing token: {token}')

for token in (
    'seven-stage Creative Automation authority', 'private raw-media intake path',
    'Completed raw originals cannot be overwritten/deleted',
    'Content Studio', 'handoff', 'profitability',
):
    req(token.lower() in legacy_doc.lower(), f'Existing Creative Automation authority missing preserved token: {token}')
for token in ('private', 'raw', 'delete', 'promotion'):
    req(token.lower() in private_doc.lower(), f'Private raw media authority doc missing token: {token}')
for token in (
    "const STAGES=[", "key:'process'", "key:'materials_cost'", "key:'assets_evidence'",
    "key:'content_package'", "key:'channel_review'", 'creative_project_profitability',
    'creative_project_content_handoffs', 'creative_project_caip_mirrors',
):
    req(token in legacy, f'Existing Creative Automation authority unexpectedly lost token: {token}')

for token in (
    'Build 83', '79592977b449fe2eec917541a9df7b35083d311b',
    'nine of nine successful', 'eight-stage', 'Productless projects',
    'private/raw', 'Build 85 — Socials & OAuth Acceptance',
):
    req(token.lower() in doc.lower(), f'Build 84 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 84 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 84 must remain schema-neutral')
req("run_current_contract('scripts/release467_build84_gate.py', 'Release 467 Build 84')" in provenance, 'Current System Gate does not chain Build 84')

for path in (
    'functions/api/_lib/creatorWorkflow.js',
    'functions/api/admin/creator-workflow.js',
    'public/js/admin-creator-workflow-v84.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')
run(['node', 'scripts/release467_build84_creator_workflow_runtime_test.mjs'], 'Build 84 runtime proof')
run(['python3', 'scripts/release467_build83_gate.py'], 'carried Build 83 boundary')

if FAIL:
    print('RELEASE 467 BUILD 84 CREATORS / CAIP WORKFLOW: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 84 CREATORS / CAIP WORKFLOW: PASS')
print('Workflow stages: 8 / PROJECT-TO-PROFITABILITY')
print('Productless projects: SUPPORTED')
print('Private/raw CAIP media: PRESERVED / NO DELETE OR AUTO-PROMOTION')
print('OAuth/provider/publication execution: NONE / BUILD 85 OWNER PRESERVED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
