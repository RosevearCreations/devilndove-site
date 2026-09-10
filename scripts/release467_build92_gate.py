#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 92."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B91_SHA='1d5519b976d108e7d4a558876863be5559a67e35'; B91_TREE='6a62d01c1be002b78c3c8d05993c40676e41e208'
B91_PROOFS={'system_gate_run':34486729268,'current_application_quality_run':34486729227,'it_admin_runtime_proof_run':34486729225,'branch_hygiene_run':34486729311}
B91_PAGES=34488492622; B91_LIVE=34488622668
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(p):
 t=ROOT/p
 if not t.is_file():FAIL.append(f'missing required file: {p}');return ''
 return t.read_text(encoding='utf-8',errors='replace')
def load(p):
 try:return json.loads(read(p) or '{}')
 except json.JSONDecodeError as e:FAIL.append(f'invalid JSON {p}: {e}');return{}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def run(cmd,label):
 r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.stdout.strip():print(r.stdout.strip())
 req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3600:]}")
def compact(s):return re.sub(r'\s+','',s)

pointer=load('current-development-authority.json'); b91=load('release467-build91-prelaunch-go-live-decision-convergence.json'); b92=load('release467-build92-prelaunch-action-queue-completeness.json'); manifest=load('migrations/canonical/manifest.json')
prelaunch=read('admin/prelaunch/index.html'); client=read('public/js/admin-prelaunch-hub.js'); clientc=compact(client)
startup=read('functions/api/admin/startup-readiness.js'); commerce=read('public/js/commerce-policy-core.js')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_92_PRELAUNCH_ACTION_QUEUE_COMPLETENESS.md'); provenance=read('scripts/current_system_gate_provenance_gate.py')

# Current Build 92 candidate over immutable exact Build 91 closure.
req(pointer.get('release')==467 and pointer.get('build')==92,'current authority must be Release 467 Build 92')
req(pointer.get('title')=='Prelaunch Action Queue Completeness & Ownership','Build 92 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B91_SHA and pointer.get('accepted_dev_tree_sha')==B91_TREE,'Build 92 accepted Development SHA/tree must equal Build 91 closure')
req((pointer.get('acceptance') or {})==B91_PROOFS,'Build 92 accepted Development proof set must equal Build 91')
req(pointer.get('promotion_state')=='BUILD92_CANDIDATE_NOT_YET_VERIFIED','Build 92 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==91 and last.get('dev_sha')==B91_SHA and last.get('tree_sha')==B91_TREE and (last.get('proofs') or {})==B91_PROOFS,'Build 91 restart closure drifted')
req(cand.get('build')==92 and cand.get('authority')=='release467-build92-prelaunch-action-queue-completeness.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 92 closure-candidate pointer drifted')
req(prod.get('build')==91 and prod.get('main_sha')==B91_SHA and prod.get('tree_sha')==B91_TREE and prod.get('production_pages_deploy_run')==B91_PAGES and prod.get('production_live_resource_integrity_run')==B91_LIVE,'Build 91 Production baseline drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build92-prelaunch-action-queue-completeness.json','release467-build91-prelaunch-go-live-decision-convergence.json'],'current authority ordering must start Build 92 then Build 91')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):req(pointer.get(k) is False,f'unsafe pointer flag must remain false: {k}')

# Build 91 immutable closure; Build 92 candidate must not self-claim later proof.
req(b91.get('state')=='PRODUCTION_GREEN','Build 91 authority must retain Production GREEN')
f=b91.get('final_closure') or {}; p91=b91.get('production_checkpoint') or {}
req(f.get('dev_sha')==B91_SHA and f.get('tree_sha')==B91_TREE and (f.get('proofs') or {})==B91_PROOFS,'Build 91 final closure drifted')
req(p91.get('main_sha')==B91_SHA and p91.get('tree_sha')==B91_TREE and p91.get('production_pages_deploy_run')==B91_PAGES and p91.get('production_live_resource_integrity_run')==B91_LIVE,'Build 91 Production closure drifted')
req(b92.get('release')==467 and b92.get('build')==92 and b92.get('title')=='Prelaunch Action Queue Completeness & Ownership','Build 92 authority identity drifted')
req(b92.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 92 authority must remain closure candidate')
sd=(b92.get('starting_point') or {}).get('development') or {}; sp=(b92.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B91_SHA and sd.get('tree')==B91_TREE and sd.get('system_gate_run')==B91_PROOFS['system_gate_run'] and sd.get('quality_run')==B91_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B91_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B91_PROOFS['branch_hygiene_run'],'Build 92 Development starting point drifted')
req(sp.get('main_sha')==B91_SHA and sp.get('tree_sha')==B91_TREE and sp.get('production_pages_deploy_run')==B91_PAGES and sp.get('production_live_resource_integrity_run')==B91_LIVE,'Build 92 Production starting point drifted')
req((b92.get('closure_policy') or {}).get('final_closure') is None,'Build 92 must not contain premature final closure')

# Current prelaunch page identifies Build 92 and preserves exact Build 91 proof and commerce boundary.
for token in ('Release 467 Build 92','Prelaunch &amp; Go-Live Decision',B91_SHA,B91_TREE,str(B91_PAGES),str(B91_LIVE),'Action-queue rule','U.S. sales/shipping remain disabled','Canada-only','local pickup','0001','0004'):
 req(token.lower() in prelaunch.lower(),f'Build 92 prelaunch page missing token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',prelaunch,re.I))==1,'prelaunch page must contain exactly one H1')

