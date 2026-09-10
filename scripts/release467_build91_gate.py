#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 91."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B90_SHA='ab23457370ced9224facc2a09c1cca7b1ff20968'; B90_TREE='54f069f37e09e6f48e035f98656423ed28aa85f4'
B90_PROOFS={'system_gate_run':34434124113,'current_application_quality_run':34434123999,'it_admin_runtime_proof_run':34434124058,'branch_hygiene_run':34434124046}
B90_PAGES=34434296247; B90_LIVE=34434356959
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

pointer=load('current-development-authority.json'); b90=load('release467-build90-external-acceptance-evidence-depth.json'); b91=load('release467-build91-prelaunch-go-live-decision-convergence.json'); manifest=load('migrations/canonical/manifest.json')
prelaunch=read('admin/prelaunch/index.html'); client=read('public/js/admin-prelaunch-hub.js'); clientc=compact(client)
startup=read('functions/api/admin/startup-readiness.js'); external=read('functions/api/admin/current-external-acceptance-control-center.js'); commerce=read('public/js/commerce-policy-core.js')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_91_PRELAUNCH_GO_LIVE_DECISION_CONVERGENCE.md'); provenance=read('scripts/current_system_gate_provenance_gate.py')

# Current Build 91 candidate over immutable exact Build 90 closure.
req(pointer.get('release')==467 and pointer.get('build')==91,'current authority must be Release 467 Build 91')
req(pointer.get('title')=='Prelaunch Authority & Go-Live Decision Convergence','Build 91 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B90_SHA and pointer.get('accepted_dev_tree_sha')==B90_TREE,'Build 91 accepted Development SHA/tree must equal Build 90 closure')
req((pointer.get('acceptance') or {})==B90_PROOFS,'Build 91 accepted Development proof set must equal Build 90')
req(pointer.get('promotion_state')=='BUILD91_CANDIDATE_NOT_YET_VERIFIED','Build 91 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==90 and last.get('dev_sha')==B90_SHA and last.get('tree_sha')==B90_TREE and (last.get('proofs') or {})==B90_PROOFS,'Build 90 restart closure drifted')
req(cand.get('build')==91 and cand.get('authority')=='release467-build91-prelaunch-go-live-decision-convergence.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 91 closure-candidate pointer drifted')
req(prod.get('build')==90 and prod.get('main_sha')==B90_SHA and prod.get('tree_sha')==B90_TREE and prod.get('production_pages_deploy_run')==B90_PAGES and prod.get('production_live_resource_integrity_run')==B90_LIVE,'Build 90 Production baseline drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build91-prelaunch-go-live-decision-convergence.json','release467-build90-external-acceptance-evidence-depth.json'],'current authority ordering must start Build 91 then Build 90')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):req(pointer.get(k) is False,f'unsafe pointer flag must remain false: {k}')

