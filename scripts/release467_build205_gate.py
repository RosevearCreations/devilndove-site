#!/usr/bin/env python3
"""Release 467 Build 205 — Current Authority & Manufacturing-Era Roadmap Convergence."""
from pathlib import Path
import json,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_DEV='48307e67978dee5ef4481ccfe2739a5d3df79b18'
BASE_MAIN='09253dbe5b43c4308d1ff671bb71df80bf0592d9'
BASE_TREE='4a63209efc54bc641ba0484c4954ac1cb35acc2e'
BASE_PROOFS={'system_gate_run':35483005170,'current_application_quality_run':35483005094,'it_admin_runtime_proof_run':35483005097,'branch_hygiene_run':35483005113}
BASE_PAGES=35483092965
RUNTIME_DEV='50098122e88548ad5e94835d5ef69a5e738aed88'
RUNTIME_MAIN='d88789ee563e700e8847f7b47f156964024a3b45'
RUNTIME_TREE='90018f79ee469420e9f3c16504bdf4a73c0dfd0f'
RUNTIME_DEV_PROOF=35478691738
RUNTIME_PROD_PROOF=35478779057
RUNTIME_PAGES=35478779248
TITLE='Current Authority & Manufacturing-Era Roadmap Convergence'
B204='release467-build204-storefront-launch-set-autonomous-closure.json'
B205='release467-build205-current-authority-manufacturing-era-roadmap-convergence.json'

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path))
    except Exception as exc: FAIL.append(f'invalid JSON {path}: {exc}'); return {}
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1600:]}')
def run_gate(path,label):
    p=subprocess.run([sys.executable,str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.stdout.strip(): print(p.stdout.strip())
    if p.returncode!=0: FAIL.append(f'{label} failed: {(p.stderr or p.stdout).strip()[-2600:]}')

pointer=load('current-development-authority.json')
b204=load(B204)
b205=load(B205)
manifest=load('migrations/canonical/manifest.json')
roadmap=read('docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md')
doc=read('docs/operations/RELEASE_467_BUILD_205_CURRENT_AUTHORITY_MANUFACTURING_ERA_ROADMAP_CONVERGENCE.md')
ai=read('AI_HANDOFF.md')
project=read('PROJECT_STATUS_AND_ROADMAP.md')
index=read('MARKDOWN_INDEX.md')
guide=read('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
workflow=read('.github/workflows/release467-build205-current-authority-manufacturing-era-convergence.yml')

# Pointer must describe an in-flight Build 205 over the already-proven Build 204/current-roadmap boundary.
req(pointer.get('release')==467 and pointer.get('build')==205,'current pointer must identify Release 467 Build 205')
req(pointer.get('title')==TITLE,'Build 205 pointer title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','Build 205 pointer must inherit the last verified GREEN Development checkpoint')
req(pointer.get('source_authority')=='dev','Build 205 source authority must remain dev')
req(pointer.get('accepted_dev_sha')==BASE_DEV and pointer.get('accepted_dev_tree_sha')==BASE_TREE,'Build 205 accepted source boundary drifted')
req((pointer.get('acceptance') or {})==BASE_PROOFS,'Build 205 inherited four-proof bundle drifted')
ri=pointer.get('restart_integrity') or {}; last=ri.get('last_fully_verified') or {}; cand=ri.get('current_closure_candidate') or {}
req(last.get('build')==204 and last.get('authority')==B204 and last.get('dev_sha')==BASE_DEV and last.get('tree_sha')==BASE_TREE,'Build 205 restart predecessor must be canonical Build 204')
req((last.get('proofs') or {})==BASE_PROOFS,'Build 204 canonical restart proof bundle drifted')
req(last.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and last.get('exact_preview_deployment') is True,'Build 204 canonical restart checkpoint must remain exact GREEN')
req(cand.get('build')==205 and cand.get('authority')==B205 and cand.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 205 candidate pointer drifted')
for key in ('restart_requires_exact_dev_head_proof_verification','closure_candidate_must_not_self_claim_final_proof','next_build_ingests_previous_final_closure'):
    req(ri.get(key) is True,f'Build 205 restart integrity missing {key}')

prod=pointer.get('production_checkpoint') or {}
req(prod.get('build')==204 and prod.get('authority')==B204,'Build 205 Production predecessor authority must be Build 204')
req(prod.get('main_sha')==BASE_MAIN and prod.get('tree_sha')==BASE_TREE,'Build 205 Production source boundary drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==BASE_PAGES,'Build 205 Production Pages predecessor drifted')
req(prod.get('state')=='PRODUCTION_GREEN' and prod.get('role')=='CURRENT_PRODUCTION_BASELINE','Build 204/current roadmap source must remain Production GREEN')
req(int(prod.get('remote_d1_queries') or 0)==0,'Build 205 predecessor roadmap promotion must remain zero-D1')

authorities=[str(x) for x in (pointer.get('current_release_authorities') or [])]
req(authorities[:2]==[B205,B204],'Build 205/204 authorities must lead current release authority chain')
for retained in ('release467-build193-current-authority-handoff-convergence.json','release467-build192-release-runtime-budget-convergence-closure.json','release467-build171-release-restart-authority-convergence.json','release467-build170-product-browser-explicit-image-recovery-closure.json'):
    req(retained in authorities,f'Build 205 must retain historical authority: {retained}')

external=pointer.get('external_lanes') or {}
req(external.get('stripe_development')=='HOLD_EXTERNAL' and external.get('paypal_sandbox')=='HOLD_EXTERNAL' and external.get('social_oauth')=='HOLD_EXTERNAL','external commercial lanes must remain HOLD_EXTERNAL')
for key in ('automatic_production_promotion_authorized','request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(pointer.get(key) is False,f'Build 205 pointer must keep {key} false')

# Build 204 closure records both original runtime proof and later docs-only canonicalization.
req(b204.get('release')==467 and b204.get('build')==204 and b204.get('state')=='PRODUCTION_GREEN','Build 204 closure identity/state drifted')
runtime=b204.get('runtime_build204') or {}; rdev=runtime.get('development') or {}; rprod=runtime.get('production') or {}
req(rdev.get('sha')==RUNTIME_DEV and rdev.get('tree')==RUNTIME_TREE and int(rdev.get('build_specific_proof_run') or 0)==RUNTIME_DEV_PROOF,'original Build 204 Development runtime proof drifted')
req(rprod.get('main_sha')==RUNTIME_MAIN and rprod.get('tree')==RUNTIME_TREE and int(rprod.get('build_specific_proof_run') or 0)==RUNTIME_PROD_PROOF and int(rprod.get('production_pages_deploy_run') or 0)==RUNTIME_PAGES,'original Build 204 Production runtime proof drifted')
final=b204.get('final_closure') or {}; bprod=b204.get('production_checkpoint') or {}
req(final.get('dev_sha')==BASE_DEV and final.get('tree_sha')==BASE_TREE and (final.get('proofs') or {})==BASE_PROOFS,'canonical Build 204 final source closure drifted')
req(int(final.get('ingested_by_build') or 0)==205,'Build 204 canonical closure must be ingested by Build 205')
req(bprod.get('main_sha')==BASE_MAIN and bprod.get('tree_sha')==BASE_TREE and int(bprod.get('production_pages_deploy_run') or 0)==BASE_PAGES,'canonical Build 204 Production source boundary drifted')
req(bprod.get('docs_only_roadmap_promotion') is True and bprod.get('code_only') is True,'Build 204 canonical source boundary must retain docs/code-only classification')

# Build 205 candidate starts only from the canonical Build 204 boundary.
req(b205.get('release')==467 and b205.get('build')==205 and b205.get('title')==TITLE,'Build 205 candidate identity drifted')
req(b205.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 205 candidate must fail closed before external proof')
start=(b205.get('starting_point') or {}).get('development') or {}; start_prod=(b205.get('starting_point') or {}).get('production') or {}
req(start.get('sha')==BASE_DEV and start.get('tree')==BASE_TREE,'Build 205 starting Development boundary drifted')
req(start.get('system_gate_run')==BASE_PROOFS['system_gate_run'] and start.get('quality_run')==BASE_PROOFS['current_application_quality_run'],'Build 205 starting System/Quality proof drifted')
req(start.get('it_admin_runtime_run')==BASE_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run')==BASE_PROOFS['branch_hygiene_run'],'Build 205 starting I.T./Hygiene proof drifted')
req(start_prod.get('main_sha')==BASE_MAIN and start_prod.get('tree')==BASE_TREE and int(start_prod.get('production_pages_deploy_run') or 0)==BASE_PAGES,'Build 205 starting Production boundary drifted')
for key,value in (b205.get('safety') or {}).items():
    if isinstance(value,bool): req(value is False,f'Build 205 safety must remain false: {key}')

# No schema advancement.
expected=[
 '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql',
 '0003_release464_business_growth.sql','0004_release465_storefront_quality.sql',
 '0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql'
]
rows=manifest.get('migrations') or []
req([x.get('file') for x in rows]==expected,'Build 205 canonical migrations must remain exactly 0001-0006')
req([int(x.get('version') or 0) for x in rows]==list(range(1,7)),'Build 205 canonical migration versions must remain contiguous 1-6')

# Current operational surfaces must agree with Build 205 / canonical Build 204 boundary.
for body,label in ((it_api,'I.T. API'),(preflight,'Deployment Preflight'),(reliability,'Reliability')):
    for token in (BASE_DEV,BASE_MAIN,BASE_TREE,str(BASE_PAGES)):
        req(token in body,f'{label} missing canonical Build 204 boundary token: {token}')
req('const BUILD=205;' in it_api and TITLE in it_api,'I.T. API must identify Build 205')
req('const BUILD=205;' in preflight and TITLE in preflight,'Deployment Preflight must identify Build 205')
req('CURRENT_RELIABILITY_BUILD=205' in reliability and TITLE in reliability,'Reliability must identify Build 205')
req('Release 467 Build 205' in it_client,'I.T. client must identify Build 205')
for page,label in ((it_page,'I.T. page'),(preflight_page,'Deployment Preflight page'),(reliability_page,'Reliability page')):
    req('Build 205' in page,f'{label} must identify Build 205')
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} must contain exactly one H1')
for body,label in ((ai,'AI_HANDOFF.md'),(project,'PROJECT_STATUS_AND_ROADMAP.md'),(index,'MARKDOWN_INDEX.md'),(guide,'I.T. restart guide')):
    req('Build 204' in body and 'Build 205' in body,f'{label} missing Build 204/205 current truth')
    req(BASE_DEV in body and BASE_MAIN in body and BASE_TREE in body,f'{label} missing canonical source boundary')
    req('Retained historical provenance' in body and 'Build 171' in body and 'Build 193' in body,f'{label} missing retained historical provenance')
req('Current Release 467 restart authority — Build 205 candidate' in guide,'I.T. restart guide must identify Build 205 candidate')
req('0001' in guide and '0006' in guide,'I.T. restart guide must expose canonical migration span')

# Roadmap and operations contract.
for token in ('Build 205: **current','Build 206: **next only after Build 205','48307e67978dee5ef4481ccfe2739a5d3df79b18','09253dbe5b43c4308d1ff671bb71df80bf0592d9'):
    req(token in roadmap,f'205-224 roadmap checkpoint missing: {token}')
for token in ('Current Authority & Manufacturing-Era Roadmap Convergence',BASE_DEV,BASE_MAIN,BASE_TREE,'Build 206','D1/schema/R2 business-data mutation: ZERO'):
    req(str(token).lower() in doc.lower(),f'Build 205 operations contract missing: {token}')

# Workflow must remain source/code-docs only and zero-D1.
for token in ('python scripts/release467_build205_gate.py','release467-build205-exact-evidence','branches: [dev, main]','pull_request:','actions/upload-artifact@v4'):
    req(token in workflow,f'Build 205 workflow missing: {token}')
for forbidden in ('wrangler@4 d1 execute','CLOUDFLARE_API_TOKEN','PRODUCT_MEDIA_BUCKET','CAIP_PRIVATE_MEDIA_BUCKET','bucket.put(','bucket.delete('):
    req(forbidden not in workflow,f'Build 205 workflow must remain D1/R2/provider-free: {forbidden}')

for path in (
 'functions/api/admin/it-operations-control-tower.js','functions/api/admin/current-deployment-preflight.js',
 'functions/api/_lib/currentReliability.js','public/js/admin-it-control-tower.js'
):
    node(path)

# Current/retenained proof stack must all agree.
for path,label in (
 ('scripts/release467_build171_gate.py','Build 171 retained authority'),
 ('scripts/release467_build192_gate.py','Build 192 retained convergence'),
 ('scripts/release467_build193_gate.py','Build 193 retained convergence'),
 ('scripts/release467_build204_gate.py','Build 204 storefront closure'),
 ('scripts/current_authority_restart_integrity_gate.py','Current authority restart integrity'),
 ('scripts/current_it_release_truth_gate.py','Current I.T. release truth'),
 ('scripts/current_deployment_preflight_truth_gate.py','Current Deployment Preflight truth'),
 ('scripts/current_reliability_truth_gate.py','Current Reliability truth'),
 ('scripts/repository_forward_sanity.py','Repository forward sanity'),
):
    run_gate(path,label)

if FAIL:
    print('RELEASE 467 BUILD 205 CURRENT AUTHORITY / MANUFACTURING-ERA ROADMAP CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)

print('RELEASE 467 BUILD 205 CURRENT AUTHORITY / MANUFACTURING-ERA ROADMAP CONVERGENCE: PASS')
print('Build 204 runtime closure: RETAINED')
print('Build 204/current roadmap canonical restart source: INGESTED')
print('Current pointer / I.T. / Preflight / Reliability / human handoff: BUILD 205 OVER BUILD 204')
print('Build 170/171/192/193 provenance: RETAINED HISTORICALLY')
print('Canonical migrations: 0001-0006 / NO BUILD 205 MIGRATION')
print('Build 205 live D1/R2/provider/payment/accounting/business-data work: ZERO')
print('Build 206: BLOCKED UNTIL BUILD 205 PRODUCTION GREEN')
