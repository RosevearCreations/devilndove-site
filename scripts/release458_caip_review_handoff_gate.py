#!/usr/bin/env python3
"""Release 458 source gate for CAIP private-media/evidence readiness and reviewed Content Studio handoff depth."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path):
 p=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True)
 req(p.returncode==0,f'carried-forward gate failed: {path}\n{p.stdout}\n{p.stderr}')
OPS='public/js/admin-caip-operations.js';CSS='css/caip-operations.css';ASSETS='admin/creative-assets/index.html';HANDOFF='admin/caip-content-handoff/index.html';HANDOFF_JS='public/js/admin-caip-content-handoff.js';HANDOFF_API='functions/api/admin/caip-content-handoff.js'
for p in (OPS,CSS,ASSETS,HANDOFF,HANDOFF_JS,HANDOFF_API,'docs/operations/RELEASE_458_CAIP_REVIEW_HANDOFF.md'):req((ROOT/p).exists(),f'Release 458 asset missing: {p}')
ops,css,assets,handoff,handoff_js,handoff_api=map(read,(OPS,CSS,ASSETS,HANDOFF,HANDOFF_JS,HANDOFF_API))
for marker in ('Private media, evidence & handoff readiness','Promise.allSettled','/api/admin/caip-evidence-review','/api/admin/caip-content-handoff','approvedUnlinked','linkedNeedsReview','package_stale','CAIP_PRIVATE_MEDIA_BUCKET'):
 req(marker in ops or marker in handoff_api or marker in read('docs/operations/RELEASE_458_CAIP_REVIEW_HANDOFF.md'),f'Release 458 CAIP depth missing {marker}')
req("method:" not in ops and "method :" not in ops,'CAIP readiness cockpit must remain read-only')
req('fetch(' not in ops,'CAIP readiness cockpit must use authenticated DDAuth reads')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px','.caip-ops-queue'):req(marker in css,f'CAIP operations responsive CSS missing {marker}')
req('data-admin-module="creators"' in assets and 'id="caipOperationsMount"' in assets,'Creative Assets must participate in Creators module shell and mount readiness')
req('/public/js/admin-caip-operations.js?v=458' in assets and '/css/caip-operations.css?v=458' in assets,'Creative Assets must load Release 458 operations assets')
req('/public/js/admin-module-nav.js?v=454' in assets and '/public/js/admin-workspace-state.js?v=454' in assets,'Creative Assets must carry shared Admin shell')
for html,path in ((assets,ASSETS),(handoff,HANDOFF)):
 req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1');req('noindex,nofollow' in html,f'{path} must remain private/noindex')
req('Release 458' in assets and 'Release 458' in handoff,'CAIP workspaces must present Release 458 as current')
req('new URLSearchParams(location.search)' in handoff_js and 'package_stale' in handoff_js and 'eligible_for_review' in handoff_js,'Handoff UI must support deep links and stale/review state')
for marker in ('const RELEASE = 458','package_stale','eligible_for_review','Prepared package is stale','current approved evidence is packaged','source_media_copied:false','publication_active:false'):
 req(marker in handoff_api,f'Handoff API missing Release 458 guard: {marker}')
req("action==='review'" in handoff_api and 'if (!data.eligible_for_review)' in handoff_api,'Server must refuse stale/empty handoff review')
release=json.loads(read('development-release.json'));history={x.get('release'):x for x in release.get('release_history',[])}
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','Release 458 must remain Development/dev')
req(release.get('release')==458 and release.get('label')=='Creators / CAIP Private Media, Evidence & Reviewed Handoff Depth','current release metadata must be 458')
req(release.get('current_release_migrations')==[],'Release 458 must not introduce D1 migration')
d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa' and d1.get('schema_current_through_release')==453,'Release 458 must carry exact Development D1 / schema-through-453')
db=release.get('current_release_database_state',{});req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453 and db.get('historical_migration_replay') is False,'Release 458 D1 state must remain source-only')
r457=history.get(457,{});req(r457.get('state')=='complete_source_proven_no_new_d1_migration' and r457.get('focused_source_gate_run')==33264872362 and r457.get('system_gate_run')==33264872366 and r457.get('exact_head_sha')=='33f939c8b6daa733e8a54fa8ded15cde626978a0' and r457.get('pages_check_run')==99133095306,'Release 457 exact-head closure evidence must be carried forward')
req(history.get(458,{}).get('state')=='implemented_pending_exact_head_ci','Release 458 history row missing/prematurely closed')
req(len(release.get('release458_batch',[]))==12 and all(x.get('status')=='implemented' for x in release.get('release458_batch',[])),'Release 458 batch metadata incomplete')
policy=release.get('release_policy',{});req(policy.get('current_release_d1_migration_required') is False and policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Release 458 safety policy drifted')
req(not list((ROOT/'migrations/dev').glob('*release458*')),'Release 458 migration file must not exist')
authority=read('functions/api/_lib/releaseAuthority.js');req('CURRENT_RELEASE = 458' in authority and 'Creators / CAIP Private Media, Evidence & Reviewed Handoff Depth' in authority,'shared release authority must be 458')
for p in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','MARKDOWN_INDEX.md','SANITY_HEALTH_CHECK.md','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','docs/operations/RELEASE_458_CAIP_REVIEW_HANDOFF.md'):
 t=read(p);req('Release 458' in t,f'{p} must identify Release 458');req('33264872362' in t and '33264872366' in t and '33f939c8b6daa733e8a54fa8ded15cde626978a0' in t,f'{p} must preserve Release 457 exact-head evidence')
run('scripts/release448_caip_content_handoff_gate.py');run('scripts/release457_financials_operations_gate.py')
print('RELEASE 458 CAIP REVIEW + HANDOFF GATE')
print('CAIP readiness cockpit: READ ONLY')
print('Private originals copied/overwritten: NO')
print('Stale/empty handoff review: BLOCKED SERVER-SIDE')
print('Development D1 migration: NONE / VERIFIED THROUGH RELEASE 453')
print('Release 457 exact-head proof: 33264872362 / 33264872366 / Pages 99133095306')
print('Provider execution/publication and separate live Production: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 458 CAIP REVIEW + HANDOFF GATE: PASS')
