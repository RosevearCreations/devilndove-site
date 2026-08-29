#!/usr/bin/env python3
"""Canonical Release 456 current-release and forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
release=json.loads(read('development-release.json'))
req(release.get('environment')=='development' and release.get('branch')=='dev','current release must remain Development/dev')
req(release.get('release')==456,'current Development release must be 456')
req(release.get('label')=='Inventory & Tool Operational Workflow Depth','Release 456 label drifted')
req(release.get('pages_project')=='devilndove-site-dev','Development Pages project drifted')
req(release.get('release_track')=='single-current-release','single-current-release track required')
previous=release.get('previous_release',{})
req(previous.get('release')==455 and str(previous.get('state','')).startswith('complete_'),'Release 455 must be the completed previous release')
modules=[x.get('key') for x in release.get('canonical_modules',[])]
req(modules==['storefront','creators','socials','financials','it-platform'],f'canonical modules drifted: {modules}')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{})
req(infra.get('pages_url')=='https://devilndove-site-dev.pages.dev','Development Pages URL drifted')
req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted')
req(d1.get('schema_current_through_release')==453,'Release 456 must carry D1 schema through 453, not invent a Release 456 migration')
req(release.get('current_release_migrations')==[],'Release 456 current migration list must be empty')
db=release.get('current_release_database_state',{})
req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453,'D1 state must remain independently verified through Release 453')
req(db.get('historical_migration_replay') is False,'historical migration replay must remain false')
history={x.get('release'):x for x in release.get('release_history',[])}
r453=history.get(453,{})
req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 proof missing')
for completed in (452,454,455):req(history.get(completed,{}).get('state')=='complete_source_proven_no_new_d1_migration',f'Release {completed} completed history missing')
req(history.get(456,{}).get('state')=='implemented_pending_exact_head_ci','Release 456 history row missing/prematurely closed')
policy=release.get('release_policy',{})
req(policy.get('current_release_d1_migration_required') is False,'Release 456 must be source-only')
req(policy.get('production_promotion')=='closed','Production promotion must remain closed')
req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','provider execution/publication must remain closed')
for p in ('functions/api/admin/inventory-intelligence.js','functions/api/admin/tool-lifecycle.js','public/js/admin-inventory-intelligence.js','public/js/admin-tool-lifecycle.js','admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html','scripts/release456_inventory_tool_workflow_gate.py','docs/operations/RELEASE_456_INVENTORY_TOOL_WORKFLOW.md','scripts/release455_storefront_discovery_gate.py','docs/operations/RELEASE_455_STOREFRONT_DISCOVERY.md','scripts/release454_admin_convergence_gate.py','docs/operations/RELEASE_454_ADMIN_CONVERGENCE.md','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','.github/workflows/release456-source-gate.yml'):
 req((ROOT/p).exists(),f'current/carried-forward authority missing: {p}')
for p in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','docs/operations/RELEASE_456_INVENTORY_TOOL_WORKFLOW.md'):
 t=read(p);req('Release 456' in t,f'{p} must identify Release 456');req('Release 453' in t and '33258377328' in t and '33258415391' in t,f'{p} must preserve Release 453 D1 evidence')
wrangler=read('wrangler.toml')
req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'wrangler Development authority drifted')
req('account_id =' not in wrangler,'wrangler.toml must never contain account_id')
authority=read('functions/api/_lib/releaseAuthority.js')
req('CURRENT_RELEASE = 456' in authority and 'Inventory & Tool Operational Workflow Depth' in authority,'shared runtime release authority drifted')
workflow=read('.github/workflows/system-gate.yml')
req('python scripts/release456_inventory_tool_workflow_gate.py' in workflow,'System Gate must validate Release 456')
req('python scripts/release455_storefront_discovery_gate.py' in workflow,'System Gate must carry Release 455 forward')
req('python scripts/release454_admin_convergence_gate.py' in workflow,'System Gate must carry Release 454 forward')
req('python scripts/release453_it_provider_readiness_gate.py' in workflow,'System Gate must carry Release 453 forward')
req('node --check functions/api/admin/inventory-intelligence.js' in workflow and 'node --check functions/api/admin/tool-lifecycle.js' in workflow,'System Gate must syntax-check Release 456 APIs')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
future=[]
for p in list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css')):
 for m in version_pattern.finditer(p.read_text(encoding='utf-8',errors='replace')):
  if int(m.group(2))>456:future.append(f'{p.relative_to(ROOT)}:{m.group(2)}')
req(not future,f'future cache majors found: {future[:12]}')
req(not list((ROOT/'migrations/dev').glob('*release456*')),'Release 456 migration file must not exist')
print('PLATFORM FORWARD SANITY')
print('Current release: 456 — Inventory & Tool Operational Workflow Depth')
print('Development Pages target: devilndove-site-dev / devilndove-site-dev.pages.dev')
print('Release 456 D1 migration: NONE')
print('Development D1 schema: CURRENT / INDEPENDENTLY VERIFIED THROUGH RELEASE 453')
print('Release 453 mutation: 33258377328')
print('Release 453 independent verifier: 33258415391')
print('Tool lifecycle authority: inventory_tool_lifecycle_profiles/events')
print('Historical migration replay: FORBIDDEN')
print('Separate live Production/provider execution: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
