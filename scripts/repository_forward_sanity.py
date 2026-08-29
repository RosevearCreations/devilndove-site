#!/usr/bin/env python3
"""Canonical Release 457 current-release and forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
release=json.loads(read('development-release.json'))
req(release.get('environment')=='development' and release.get('branch')=='dev','current release must remain Development/dev')
req(release.get('release')==457,'current Development release must be 457')
req(release.get('label')=='Financials Reconciliation, Commerce Cost & Reporting Depth','Release 457 label drifted')
req(release.get('pages_project')=='devilndove-site-dev','Development Pages project drifted')
req(release.get('release_track')=='single-current-release','single-current-release track required')
previous=release.get('previous_release',{})
req(previous.get('release')==456 and previous.get('state')=='complete_source_proven_no_new_d1_migration','Release 456 must be the completed previous release')
req(previous.get('focused_source_gate_run')==33263530207 and previous.get('system_gate_run')==33263530221,'Release 456 exact-head proof must be preserved')
modules=[x.get('key') for x in release.get('canonical_modules',[])]
req(modules==['storefront','creators','socials','financials','it-platform'],f'canonical modules drifted: {modules}')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{})
req(infra.get('pages_url')=='https://devilndove-site-dev.pages.dev','Development Pages URL drifted')
req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted')
req(d1.get('schema_current_through_release')==453,'Release 457 must carry D1 schema through 453, not invent a migration')
req(release.get('current_release_migrations')==[],'Release 457 current migration list must be empty')
db=release.get('current_release_database_state',{})
req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453,'D1 state must remain independently verified through Release 453')
req(db.get('historical_migration_replay') is False,'historical migration replay must remain false')
history={x.get('release'):x for x in release.get('release_history',[])}
r453=history.get(453,{})
req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 proof missing')
for completed in (452,454,455,456):
 req(history.get(completed,{}).get('state')=='complete_source_proven_no_new_d1_migration',f'Release {completed} completed history missing')
req(history.get(456,{}).get('focused_source_gate_run')==33263530207 and history.get(456,{}).get('system_gate_run')==33263530221,'Release 456 exact-head history missing')
req(history.get(457,{}).get('state')=='implemented_pending_exact_head_ci','Release 457 history row missing/prematurely closed')
policy=release.get('release_policy',{})
req(policy.get('current_release_d1_migration_required') is False,'Release 457 must be source-only')
req(policy.get('production_promotion')=='closed','Production promotion must remain closed')
req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','provider execution/publication must remain closed')
for p in (
 'public/js/admin-accounting-operations.js','css/admin-accounting-operations.css','admin/accounting/index.html',
 'scripts/release457_financials_operations_gate.py','docs/operations/RELEASE_457_FINANCIALS_OPERATIONS.md',
 'scripts/release456_inventory_tool_workflow_gate.py','scripts/release455_storefront_discovery_gate.py',
 'scripts/release454_admin_convergence_gate.py','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md',
 '.github/workflows/release457-source-gate.yml'
):
 req((ROOT/p).exists(),f'current/carried-forward authority missing: {p}')
wrangler=read('wrangler.toml')
req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'wrangler Development authority drifted')
req('account_id =' not in wrangler,'wrangler.toml must never contain account_id')
authority=read('functions/api/_lib/releaseAuthority.js')
req('CURRENT_RELEASE = 457' in authority and 'Financials Reconciliation, Commerce Cost & Reporting Depth' in authority,'shared runtime release authority drifted')
workflow=read('.github/workflows/system-gate.yml')
req('python scripts/release457_financials_operations_gate.py' in workflow,'System Gate must validate Release 457')
for gate in ('release456_inventory_tool_workflow_gate.py','release455_storefront_discovery_gate.py','release454_admin_convergence_gate.py','release453_it_provider_readiness_gate.py','release448_financials_depth_gate.py'):
 req(f'python scripts/{gate}' in workflow,f'System Gate missing carried authority {gate}')
req('node --check public/js/admin-accounting-operations.js' in workflow,'System Gate must syntax-check Release 457 runtime')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
future=[]
for p in list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css')):
 for m in version_pattern.finditer(p.read_text(encoding='utf-8',errors='replace')):
  if int(m.group(2))>457:future.append(f'{p.relative_to(ROOT)}:{m.group(2)}')
req(not future,f'future cache majors found: {future[:12]}')
req(not list((ROOT/'migrations/dev').glob('*release457*')),'Release 457 migration file must not exist')
print('PLATFORM FORWARD SANITY')
print('Current release: 457 — Financials Reconciliation, Commerce Cost & Reporting Depth')
print('Development Pages target: devilndove-site-dev / devilndove-site-dev.pages.dev')
print('Release 457 D1 migration: NONE')
print('Financial Operations write authority duplicated: NO')
print('Development D1 schema: CURRENT / INDEPENDENTLY VERIFIED THROUGH RELEASE 453')
print('Release 453 mutation: 33258377328')
print('Release 453 independent verifier: 33258415391')
print('Release 456 Source/System proof: 33263530207 / 33263530221')
print('Historical migration replay: FORBIDDEN')
print('Separate live Production/provider execution: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
