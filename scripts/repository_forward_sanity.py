#!/usr/bin/env python3
"""Canonical Release 460 current-release and forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0)
req(release.get('environment')=='development' and release.get('branch')=='dev','current release must remain Development/dev')
req(current==460,'current Development release must be 460')
req(release.get('label')=='Secure OAuth Lifecycle & Encrypted Token Authority','Release 460 label drifted')
req(release.get('pages_project')=='devilndove-site-dev' and release.get('release_track')=='single-current-release','Development Pages/release track drifted')
previous=release.get('previous_release',{});req(previous.get('release')==459,'Release 459 must be previous release')
req([x.get('key') for x in release.get('canonical_modules',[])]==['storefront','creators','socials','financials','it-platform'],'canonical module list drifted')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{})
req(infra.get('pages_url')=='https://devilndove-site-dev.pages.dev','Development Pages URL drifted')
req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted')
schema_release=int(d1.get('schema_current_through_release') or 0);req(schema_release in (459,460) or schema_release>460,'Release 460 metadata must show schema 459 pending or 460+ verified')
migration='migrations/dev/20260829_release460_secure_oauth_lifecycle.sql';req(release.get('current_release_migrations')==[migration],'Release 460 must identify exactly its current migration')
db=release.get('current_release_database_state',{});req(db.get('historical_migration_replay') is False,'historical migration replay must remain false')
if schema_release<460:req(db.get('new_migration_required') is True and int(db.get('last_verified_schema_release') or 0)>=459,'pending Release 460 D1 state must carry Release 459 schema checkpoint')
else:req(db.get('new_migration_required') is False and int(db.get('last_verified_schema_release') or 0)>=460,'verified Release 460 D1 state must be closed at 460+')
history={x.get('release'):x for x in release.get('release_history',[])}
r458=history.get(458,{});req(r458.get('state')=='complete_source_proven_no_new_d1_migration' and r458.get('focused_source_gate_run')==33265953249 and r458.get('system_gate_run')==33265953255 and r458.get('exact_head_sha')=='66b48f0445c74247972e14fbdaa0e215e3792fb7' and r458.get('pages_check_run')==99135984965,'Release 458 history proof missing')
req(history.get(459,{}).get('migration')=='migrations/dev/20260829_release459_it_provider_setup_authority.sql','Release 459 history/migration missing')
req(history.get(460,{}).get('migration')==migration,'Release 460 history/migration missing')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed','Production promotion must remain closed');req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed' and policy.get('provider_live_authorization')=='closed','provider execution/publication/live authorization must remain closed');req(policy.get('oauth_remote_operator_switch')=='unset','OAuth remote operator switch must remain unset');req(policy.get('documentation_sync_required') is True,'documentation sync must remain mandatory')
for p in ('functions/api/_lib/oauthSecurity.js','functions/api/_lib/oauthProviders.js','functions/api/admin/oauth-start.js','functions/api/admin/oauth-connections.js','functions/api/social/oauth/_callback.js','functions/api/social/oauth/etsy/callback.js','scripts/release460_secure_oauth_gate.py','scripts/release460_oauth_crypto_proof.mjs',migration,'docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md','.github/workflows/release460-source-gate.yml','.github/workflows/development-d1-release460.yml'):
 req((ROOT/p).exists(),f'Release 460 authority missing: {p}')
for p in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md'):
 req((ROOT/p).exists(),f'canonical Markdown missing: {p}')
wrangler=read('wrangler.toml');req('name = "devilndove-site-dev"' in wrangler and 'database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'wrangler Development authority drifted');req('account_id =' not in wrangler,'wrangler.toml must never contain account_id')
authority=read('functions/api/_lib/releaseAuthority.js');req('CURRENT_RELEASE = 460' in authority and 'Secure OAuth Lifecycle & Encrypted Token Authority' in authority,'shared runtime release authority drifted')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release460_secure_oauth_gate.py' in workflow and 'node scripts/release460_oauth_crypto_proof.mjs' in workflow,'System Gate must validate Release 460')
for gate in ('release459_runtime_acceptance_gate.py','release458_caip_review_handoff_gate.py','release457_financials_operations_gate.py','release456_inventory_tool_workflow_gate.py','release455_storefront_discovery_gate.py','release454_admin_convergence_gate.py','release453_it_provider_readiness_gate.py'):
 req(f'python scripts/{gate}' in workflow,f'System Gate missing carried authority {gate}')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)');future=[]
for p in list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css')):
 for m in version_pattern.finditer(p.read_text(encoding='utf-8',errors='replace')):
  if int(m.group(2))>460:future.append(f'{p.relative_to(ROOT)}:{m.group(2)}')
req(not future,f'future cache majors found: {future[:12]}')
req(len(release.get('release458_batch',[]))==12 and len(release.get('release459_batch',[]))==12 and len(release.get('release460_batch',[]))==12,'carried/current release batch authority incomplete')
print('PLATFORM FORWARD SANITY')
print('Current release: 460 — Secure OAuth Lifecycle & Encrypted Token Authority')
print(f'Development D1 schema authority: {schema_release} ({"pending Release 460 migration" if schema_release<460 else "Release 460+ verified"})')
print('Live provider authorization/execution/publication and separate live Production: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')