# The launch decision and action set must use the same complete unresolved Startup Readiness set.
for token in ('const BUILD=92;','const VERIFIED_BUILD=91;',B91_SHA,B91_TREE,'startupPriority','failed:0','blocked:0','needs_review:1','in_progress:2','not_started:3','startup.open.map','owner_name','due_date','Owner unassigned','No due date','Startup Readiness action queue','External acceptance action queue','startup.open_count===0','external.unresolved.length===0','degraded'):
 req(token in client or token in clientc,f'Build 92 prelaunch client missing token: {token}')
req('startup.blocked.slice' not in client,'Build 92 must not restrict launch actions to blocked/failed rows')
req('actions.slice(0,8)' not in client and 'slice(0,4)' not in client,'Build 92 must not silently truncate unresolved Startup Readiness actions')
req("'/api/admin/startup-readiness'" in client and "'/api/admin/current-external-acceptance-control-center'" in client,'Build 92 must read both current launch authorities')
req("method:'GET'" in clientc,'Build 92 prelaunch client must use explicit GET reads')
req("method:'POST'" not in clientc,'Build 92 prelaunch client must not POST')
req('setInterval(' not in client,'Build 92 prelaunch client must not poll')
req('api.stripe.com' not in client and 'api-m.paypal.com' not in client and 'api-m.sandbox.paypal.com' not in client,'Build 92 prelaunch client must not directly call payment providers')

# Existing Startup Readiness remains D1 owner; Build 92 does not mutate its contract.
for token in ("const EXPECTED_TOTAL = 46","export async function onRequestGet","export async function onRequestPost"):
 req(token in startup,f'Startup Readiness current contract missing token: {token}')
req('united_states_sales_enabled: false' in commerce and 'united_states_shipping_enabled: false' in commerce,'U.S. sales/shipping suspension drifted')
req("selling_country_code: 'CA'" in commerce and "currency: 'CAD'" in commerce and "allowed_shipping_country_codes: Object.freeze(['CA'])" in commerce,'Canada-only commerce authority drifted')

# Current I.T. / Reliability / Deployment Preflight agree on Build 92 over exact Build 91 proof.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
 req(B91_SHA in text and B91_TREE in text,f'{label} missing Build 91 verified SHA/tree'); req(str(B91_PAGES) in text and str(B91_LIVE) in text,f'{label} missing Build 91 Production proof')
req('constBUILD=92;' in compact(it_api),'I.T. API must identify Build 92')
req('CURRENT_RELIABILITY_BUILD = 92' in reliability,'Reliability must identify Build 92')
req('constBUILD=92;' in compact(preflight),'Deployment Preflight must identify Build 92')
req('Release 467 Build 92' in it_client and 'Release 467 Build 92' in it_page,'I.T. current surfaces must identify Build 92')
req('Release 467 • Build 92' in reliability_page,'Reliability page must identify Build 92')
req('Release 467 Build 92' in preflight_page,'Deployment Preflight page must identify Build 92')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
 body=read(path)
 for token in (B91_SHA,B91_TREE,str(B91_PROOFS['system_gate_run']),str(B91_PROOFS['current_application_quality_run']),str(B91_PROOFS['it_admin_runtime_proof_run']),str(B91_PROOFS['branch_hygiene_run']),str(B91_PAGES),str(B91_LIVE)):req(token in body,f'{path} missing Build 91 verified token: {token}')
 req('Build 92' in body,f'{path} must identify Build 92 current candidate')
for token in ('every','unresolved','owner','due date','five external','Canada-only','U.S. sales/shipping','GET/read-only','0001','0004'):
 req(token.lower() in doc.lower(),f'Build 92 operating document missing token: {token}')
req([r.get('file') for r in manifest.get('migrations',[])]==EXPECTED,'Build 92 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 92 must remain schema-neutral')
req("run_current_contract('scripts/release467_build92_gate.py', 'Release 467 Build 92')" in provenance,'System Gate does not chain Build 92')

for path in ('public/js/admin-prelaunch-hub.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
 run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build91_gate.py'],'carried Build 91 boundary')
if FAIL:
 print('RELEASE 467 BUILD 92 PRELAUNCH ACTION QUEUE COMPLETENESS & OWNERSHIP: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 92 PRELAUNCH ACTION QUEUE COMPLETENESS & OWNERSHIP: PASS')
print('Startup Readiness unresolved actions: COMPLETE / OWNER + DUE DATE VISIBLE')
print('External acceptance actions: SEPARATE FIVE-LANE AUTHORITY')
print('Technical GREEN vs unrestricted go-live: DISTINCT / FAIL-CLOSED')
print('Canada-only commerce / U.S. sales-shipping suspension: PRESERVED')
print('Automatic provider execution/publication/Production promotion: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
