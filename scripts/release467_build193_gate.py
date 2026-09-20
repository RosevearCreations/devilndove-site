#!/usr/bin/env python3
"""Release 467 Build 193 — Current Authority & Handoff Convergence gate."""
from pathlib import Path
import json
import re,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B192_DEV='76321bfc975862ce2463e87450852c19fc98c852'
B192_MAIN='451ca8173b9ad3127f84f352ed0a8d7774e53b14'
B192_TREE='5752f7e0be8c432d2cc45b5de08c349208ee497a'
B192_PROOFS={'system_gate_run':35418600834,'current_application_quality_run':35418600870,'it_admin_runtime_proof_run':35418600868,'branch_hygiene_run':35418600827}
B192_BUILD_PROOF=35418600841
B192_PAGES=35418692246
B192_LIVE=35418731807
B192_ROUTE=35418731793
B192_BROWSER=35418731822
B192_PROD_PROOF=35418692245
TITLE='Current Authority & Handoff Convergence'
CLOSURE='release467-build192-release-runtime-budget-convergence-closure.json'
CANDIDATE='release467-build193-current-authority-handoff-convergence.json'

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path))
    except Exception as exc: FAIL.append(f'invalid JSON {path}: {exc}'); return {}
def run_gate(path,label):
    p=subprocess.run([sys.executable,str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.stdout.strip(): print(p.stdout.strip())
    if p.returncode!=0: FAIL.append(f'{label} failed: {(p.stderr or p.stdout).strip()[-2600:]}')
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1600:]}')