# Build 90 immutable closure; Build 91 candidate must not self-claim later proof.
req(b90.get('state')=='PRODUCTION_GREEN','Build 90 authority must retain Production GREEN')
f=b90.get('final_closure') or {}; p90=b90.get('production_checkpoint') or {}
req(f.get('dev_sha')==B90_SHA and f.get('tree_sha')==B90_TREE and (f.get('proofs') or {})==B90_PROOFS,'Build 90 final closure drifted')
req(p90.get('main_sha')==B90_SHA and p90.get('tree_sha')==B90_TREE and p90.get('production_pages_deploy_run')==B90_PAGES and p90.get('production_live_resource_integrity_run')==B90_LIVE,'Build 90 Production closure drifted')
req(b91.get('release')==467 and b91.get('build')==91 and b91.get('title')=='Prelaunch Authority & Go-Live Decision Convergence','Build 91 authority identity drifted')
req(b91.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 91 authority must remain closure candidate')
sd=(b91.get('starting_point') or {}).get('development') or {}; sp=(b91.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B90_SHA and sd.get('tree')==B90_TREE and sd.get('system_gate_run')==B90_PROOFS['system_gate_run'] and sd.get('quality_run')==B90_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B90_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B90_PROOFS['branch_hygiene_run'],'Build 91 Development starting point drifted')
req(sp.get('main_sha')==B90_SHA and sp.get('tree_sha')==B90_TREE and sp.get('production_pages_deploy_run')==B90_PAGES and sp.get('production_live_resource_integrity_run')==B90_LIVE,'Build 91 Production starting point drifted')
req((b91.get('closure_policy') or {}).get('final_closure') is None,'Build 91 must not contain premature final closure')

# Prelaunch current page and client converge stale authority into fail-closed current truth.
for token in ('Release 467 Build 91','Prelaunch &amp; Go-Live Decision',B90_SHA,B90_TREE,str(B90_PAGES),str(B90_LIVE),'U.S. sales/shipping remain disabled','Canada-only','local pickup','0001','0004'):
 req(token.lower() in prelaunch.lower(),f'Build 91 prelaunch page missing token: {token}')
req('Build 230' not in prelaunch and 'Build 229' not in prelaunch,'current prelaunch page must not present stale Build 229/230 identity')
req('43-gate' not in prelaunch and '43 gate' not in prelaunch.lower(),'current prelaunch page must not hard-code historical 43-gate authority')
req(len(re.findall(r'<h1(?:\s|>)',prelaunch,re.I))==1,'prelaunch page must contain exactly one H1')
for token in ("'/api/admin/startup-readiness'","'/api/admin/current-external-acceptance-control-center'",'expected_total','degraded','Go-live decision','Technical release proof','External acceptance','Commerce policy','U.S. sales/shipping','manual'):
 req(token.lower() in client.lower(),f'Build 91 prelaunch client missing token: {token}')
req("method:'GET'" in clientc,'Build 91 prelaunch client must use explicit GET reads')
req("method:'POST'" not in clientc,'Build 91 prelaunch client must not POST')
req('setInterval(' not in client,'Build 91 prelaunch client must not poll')
req('api.stripe.com' not in client and 'api-m.paypal.com' not in client and 'api-m.sandbox.paypal.com' not in client,'Build 91 prelaunch client must not directly call payment providers')

# Existing Startup Readiness remains owner; current external acceptance remains structured read-only authority.
for token in ("const EXPECTED_TOTAL = 46","export async function onRequestGet","export async function onRequestPost"):
 req(token in startup,f'Startup Readiness current contract missing token: {token}')
req("const BUILD = 90;" in external and 'runtimeBoundary' in external and 'if(runtime.development)' in external,'Build 90 external acceptance environment isolation drifted')
for token in ('stripe_development','paypal_sandbox','social_oauth','caip_private_media','cloudflare_access_service_token','required_check_count','accepted_check_count','next_action'):
 req(token in external,f'current external acceptance authority missing token: {token}')
req('united_states_sales_enabled: false' in commerce and 'united_states_shipping_enabled: false' in commerce,'U.S. sales/shipping suspension drifted')
req("selling_country_code: 'CA'" in commerce and "currency: 'CAD'" in commerce and "allowed_shipping_country_codes: Object.freeze(['CA'])" in commerce,'Canada-only commerce authority drifted')

# Current I.T. / Reliability / Deployment Preflight agree on Build 91 over exact Build 90 proof.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
 req(B90_SHA in text and B90_TREE in text,f'{label} missing Build 90 verified SHA/tree'); req(str(B90_PAGES) in text and str(B90_LIVE) in text,f'{label} missing Build 90 Production proof')
req('constBUILD=91;' in compact(it_api),'I.T. API must identify Build 91')
req('CURRENT_RELIABILITY_BUILD = 91' in reliability,'Reliability must identify Build 91')
req('constBUILD=91;' in compact(preflight),'Deployment Preflight must identify Build 91')
req('Release 467 Build 91' in it_client and 'Release 467 Build 91' in it_page,'I.T. current surfaces must identify Build 91')
req('Release 467 • Build 91' in reliability_page,'Reliability page must identify Build 91')
req('Release 467 Build 91' in preflight_page,'Deployment Preflight page must identify Build 91')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
 body=read(path)
 for token in (B90_SHA,B90_TREE,str(B90_PROOFS['system_gate_run']),str(B90_PROOFS['current_application_quality_run']),str(B90_PROOFS['it_admin_runtime_proof_run']),str(B90_PROOFS['branch_hygiene_run']),str(B90_PAGES),str(B90_LIVE)):req(token in body,f'{path} missing Build 90 verified token: {token}')
 req('Build 91' in body,f'{path} must identify Build 91 current candidate')
for token in ('Startup Readiness','five external','Canada-only','U.S. sales/shipping','HOLD','GET-only','0001','0004'):
 req(token.lower() in doc.lower(),f'Build 91 operating document missing token: {token}')
req([r.get('file') for r in manifest.get('migrations',[])]==EXPECTED,'Build 91 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 91 must remain schema-neutral')
req("run_current_contract('scripts/release467_build91_gate.py', 'Release 467 Build 91')" in provenance,'System Gate does not chain Build 91')

for path in ('public/js/admin-prelaunch-hub.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
 run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build90_gate.py'],'carried Build 90 boundary')
if FAIL:
 print('RELEASE 467 BUILD 91 PRELAUNCH AUTHORITY & GO-LIVE DECISION CONVERGENCE: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 91 PRELAUNCH AUTHORITY & GO-LIVE DECISION CONVERGENCE: PASS')
print('Prelaunch current authority: STARTUP READINESS + FIVE EXTERNAL LANES')
print('Technical GREEN vs unrestricted go-live: DISTINCT / FAIL-CLOSED')
print('Canada-only commerce / U.S. sales-shipping suspension: PRESERVED')
print('Automatic provider execution/publication/Production promotion: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
