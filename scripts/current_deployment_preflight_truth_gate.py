#!/usr/bin/env python3
"""Release-neutral guard for the active Deployment Preflight surface."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


def read(path):
    target = ROOT / path
    if not target.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return target.read_text(encoding='utf-8', errors='replace')


def load(path):
    try:
        return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:
        FAIL.append(f'invalid JSON {path}: {exc}')
        return {}


pointer = load('current-development-authority.json')
manifest = load('migrations/canonical/manifest.json')
page = read('admin/deployment-preflight/index.html')
client = read('public/js/admin-current-deployment-preflight.js')
current = read('functions/api/admin/current-deployment-preflight.js')
compat = read('functions/api/admin/deployment-preflight.js')
historical = read('functions/api/admin/_historicalDeploymentPreflight.js')
legacy_client = read('public/js/admin-deployment-preflight.js')

pointer_release = int(pointer.get('release') or 0)
pointer_build = int(pointer.get('build') or 0)
release_match = re.search(r'const RELEASE\s*=\s*(\d+)', current)
build_match = re.search(r'const BUILD\s*=\s*(\d+)', current)
active_release = int(release_match.group(1)) if release_match else 0
active_build = int(build_match.group(1)) if build_match else 0

req(pointer_release == 467, 'current Development pointer must remain Release 467')
req(active_release == pointer_release, 'Deployment Preflight release must match current Development release')
req(active_build in (pointer_build, pointer_build + 1), 'Deployment Preflight build must be current pointer build or the in-flight next build')
req(active_build >= pointer_build, 'Deployment Preflight may never lag current Development')
req(active_build == 39, 'Build 39 Deployment Preflight identity is missing')

migrations = manifest.get('migrations') if isinstance(manifest.get('migrations'), list) else []
canonical_files = [str(row.get('file') or '') for row in migrations if isinstance(row, dict)]
req(manifest.get('stream') == 'devilndove-canonical-forward', 'canonical migration stream drifted')
req(canonical_files == [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
], 'Build 39 expects the current four-file canonical migration stream')
for filename in canonical_files:
    req(filename in current, f'current Deployment Preflight missing canonical migration: {filename}')

for stale in (
    'database_upgrade_current_pass.sql',
    'database_build171_ledger_repair.sql',
    'database_build173_deployment_preflight.sql',
    'database_build174_deployment_preflight_detail.sql',
    'database_build175_release_control.sql',
    'database_build176_release_safety_controls.sql',
    'build_171_admin_safety_release_readiness',
    'build_173_deployment_preflight_release_safety',
    'build_174_preflight_detail_manifest',
    'build_175_release_control_center',
    'build_176_release_safety_controls',
):
    req(stale not in current, f'current Deployment Preflight still contains historical migration authority: {stale}')

for ddl in (
    'CREATE TABLE', 'CREATE INDEX', 'CREATE TRIGGER', 'CREATE VIEW',
    'ALTER TABLE', 'DROP TABLE', 'DROP INDEX', 'DROP TRIGGER', 'DROP VIEW',
    'VACUUM', 'REINDEX',
):
    req(ddl not in current.upper(), f'current Deployment Preflight endpoint carries request-time DDL token: {ddl}')
    req(ddl not in compat.upper(), f'Deployment Preflight compatibility route carries request-time DDL token: {ddl}')

req('export async function onRequestGet' in current, 'current Deployment Preflight must expose GET')
for method in ('onRequestPost', 'onRequestPut', 'onRequestPatch', 'onRequestDelete'):
    req(method not in current, f'current Deployment Preflight must remain GET-only ({method} found)')
req("mutation_capability: 'none'" in current, 'current Deployment Preflight must explicitly expose no mutation capability')
req('request_time_schema_mutation: false' in current, 'request-time schema mutation boundary missing')
req("manifest_path: 'migrations/canonical/manifest.json'" in current, 'canonical manifest authority missing from current endpoint')
req("applicator: 'scripts/d1_migrate.py'" in current, 'canonical migration applicator authority missing')
req("native_ledger: 'd1_migrations'" in current, 'native d1_migrations authority missing')
req("proof_table: 'app_schema_migration_proofs'" in current, 'canonical migration proof-table authority missing')
req('PRAGMA foreign_key_check' in current, 'foreign-key integrity check missing')
for proof in ('System Gate', 'Current Application Quality Proof', 'I.T. Admin Runtime Proof', 'Repository Branch Hygiene'):
    req(proof in current, f'four-proof Development promotion requirement missing: {proof}')
req('816490a9f36ffc2a730d8149549e5a2fbd609966' in current, 'Build 32 Production baseline SHA missing')
req("historical_feature_authority: 'release467-build37-deployment-preflight-canonical-migration.json'" in current, 'Build 37 Deployment Preflight feature provenance must remain explicit')

req('getCurrentDeploymentPreflight' in compat and "from './current-deployment-preflight.js'" in compat, 'compatibility GET route must delegate to current Deployment Preflight')
req('export async function onRequestPost' in compat and '405' in compat and "Allow: 'GET'" in compat, 'historical Deployment Preflight POST must fail closed with 405')
req("mutation_capability: 'none'" in compat, 'compatibility route must expose no mutation capability')

req("const BUILD_LABEL = 'Build 176'" in historical, 'historical Deployment Preflight provenance identity drifted')
req('ensurePreflightTables' in historical and 'CREATE TABLE IF NOT EXISTS deployment_preflight_runs' in historical, 'historical preflight implementation must remain preserved as non-route provenance')
req('_historicalDeploymentPreflight.js' in current, 'current endpoint must explicitly delegate historical diagnostics through non-route helper')
req('/api/admin/deployment-preflight' in legacy_client, 'historical Deployment Preflight client provenance drifted')

req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Deployment Preflight page must contain exactly one H1')
req('Release 467 Build 39' in page, 'Deployment Preflight page Build 39 identity missing')
req('read-only' in page.lower(), 'Deployment Preflight page must explain read-only boundary')
req('migrations/canonical/manifest.json' in page and 'scripts/d1_migrate.py' in page, 'page must expose canonical migration authority')
req('/public/js/admin-current-deployment-preflight.js' in page, 'page must load current Deployment Preflight client')
req('/public/js/admin-deployment-preflight.js' not in page, 'page must not load historical writable client')
req('saveDeploymentPreflightButton' not in page and 'Save Snapshot' not in page, 'active page must not expose historical snapshot writes')

req('/api/admin/current-deployment-preflight' in client, 'current client must call current Deployment Preflight endpoint')
req('/api/admin/deployment-preflight' not in client, 'current client must not call historical compatibility endpoint')
req("method: 'POST'" not in client and 'method:"POST"' not in client, 'current client must not POST')
for stale_label in ('Build 175', 'Build 176', 'build-174'):
    req(stale_label not in client, f'current client contains stale build label: {stale_label}')
req('Run Preflight' in page and 'Export Markdown' in page, 'current read-only controls missing')

if FAIL:
    print('CURRENT DEPLOYMENT PREFLIGHT TRUTH GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT DEPLOYMENT PREFLIGHT TRUTH GATE: PASS')
print('Active Deployment Preflight: RELEASE 467 BUILD 39 READ-ONLY')
print('Historical feature authority: RELEASE 467 BUILD 37')
print('Canonical D1 authority: migrations/canonical + scripts/d1_migrate.py')
print('Historical build-numbered SQL: PROVENANCE ONLY')
print('Active request-time DDL: ZERO')
print('Historical preflight POST: FAIL-CLOSED 405')
