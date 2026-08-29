#!/usr/bin/env python3
"""Canonical Release 454 current-release and forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
release=json.loads(read('development-release.json'));req(release.get('environment')=='development' and release.get('branch')=='dev','current release must remain Development/dev');req(release.get('release')==454,'current Development release must be 454');req(release.get('label')=='Admin Navigation, State & Responsive Convergence','Release 454 label drifted');req(release.get('pages_project')=='devilndove-site-dev','Development Pages project drifted');req(release.get('release_track')=='single-current-release','single-current-release track required')
previous=release.get('previous_release',{});req(previous.get('release')==453 and str(previous.get('state','')).startswith('complete_'),'Release 453 must be the completed previous release')
modules=[x.get('key') for x in release.get('canonical_modules',[])];req(modules==['storefront','creators','socials','financials','it-platform'],f'canonical modules drifted: {modules}')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{});req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted');req(d1.get('schema_current_through_release')==453,'Release 454 must carry D1 schema through 453, not invent a 454 migration');req(release.get('current_release_migrations')==[],'Release 454 current migration list must be empty');db=release.get('current_release_database_state',{});req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453,'D1 state must remain independently verified through Release 453');req(db.get('historical_migration_replay') is False,'historical migration replay must remain false')
history={x.get('release'):x for x in release.get('release_history',[])};r453=history.get(453,{});req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 proof missing');req(454 in history,'Release 454 history row missing')
policy=release.get('release_policy',{});req(policy.get('current_release_d1_migration_required') is False,'Release 454 must be source-only');req(policy.get('production_promotion')=='closed','Production promotion must remain closed');req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','provider execution/publication must remain closed')
for p in ('public/js/admin-module-nav.js','public/js/admin-workspace-state.js','css/admin-convergence.css','scripts/release454_admin_convergence_gate.py','docs/operations/RELEASE_454_ADMIN_CONVERGENCE.md','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','.github/workflows/release454-source-gate.yml'):
 req((ROOT/p).exists(),f'Release 454 authority missing: {p}')
for p in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','docs/operations/RELEASE_454_ADMIN_CONVERGENCE.md'):
 t=read(p);req('Release 454' in t,f'{p} must identify Release 454');req('Release 453' in t and '33258377328' in t and '33258415391' in t,f'{p} must preserve Release 453 D1 evidence')
wrangler=read('wrangler.toml');req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'wrangler Development authority drifted');req('account_id =' not in wrangler,'wrangler.toml must never contain account_id')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release454_admin_convergence_gate.py' in workflow,'System Gate must validate Release 454');req('python scripts/release453_it_provider_readiness_gate.py' in workflow,'System Gate must carry Release 453 forward');req('node --check public/js/admin-module-nav.js' in workflow and 'node --check public/js/admin-workspace-state.js' in workflow,'System Gate must syntax-check Release 454 runtime')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=[\"\'&#\s)]|$)');future=[]
for p in list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css')):
 for m in version_pattern.finditer(p.read_text(encoding='utf-8',errors='replace')):
  if int(m.group(2))>454:future.append(f'{p.relative_to(ROOT)}:{m.group(2)}')
req(not future,f'future cache majors found: {future[:12]}')
print('PLATFORM FORWARD SANITY');print('Current release: 454 — Admin Navigation, State & Responsive Convergence');print('Development D1 migration for Release 454: NONE');print('Development D1 schema: CURRENT / INDEPENDENTLY VERIFIED THROUGH RELEASE 453');print('Release 453 mutation: 33258377328');print('Release 453 independent verifier: 33258415391');print('Historical migration replay: FORBIDDEN');print('Production/provider execution: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
