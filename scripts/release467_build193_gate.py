#!/usr/bin/env python3
"""Release 467 Build 193 — retained Current Authority & Handoff Convergence proof.

Build 193 remains immutable provenance over Build 192. Successor builds may advance the
current pointer and I.T./Preflight/Reliability surfaces, but must retain Build 192/193
artifacts and pass the release-neutral current-truth gates.
"""
from pathlib import Path
import json,re,subprocess,sys

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
gate171=read('scripts/release467_build171_gate.py')
workflow=read('.github/workflows/release467-build193-current-authority-handoff-convergence.yml')

# Immutable Build 192 closure.
req(closure.get('release')==467 and closure.get('build')==192 and closure.get('state')=='PRODUCTION_GREEN','Build 192 closure identity/state drifted')
final=closure.get('final_closure') or {}; cprod=closure.get('production_checkpoint') or {}
req(final.get('dev_sha')==B192_DEV and final.get('tree_sha')==B192_TREE and (final.get('proofs') or {})==B192_PROOFS,'Build 192 final Development closure drifted')
req(final.get('build_specific_proof_run')==B192_BUILD_PROOF and int(final.get('ingested_by_build') or 0)==193,'Build 192 closure must remain ingested by Build 193')
req(cprod.get('main_sha')==B192_MAIN and cprod.get('tree_sha')==B192_TREE,'Build 192 closure Production identity drifted')
req(cprod.get('production_pages_deploy_run')==B192_PAGES and cprod.get('production_live_resource_integrity_run')==B192_LIVE,'Build 192 closure Production proof IDs drifted')
req(cprod.get('products_route_proof_run')==B192_ROUTE and cprod.get('products_browser_proof_run')==B192_BROWSER,'Build 192 closure Product proofs drifted')
req(cprod.get('build_specific_proof_run')==B192_PROD_PROOF and cprod.get('remote_d1_queries')==0,'Build 192 closure zero-D1/build proof drifted')

# Immutable Build 193 candidate artifact.
req(candidate.get('release')==467 and candidate.get('build')==193 and candidate.get('title')==TITLE,'Build 193 candidate identity drifted')
req(candidate.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 193 candidate state drifted')
start=(candidate.get('starting_point') or {}).get('development') or {}; start_prod=(candidate.get('starting_point') or {}).get('production') or {}
req(start.get('sha')==B192_DEV and start.get('tree')==B192_TREE,'Build 193 candidate starting Development SHA/tree drifted')
req(start.get('system_gate_run')==B192_PROOFS['system_gate_run'] and start.get('quality_run')==B192_PROOFS['current_application_quality_run'],'Build 193 candidate System/Quality proof drifted')
req(start.get('it_admin_runtime_run')==B192_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run')==B192_PROOFS['branch_hygiene_run'],'Build 193 candidate I.T./Hygiene proof drifted')
req(start.get('build_specific_proof_run')==B192_BUILD_PROOF,'Build 193 candidate Build 192 proof drifted')
req(start_prod.get('main_sha')==B192_MAIN and start_prod.get('tree')==B192_TREE and start_prod.get('remote_d1_queries')==0,'Build 193 candidate Production predecessor drifted')
for key,value in (candidate.get('safety') or {}).items():
    if isinstance(value,bool): req(value is False,f'Build 193 safety must remain false: {key}')

# Canonical migration stream remains exactly the retained six-file stream.
expected=[
 '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql',
 '0003_release464_business_growth.sql','0004_release465_storefront_quality.sql',
 '0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql'
]
rows=manifest.get('migrations') or []
req([x.get('file') for x in rows]==expected,'Build 193 retained migration authority drifted')
req([int(x.get('version') or 0) for x in rows]==list(range(1,7)),'Build 193 retained migration versions drifted')

# Current successor pointer may advance, but Build 193/192 provenance must remain discoverable.
pointer_build=int(pointer.get('build') or 0)
req(pointer.get('release')==467 and pointer_build>=193,'current pointer must remain Release 467 Build 193 or newer')
authorities=[str(x) for x in (pointer.get('current_release_authorities') or [])]
if pointer_build==193:
    req(authorities[:2]==[CANDIDATE,CLOSURE],'Build 193 current authority chain drifted')
else:
    req(CANDIDATE in authorities and CLOSURE in authorities,'successor authority chain must retain Build 193/192 provenance')
    req(authorities and authorities[0]!=CANDIDATE,'Build 193 historical candidate must not lead successor authority')
req('release467-build171-release-restart-authority-convergence.json' in authorities,'Build 171 historical provenance must be retained')

# Historical human provenance must remain visible without freezing current truth.
for body,label in ((ai,'AI_HANDOFF.md'),(project,'PROJECT_STATUS_AND_ROADMAP.md'),(index,'MARKDOWN_INDEX.md'),(guide,'I.T. restart guide')):
    req('Retained historical provenance' in body and 'Build 193' in body and 'Build 192' in body,f'{label} must retain Build 192/193 historical provenance')
req(B192_DEV in doc and B192_MAIN in doc and B192_TREE in doc,'Build 193 operations doc lost exact Build 192 predecessor')
for token in ('retained historical release/restart authority proof','Current successor pointer','must not lead successor authority','current I.T. API must match current pointer build'):
    req(token.lower() in gate171.lower(),f'Build 171 retained gate missing successor-aware token: {token}')

# Historical roadmap and workflow remain immutable provenance.
active_successor_match=re.search(r"**Build (d+) — current(?: and final planned build)?**",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
req('**Build 193 — complete**' in roadmap and active_successor_build>=199,'193-204 roadmap must retain Build 193 closure provenance')
for token in ('python scripts/release467_build193_gate.py','release467-build193-exact-evidence','branches: [dev, main]','pull_request:'):
    req(token in workflow,f'Build 193 workflow missing: {token}')
for forbidden in ('wrangler@4 d1 execute','CLOUDFLARE_API_TOKEN','PRODUCT_MEDIA_BUCKET','CAIP_PRIVATE_MEDIA_BUCKET'):
    req(forbidden not in workflow,f'Build 193 workflow must remain D1/R2/provider-free: {forbidden}')

# Current release-neutral truth must stay valid for every successor.
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

for path in (
 'functions/api/admin/it-operations-control-tower.js','functions/api/admin/current-deployment-preflight.js',
 'functions/api/_lib/currentReliability.js','public/js/admin-it-control-tower.js'
):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 193 RETAINED CURRENT AUTHORITY & HANDOFF CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)

print('RELEASE 467 BUILD 193 RETAINED CURRENT AUTHORITY & HANDOFF CONVERGENCE: PASS')
print('Build 192 exact closure / Build 193 candidate: IMMUTABLE PROVENANCE')
print(f'Current successor pointer: RELEASE 467 BUILD {pointer_build}')
print('Build 170/171 provenance: RETAINED HISTORICALLY')
print('Canonical migrations: 0001-0006 / BUILD 193 LIVE D1 WORK ZERO')
