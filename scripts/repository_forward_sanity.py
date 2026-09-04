#!/usr/bin/env python3
"""Current Devil n Dove platform forward sanity.

This gate validates current operating authorities and safety boundaries. Historical
release/build evidence may remain in source history, but numbered proof workflows are
not current runtime requirements.
"""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
CANONICAL=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file():FAIL.append(f'missing current authority: {path}');return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    raw=read(path)
    try:return json.loads(raw) if raw else {}
    except Exception as error:FAIL.append(f'invalid JSON {path}: {error}');return {}

current=load('current-development-authority.json')
env=load('release463-environment.json')
manifest=load('migrations/canonical/manifest.json')
release=load('development-release.json')

req(int(current.get('release') or 0)==467,'current application pointer must remain Release 467')
req(int(current.get('build') or 0)>=31,'current application pointer must be Build 31 or newer during Build 32 convergence')
req(current.get('source_authority')=='dev','current source authority must remain dev')
req(current.get('schema_change_authorized') is False,'current source pointer must not authorize an unreviewed schema change')
req(current.get('d1_mutation_authorized') is False,'current source pointer must not authorize Development business-data mutation')
req(current.get('r2_mutation_authorized') is False,'current source pointer must not authorize R2 mutation')
req(current.get('provider_execution_authorized') is False and current.get('provider_publication_authorized') is False,'provider execution/publication must remain closed')

req(int(env.get('environment_release') or 0)==463,'environment consolidation authority must remain Release 463')
req(env.get('canonical_pages_project')=='devilndove-site','canonical Pages project must remain devilndove-site')
req((env.get('native_git_deployments') or {}).get('enabled') is False,'native Git-triggered Pages deployment must remain frozen')

req([x.get('file') for x in manifest.get('migrations',[])]==CANONICAL,'canonical migration manifest must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'no unapproved canonical migration 0005 may appear in this source-only build')
wrangler=read('wrangler.toml')
req('database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'tracked Wrangler must remain bound to Development D1')
req('migrations_dir = "migrations/canonical"' in wrangler,'tracked Wrangler must use the canonical migration directory')
req('f34a741b-0000-45b0-9a96-6be08754d563' not in wrangler,'tracked Wrangler must not contain Production D1 identity')
req('account_id =' not in wrangler,'tracked Wrangler must not pin Cloudflare account identity')

policy=release.get('release_policy') or {}
req(policy.get('production_promotion')=='exact_green_development_tree_only','Production promotion must remain exact-green-Development-tree only')
req(policy.get('main_only_application_patches') is False,'main-only application patches must remain forbidden')
req(policy.get('production_transactional_data_owned_by_production') is True,'Production must own Production transactional data')
req(policy.get('blind_dev_to_production_data_overwrite') is False,'blind Development-to-Production data overwrite must remain forbidden')
req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','provider execution/publication must remain closed by policy')

for path in (
    '.github/workflows/system-gate.yml',
    '.github/workflows/current-application-quality.yml',
    '.github/workflows/it-admin-runtime-proof.yml',
    '.github/workflows/development-runtime-acceptance.yml',
    '.github/workflows/production-pages-deploy-current.yml',
    '.github/workflows/production-rollback-readiness.yml',
    '.github/workflows/repository-branch-hygiene.yml',
    'scripts/d1_migrate.py',
    'scripts/migration_policy_gate.py',
    'scripts/runtime_schema_mutation_gate.py',
    'scripts/repository_hygiene_gate.py',
    'scripts/current_application_quality_gate.py',
    'admin/help/index.html',
    'data/admin-navigation-modules.json',
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'SANITY_HEALTH_CHECK.md',
): req((ROOT/path).is_file(),f'current authority missing: {path}')

nav=load('data/admin-navigation-modules.json')
req('release' not in nav and 'build' not in nav,'active navigation metadata must be release/build neutral')
req('/admin/help/' in read('data/admin-navigation-modules.json'),'current Online Help Centre must remain in active navigation')

print('PLATFORM FORWARD SANITY')
print(f"Current pointer: Release {current.get('release')} / Build {current.get('build')}")
print('Canonical D1: 0001-0004 only')
print('Active workflows/navigation/help: RELEASE-NEUTRAL')
print('Production promotion: EXACT GREEN DEVELOPMENT TREE ONLY')
print('Production business data ownership: PRESERVED')
print('Provider execution/publication: CLOSED')
if FAIL:
    for i,msg in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {msg}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
