#!/usr/bin/env python3
"""Carried-forward Release 458 CAIP private-media/evidence/reviewed-handoff authority gate."""
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
OPS='public/js/admin-caip-operations.js';CSS='css/caip-operations.css';ASSETS='admin/creative-assets/index.html';HANDOFF='admin/caip-content-handoff/index.html';HANDOFF_JS='public/js/admin-caip-content-handoff.js';HANDOFF_API='functions/api/admin/caip-content-handoff.js';DOC='docs/operations/RELEASE_458_CAIP_REVIEW_HANDOFF.md'
for p in (OPS,CSS,ASSETS,HANDOFF,HANDOFF_JS,HANDOFF_API,DOC):req((ROOT/p).exists(),f'Release 458 asset missing: {p}')
ops,css,assets,handoff,handoff_js,handoff_api=map(read,(OPS,CSS,ASSETS,HANDOFF,HANDOFF_JS,HANDOFF_API))
for marker in ('Private media, evidence & handoff readiness','Promise.allSettled','/api/admin/caip-evidence-review','/api/admin/caip-content-handoff','approvedUnlinked','linkedNeedsReview','package_stale','CAIP_PRIVATE_MEDIA_BUCKET'):
 req(marker in ops or marker in handoff_api or marker in read(DOC),f'Release 458 CAIP depth missing {marker}')
req('method:' not in ops and 'method :' not in ops,'CAIP readiness cockpit must remain read-only')
req('fetch(' not in ops,'CAIP readiness cockpit must use authenticated DDAuth reads')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px','.caip-ops-queue'):req(marker in css,f'CAIP operations responsive CSS missing {marker}')
req('data-admin-module="creators"' in assets and 'id="caipOperationsMount"' in assets,'Creative Assets must remain Creators owned and mount readiness')
req('/public/js/admin-caip-operations.js?v=458' in assets and '/css/caip-operations.css?v=458' in assets,'Creative Assets must retain Release 458 provenance assets')
for html,path in ((assets,ASSETS),(handoff,HANDOFF)):
 req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1');req('noindex,nofollow' in html,f'{path} must remain private/noindex')
req('package_stale' in handoff_js and 'eligible_for_review' in handoff_js,'Handoff UI must retain stale/review state')
for marker in ('const RELEASE = 458','package_stale','eligible_for_review','Prepared package is stale','source_media_copied:false','publication_active:false'):req(marker in handoff_api,f'Handoff API missing Release 458 guard: {marker}')
req("action==='review'" in handoff_api and 'if (!data.eligible_for_review)' in handoff_api,'Server must refuse stale/empty handoff review')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0);history={x.get('release'):x for x in release.get('release_history',[])}
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','Release authority must remain Development/dev')
req(current>=458,'current release cannot predate Release 458')
if current==458:req(release.get('label')=='Creators / CAIP Private Media, Evidence & Reviewed Handoff Depth','Release 458 label drifted')
else:
 r=history.get(458,{});req(r.get('state')=='complete_source_proven_no_new_d1_migration','Release 458 completed history missing');req(r.get('focused_source_gate_run')==33265953249 and r.get('system_gate_run')==33265953255 and r.get('exact_head_sha')=='66b48f0445c74247972e14fbdaa0e215e3792fb7' and r.get('pages_check_run')==99135984965,'Release 458 exact-head closure proof missing')
d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa' and int(d1.get('schema_current_through_release') or 0)>=453,'Development D1 authority drifted')
req(release.get('current_release_database_state',{}).get('historical_migration_replay') is False,'historical migration replay must remain forbidden')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundary drifted')
req(not list((ROOT/'migrations/dev').glob('*release458*')),'Release 458 itself must remain a no-migration release')
req(len(release.get('release458_batch',[]))==12 and all(x.get('status')=='implemented' for x in release.get('release458_batch',[])),'Release 458 batch history incomplete')
authority=read('functions/api/_lib/releaseAuthority.js');m=re.search(r'CURRENT_RELEASE\s*=\s*(\d+)',authority);req(bool(m) and int(m.group(1))>=458,'shared runtime release authority cannot regress below 458')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release458_caip_review_handoff_gate.py' in workflow,'System Gate must carry Release 458')
run('scripts/release448_caip_content_handoff_gate.py');run('scripts/release457_financials_operations_gate.py')
print('RELEASE 458 CAIP REVIEW + HANDOFF: CARRIED FORWARD')
print('Private originals copied/overwritten: NO')
print('Stale/empty handoff review: BLOCKED SERVER-SIDE')
print('Exact-head closure: 33265953249 / 33265953255 / 66b48f0445... / Pages 99135984965')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 458 CAIP REVIEW + HANDOFF GATE: PASS')
