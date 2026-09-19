#!/usr/bin/env python3
"""Release 467 Build 171 — retained historical release/restart authority proof.

Build 171 was the machine/I.T. convergence candidate over exact Build 170. Successor builds
must preserve that reviewed artifact and Build 170 closure as provenance without forcing the
current pointer or current human/I.T. surfaces to remain frozen at Build 171.
"""
from pathlib import Path
import json,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA='879c8730040afaf6caec6374b5057b7261fdcfe2'
BASE_TREE='da5e3b249d6e14266da5e191cb22c06205947948'
DEV_PROOFS={'system_gate_run':35275441340,'current_application_quality_run':35275441446,'it_admin_runtime_proof_run':35275441412,'branch_hygiene_run':35275441448}
PROD_PAGES=35275636873
PROD_LIVE=35275711398
PROD_BROWSER=35275711387
PROD_ROUTE=35275711471
TITLE='Release & Restart Authority Convergence'
CANDIDATE='release467-build171-release-restart-authority-convergence.json'
CLOSURE='release467-build170-product-browser-explicit-image-recovery-closure.json'

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path))
    except Exception as error: FAIL.append(f'invalid JSON {path}: {error}'); return {}
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

pointer=load('current-development-authority.json')
candidate=load(CANDIDATE)
closure=load(CLOSURE)
manifest=load('migrations/canonical/manifest.json')
ai=read('AI_HANDOFF.md')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
index=read('MARKDOWN_INDEX.md')
guide=read('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
api=read('functions/api/admin/it-operations-control-tower.js')
client=read('public/js/admin-it-control-tower.js')
page=read('admin/it/index.html')

# Immutable Build 170 closure.
req(closure.get('release')==467 and closure.get('build')==170 and closure.get('state')=='PRODUCTION_GREEN','Build 170 closure identity/state mismatch')
final=closure.get('final_closure') or {}
prod170=closure.get('production') or closure.get('production_checkpoint') or {}
dev170=closure.get('development') or {}
req((dev170.get('dev_sha') or dev170.get('sha'))==BASE_SHA,'Build 170 closure Development SHA drifted')
req((dev170.get('tree_sha') or dev170.get('tree'))==BASE_TREE,'Build 170 closure tree drifted')
req(final.get('dev_sha')==BASE_SHA and final.get('tree_sha')==BASE_TREE,'Build 170 final closure SHA/tree drifted')
req((final.get('proofs') or {})==DEV_PROOFS,'Build 170 final proof set drifted')
req(int(final.get('ingested_by_build') or 0)==171,'Build 170 closure must remain ingested by Build 171')
req(prod170.get('main_sha')==BASE_SHA and prod170.get('tree_sha')==BASE_TREE,'Build 170 Production SHA/tree drifted')
req(int(prod170.get('production_pages_deploy_run') or 0)==PROD_PAGES,'Build 170 Production Pages proof drifted')
req(int(prod170.get('production_live_resource_integrity_run') or 0)==PROD_LIVE,'Build 170 live-resource proof drifted')
req(int(prod170.get('products_browser_proof_run') or 0)==PROD_BROWSER,'Build 170 Product Browser proof drifted')
req(int(prod170.get('products_route_proof_run') or 0)==PROD_ROUTE,'Build 170 Product Route proof drifted')

# Immutable Build 171 candidate artifact.
req(candidate.get('release')==467 and candidate.get('build')==171 and candidate.get('title')==TITLE,'Build 171 candidate identity mismatch')
req(candidate.get('state')=='DEVELOPMENT_CANDIDATE','Build 171 historical candidate state drifted')
start=(candidate.get('starting_point') or {}).get('development') or {}
req(start.get('sha')==BASE_SHA and start.get('tree')==BASE_TREE,'Build 171 starting SHA/tree drifted')
req(int(start.get('system_gate_run') or 0)==DEV_PROOFS['system_gate_run'],'Build 171 starting System proof drifted')
req(int(start.get('quality_run') or 0)==DEV_PROOFS['current_application_quality_run'],'Build 171 starting Quality proof drifted')
req(int(start.get('it_admin_runtime_run') or 0)==DEV_PROOFS['it_admin_runtime_proof_run'],'Build 171 starting I.T. proof drifted')
req(int(start.get('repository_hygiene_run') or 0)==DEV_PROOFS['branch_hygiene_run'],'Build 171 starting Hygiene proof drifted')
safety=candidate.get('safety') or {}
for key in ('schema_change','request_time_ddl','d1_business_data_mutation','r2_listing','r2_mutation','provider_execution','provider_publication','payment_refund_accounting_mutation','product_runtime_change'):
    req(safety.get(key) is False,f'Build 171 historical safety drifted: {key}')

# Current pointer may be Build 171 during historical replay or any later successor.
pointer_build=int(pointer.get('build') or 0)
req(pointer.get('release')==467 and pointer_build>=171,'current pointer may not regress behind Release 467 Build 171')
authorities=pointer.get('current_release_authorities') or []
req(CANDIDATE in authorities,'current authority chain must retain Build 171 historical candidate')
req(CLOSURE in authorities,'current authority chain must retain Build 170 historical closure')
if pointer_build==171:
    req(authorities and authorities[0]==CANDIDATE,'Build 171 candidate must lead authority chain while current')
    req(pointer.get('accepted_dev_sha')==BASE_SHA and pointer.get('accepted_dev_tree_sha')==BASE_TREE,'Build 171 current pointer predecessor drifted')
else:
    last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
    req(int(last.get('build') or 0)>=192,'successor restart authority must have advanced to Build 192 or later')
    req(authorities and authorities[0]!=CANDIDATE,'Build 171 historical candidate must not lead successor authority')
    for body,label in ((ai,'AI_HANDOFF.md'),(roadmap,'PROJECT_STATUS_AND_ROADMAP.md'),(index,'MARKDOWN_INDEX.md'),(guide,'I.T. restart guide')):
        req('Retained historical provenance' in body and 'Build 171' in body,f'{label} must retain Build 171 as historical provenance')
        req(BASE_SHA in body,f'{label} missing immutable Build 170 predecessor SHA')

# Canonical stream may grow, but the prefix reviewed by Build 171 is immutable.
expected_prefix=[
 '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql',
 '0003_release464_business_growth.sql','0004_release465_storefront_quality.sql',
 '0005_release467_inventory_process_assignment.sql'
]
rows=manifest.get('migrations') or []
files=[row.get('file') for row in rows]
req(files[:len(expected_prefix)]==expected_prefix,'Build 171 canonical migration prefix changed')
req([int(row.get('version') or 0) for row in rows]==list(range(1,len(rows)+1)),'canonical successor migration sequence is not contiguous')

# Current I.T. surfaces must remain syntactically valid and may advance beyond Build 171.
m=re.search(r'const BUILD\s*=\s*(\d+)\s*;',api)
req(m and int(m.group(1))==pointer_build,'current I.T. API must match current pointer build')
req(f'Release 467 Build {pointer_build}' in client,'current I.T. client must match current pointer build')
req(f'Release 467 Build {pointer_build}' in page,'current I.T. page must match current pointer build')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'I.T. page must retain exactly one H1')
req('onRequestPost' not in api,'current I.T. release endpoint must remain read-only')

for path in ('functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/admin/current-deployment-preflight.js','functions/api/_lib/currentReliability.js'):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 171 RETAINED RELEASE/RESTART AUTHORITY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 171 RETAINED RELEASE/RESTART AUTHORITY: PASS')
print('Build 170 exact closure: IMMUTABLE')
print('Build 171 candidate artifact: HISTORICAL PROVENANCE')
print(f'Current successor pointer: RELEASE 467 BUILD {pointer_build}')
print('Current I.T./Preflight/Reliability may advance; Build 171 no longer freezes current truth')