pointer=load('current-development-authority.json')
closure=load(CLOSURE)
candidate=load(CANDIDATE)
manifest=load('migrations/canonical/manifest.json')
roadmap=read('docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md')
doc=read('docs/operations/RELEASE_467_BUILD_193_CURRENT_AUTHORITY_HANDOFF_CONVERGENCE.md')
guide=read('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
ai=read('AI_HANDOFF.md')
project=read('PROJECT_STATUS_AND_ROADMAP.md')
index=read('MARKDOWN_INDEX.md')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
gate171=read('scripts/release467_build171_gate.py')
workflow=read('.github/workflows/release467-build193-current-authority-handoff-convergence.yml')

# Pointer / immutable predecessor.
req(pointer.get('release')==467 and pointer.get('build')==193,'current pointer must identify Release 467 Build 193')
req(pointer.get('title')==TITLE,'Build 193 pointer title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','Build 193 candidate pointer must inherit verified Development GREEN state')
req(pointer.get('source_authority')=='dev','Build 193 source authority must remain dev')
req(pointer.get('accepted_dev_sha')==B192_DEV and pointer.get('accepted_dev_tree_sha')==B192_TREE,'Build 193 accepted Development baseline must be exact Build 192')
req((pointer.get('acceptance') or {})==B192_PROOFS,'Build 193 inherited four-proof bundle drifted')
ri=pointer.get('restart_integrity') or {}; last=ri.get('last_fully_verified') or {}; cand=ri.get('current_closure_candidate') or {}
req(last.get('build')==192 and last.get('authority')==CLOSURE and last.get('dev_sha')==B192_DEV and last.get('tree_sha')==B192_TREE,'Build 193 restart predecessor must be exact Build 192')
req((last.get('proofs') or {})==B192_PROOFS,'Build 192 restart proof bundle drifted')
req(last.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and last.get('exact_preview_deployment') is True,'Build 192 restart checkpoint must remain exact GREEN')
req(cand.get('build')==193 and cand.get('authority')==CANDIDATE and cand.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 193 closure candidate pointer drifted')
for key in ('restart_requires_exact_dev_head_proof_verification','closure_candidate_must_not_self_claim_final_proof','next_build_ingests_previous_final_closure'):
    req(ri.get(key) is True,f'Build 193 restart integrity missing {key}')

prod=pointer.get('production_checkpoint') or {}
req(prod.get('build')==192 and prod.get('authority')==CLOSURE,'Build 193 Production predecessor authority must be Build 192 closure')
req(prod.get('main_sha')==B192_MAIN and prod.get('tree_sha')==B192_TREE,'Build 193 Production predecessor SHA/tree drifted')
req(prod.get('production_pages_deploy_run')==B192_PAGES and prod.get('production_live_resource_integrity_run')==B192_LIVE,'Build 192 Production Pages/live proof drifted')
req(prod.get('products_route_proof_run')==B192_ROUTE and prod.get('products_browser_proof_run')==B192_BROWSER,'Build 192 Product Production proofs drifted')
req(prod.get('build_specific_proof_run')==B192_PROD_PROOF and prod.get('remote_d1_queries')==0,'Build 192 Production Build proof/zero-D1 evidence drifted')
req(prod.get('state')=='PRODUCTION_GREEN' and prod.get('role')=='CURRENT_PRODUCTION_BASELINE','Build 192 must remain current Production GREEN predecessor')

authorities=pointer.get('current_release_authorities') or []
req(authorities[:2]==[CANDIDATE,CLOSURE],'Build 193/192 authorities must lead current release authority chain')
req('release467-build171-release-restart-authority-convergence.json' in authorities,'Build 171 historical provenance must be retained')
req('release467-build170-product-browser-explicit-image-recovery-closure.json' in authorities,'Build 170 historical closure must be retained')

external=pointer.get('external_lanes') or {}
expected_external={
 'stripe_development':'HOLD_EXTERNAL','paypal_sandbox':'HOLD_EXTERNAL','social_oauth':'HOLD_EXTERNAL',
 'caip_private_media':'EVIDENCE_DEPENDENT','cloudflare_access_service_token':'HOLD_EXTERNAL_CONFIGURED_AND_PROVEN_DEVELOPMENT'
}
req(external==expected_external,'Build 193 external lane states drifted')
for key in ('automatic_production_promotion_authorized','request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(pointer.get(key) is False,f'Build 193 pointer must keep {key} false')

# Immutable Build 192 closure authority.
req(closure.get('release')==467 and closure.get('build')==192 and closure.get('state')=='PRODUCTION_GREEN','Build 192 closure identity/state drifted')
final=closure.get('final_closure') or {}; cprod=closure.get('production_checkpoint') or {}
req(final.get('dev_sha')==B192_DEV and final.get('tree_sha')==B192_TREE and (final.get('proofs') or {})==B192_PROOFS,'Build 192 final Development closure drifted')
req(final.get('build_specific_proof_run')==B192_BUILD_PROOF and int(final.get('ingested_by_build') or 0)==193,'Build 192 closure must be ingested by Build 193')
req(cprod.get('main_sha')==B192_MAIN and cprod.get('tree_sha')==B192_TREE,'Build 192 closure Production identity drifted')
req(cprod.get('production_pages_deploy_run')==B192_PAGES and cprod.get('production_live_resource_integrity_run')==B192_LIVE,'Build 192 closure Production proof IDs drifted')
req(cprod.get('products_route_proof_run')==B192_ROUTE and cprod.get('products_browser_proof_run')==B192_BROWSER,'Build 192 closure Product proofs drifted')
req(cprod.get('build_specific_proof_run')==B192_PROD_PROOF and cprod.get('remote_d1_queries')==0,'Build 192 closure zero-D1/build proof drifted')

# Build 193 candidate starts only from immutable Build 192 proof.
req(candidate.get('release')==467 and candidate.get('build')==193 and candidate.get('title')==TITLE,'Build 193 candidate identity drifted')
req(candidate.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 193 candidate must fail closed before external proof')
start=(candidate.get('starting_point') or {}).get('development') or {}; start_prod=(candidate.get('starting_point') or {}).get('production') or {}
req(start.get('sha')==B192_DEV and start.get('tree')==B192_TREE,'Build 193 candidate starting Development SHA/tree drifted')
req(start.get('system_gate_run')==B192_PROOFS['system_gate_run'] and start.get('quality_run')==B192_PROOFS['current_application_quality_run'],'Build 193 candidate System/Quality proof drifted')
req(start.get('it_admin_runtime_run')==B192_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run')==B192_PROOFS['branch_hygiene_run'],'Build 193 candidate I.T./Hygiene proof drifted')
req(start.get('build_specific_proof_run')==B192_BUILD_PROOF,'Build 193 candidate Build 192 proof drifted')
req(start_prod.get('main_sha')==B192_MAIN and start_prod.get('tree')==B192_TREE and start_prod.get('remote_d1_queries')==0,'Build 193 candidate Production predecessor drifted')
for key,value in (candidate.get('safety') or {}).items():
    if isinstance(value,bool): req(value is False,f'Build 193 safety must remain false: {key}')

# Current canonical migration stream is exact and Build 193 adds no schema work.
expected=[
 '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql',
 '0003_release464_business_growth.sql','0004_release465_storefront_quality.sql',
 '0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql'
]
rows=manifest.get('migrations') or []
req([x.get('file') for x in rows]==expected,'Build 193 canonical migrations must match current forward manifest through 0006')
req([int(x.get('version') or 0) for x in rows]==list(range(1,7)),'Build 193 canonical migration versions must remain contiguous 1-6')

# Current machine/I.T./human truth must converge on Build 193 / Build 192 predecessor.
for body,label in ((it_api,'I.T. API'),(preflight,'Deployment Preflight'),(reliability,'Reliability')):
    req(B192_DEV in body and B192_MAIN in body and B192_TREE in body,f'{label} missing exact Build 192 predecessor identities')
    for run in (*B192_PROOFS.values(),B192_PAGES,B192_LIVE):
        req(str(run) in body,f'{label} missing Build 192 proof {run}')
req('const BUILD=193;' in it_api and TITLE in it_api,'I.T. API must identify Build 193')
req('const BUILD=193;' in preflight and TITLE in preflight,'Deployment Preflight must identify Build 193')
req('CURRENT_RELIABILITY_BUILD=193' in reliability and TITLE in reliability,'Reliability must identify Build 193')
req('Release 467 Build 193' in it_client and 'Production GREEN authority' in it_client,'I.T. client must expose Build 193 and Production GREEN authority')
for page,label in ((it_page,'I.T. page'),(preflight_page,'Deployment Preflight page'),(reliability_page,'Reliability page')):
    req('Build 193' in page,f'{label} must identify Build 193')
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} must contain exactly one H1')
for body,label in ((ai,'AI_HANDOFF.md'),(project,'PROJECT_STATUS_AND_ROADMAP.md'),(index,'MARKDOWN_INDEX.md'),(guide,'I.T. restart guide')):
    req('Build 192' in body and 'Build 193' in body,f'{label} missing Build 192/193 handoff truth')
    req(B192_DEV in body and B192_MAIN in body,f'{label} missing Build 192 Development/Production identities')
req('Active candidate: **Release 467 Build 193' in ai,'AI handoff must mark Build 193 active')
req('| 193 | Current Authority & Handoff Convergence | Active candidate |' in project,'Project roadmap must mark Build 193 active candidate')
req('Current Release 467 restart authority — Build 193 candidate' in guide,'I.T. restart guide must identify Build 193 candidate')
req('0001' in guide and '0006' in guide,'I.T. restart guide must expose current canonical migration span')

# Build 171 must be retained without freezing current truth.
for token in ('retained historical release/restart authority proof','Current successor pointer','must not lead successor authority','current I.T. API must match current pointer build'):
    req(token.lower() in gate171.lower(),f'Build 171 retained gate missing successor-aware token: {token}')

# Roadmap and Build 193 doc.
active_successor_match=re.search(r"\*\*Build (\d+) — current(?: and final planned build)?\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
successor_roadmap=('**Build 193 — complete**' in roadmap and active_successor_build >= 199)
req(('**Build 193 — next/current planned work**' in roadmap) or ('**Build 193 — complete**' in roadmap and '**Build 194 — current**' in roadmap) or ('**Build 194 — complete**' in roadmap and '**Build 195 — current**' in roadmap) or ('**Build 195 — complete**' in roadmap and '**Build 196 — current**' in roadmap) or ('**Build 196 — complete**' in roadmap and '**Build 197 — current**' in roadmap) or ('**Build 197 — complete**' in roadmap and '**Build 198 — current**' in roadmap) or successor_roadmap,'193-204 roadmap must preserve Build 193 closure while allowing later successors')
req('**194** | D1 Evidence Headroom Optimization' in roadmap,'Build 194 successor scope missing')
for token in ('Current Authority & Handoff Convergence','76321bfc975862ce2463e87450852c19fc98c852','451ca8173b9ad3127f84f352ed0a8d7774e53b14','Build 171','0006','no live D1 work'):
    req(token.lower() in doc.lower(),f'Build 193 operations doc missing: {token}')

# Build 193 workflow is source/provenance only and D1-free.
for token in ('python scripts/release467_build193_gate.py','release467-build193-exact-evidence','branches: [dev, main]','pull_request:'):
    req(token in workflow,f'Build 193 workflow missing: {token}')
for forbidden in ('wrangler@4 d1 execute','CLOUDFLARE_API_TOKEN','PRODUCT_MEDIA_BUCKET','CAIP_PRIVATE_MEDIA_BUCKET'):
    req(forbidden not in workflow,f'Build 193 workflow must remain D1/R2/provider-free: {forbidden}')

for path in (
 'functions/api/admin/it-operations-control-tower.js','functions/api/admin/current-deployment-preflight.js',
 'functions/api/_lib/currentReliability.js','public/js/admin-it-control-tower.js'
):
    node(path)

# Run the release-neutral and retained predecessor contracts together.
for path,label in (
 ('scripts/release467_build171_gate.py','Build 171 retained authority'),
 ('scripts/release467_build192_gate.py','Build 192 convergence'),
 ('scripts/current_authority_restart_integrity_gate.py','Current authority restart integrity'),
 ('scripts/current_it_release_truth_gate.py','Current I.T. release truth'),
 ('scripts/current_deployment_preflight_truth_gate.py','Current Deployment Preflight truth'),
 ('scripts/current_reliability_truth_gate.py','Current Reliability truth'),
 ('scripts/repository_forward_sanity.py','Repository forward sanity'),
):
    run_gate(path,label)

if FAIL:
    print('RELEASE 467 BUILD 193 CURRENT AUTHORITY & HANDOFF CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)

print('RELEASE 467 BUILD 193 CURRENT AUTHORITY & HANDOFF CONVERGENCE: PASS')
print('Build 192 exact Development/Production closure: INGESTED')
print('Current pointer / I.T. / Preflight / Reliability / human handoff: BUILD 193 OVER BUILD 192')
print('Build 170/171 provenance: RETAINED HISTORICALLY')
print('Canonical migrations: 0001-0006 / NO BUILD 193 MIGRATION')
print('Build 193 live D1/R2/provider/payment/accounting work: ZERO')
