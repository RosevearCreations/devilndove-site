#!/usr/bin/env python3
"""Canonical Release 459 current-release and forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0)
req(release.get('environment')=='development' and release.get('branch')=='dev','current release must remain Development/dev')
req(current==459,'current Development release must be 459')
req(release.get('label')=='Authenticated Development Acceptance & Provider Setup Authority','Release 459 label drifted')
req(release.get('pages_project')=='devilndove-site-dev' and release.get('release_track')=='single-current-release','Development Pages/release track drifted')
previous=release.get('previous_release',{})
req(previous.get('release')==458 and previous.get('state')=='complete_source_proven_no_new_d1_migration','Release 458 must be completed previous release')
req(previous.get('focused_source_gate_run')==33265953249 and previous.get('system_gate_run')==33265953255 and previous.get('exact_head_sha')=='66b48f0445c74247972e14fbdaa0e215e3792fb7' and previous.get('pages_check_run')==99135984965,'Release 458 exact-head Source/System/Pages proof must be preserved')
req([x.get('key') for x in release.get('canonical_modules',[])]==['storefront','creators','socials','financials','it-platform'],'canonical module list drifted')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{})
req(infra.get('pages_url')=='https://devilndove-site-dev.pages.dev','Development Pages URL drifted')
req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted')
schema_release=int(d1.get('schema_current_through_release') or 0);req(schema_release in (453,459) or schema_release>459,'Release 459 metadata must show schema 453 pending or 459+ verified')
migration='migrations/dev/20260829_release459_it_provider_setup_authority.sql'
req(release.get('current_release_migrations')==[migration],'Release 459 must identify exactly its current migration')
db=release.get('current_release_database_state',{});req(db.get('historical_migration_replay') is False,'historical migration replay must remain false')
if schema_release<459:
 req(db.get('new_migration_required') is True and int(db.get('last_verified_schema_release') or 0)==453,'pending Release 459 D1 state must carry independent schema proof through 453')
else:
 req(db.get('new_migration_required') is False and int(db.get('last_verified_schema_release') or 0)>=459,'verified Release 459 D1 state must be closed at 459+')
history={x.get('release'):x for x in release.get('release_history',[])}
r453=history.get(453,{});req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 proof missing')
r458=history.get(458,{});req(r458.get('state')=='complete_source_proven_no_new_d1_migration' and r458.get('focused_source_gate_run')==33265953249 and r458.get('system_gate_run')==33265953255 and r458.get('exact_head_sha')=='66b48f0445c74247972e14fbdaa0e215e3792fb7' and r458.get('pages_check_run')==99135984965,'Release 458 history proof missing')
req(history.get(459,{}).get('migration')==migration,'Release 459 history row/migration missing')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed','Production promotion must remain closed');req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','provider execution/publication must remain closed');req(policy.get('documentation_sync_required') is True,'documentation sync must remain mandatory')
for p in ('functions/api/admin/it-provider-setup-guide.js','public/js/admin-it-provider-setup-guide.js','css/it-provider-setup-guide.css','admin/it-integrations/index.html','admin/runtime-acceptance/index.html','public/js/admin-runtime-acceptance.js','css/runtime-acceptance.css','scripts/development_runtime_acceptance.py','scripts/release459_runtime_acceptance_gate.py',migration,'docs/operations/RELEASE_459_RUNTIME_PROVIDER_AUTHORITY.md','.github/workflows/release459-source-gate.yml','.github/workflows/development-d1-release459.yml','.github/workflows/release459-remote-verification.yml'):
 req((ROOT/p).exists(),f'Release 459 authority missing: {p}')
for p in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','docs/operations/RELEASE_459_RUNTIME_PROVIDER_AUTHORITY.md'):
 req('Release 459' in read(p),f'{p} must identify Release 459')
wrangler=read('wrangler.toml');req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'wrangler Development authority drifted');req('account_id =' not in wrangler,'wrangler.toml must never contain account_id')
authority=read('functions/api/_lib/releaseAuthority.js');req('CURRENT_RELEASE = 459' in authority and 'Authenticated Development Acceptance & Provider Setup Authority' in authority,'shared runtime release authority drifted')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release459_runtime_acceptance_gate.py' in workflow,'System Gate must validate Release 459')
for gate in ('release458_caip_review_handoff_gate.py','release457_financials_operations_gate.py','release456_inventory_tool_workflow_gate.py','release455_storefront_discovery_gate.py','release454_admin_convergence_gate.py','release453_it_provider_readiness_gate.py'):
 req(f'python scripts/{gate}' in workflow,f'System Gate missing carried authority {gate}')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)');future=[]
for p in list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css')):
 for m in version_pattern.finditer(p.read_text(encoding='utf-8',errors='replace')):
  if int(m.group(2))>459:future.append(f'{p.relative_to(ROOT)}:{m.group(2)}')
req(not future,f'future cache majors found: {future[:12]}')
req(not list((ROOT/'migrations/dev').glob('*release458*')),'Release 458 migration file must not exist')
print('PLATFORM FORWARD SANITY')
print('Current release: 459 — Authenticated Development Acceptance & Provider Setup Authority')
print(f'Development D1 schema authority: {schema_release} ({"pending Release 459 migration" if schema_release<459 else "Release 459+ verified"})')
print('Provider execution/publication and separate live Production: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
