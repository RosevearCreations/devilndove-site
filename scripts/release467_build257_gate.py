#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys,tempfile
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def header(body):
    for marker in ('\npermissions:','\njobs:'):
        if marker in body:return body.split(marker,1)[0]
    return body

a=j('release467-build257-workflow-trigger-inventory-ownership-map.json')
prev=j('release467-build256-refinement-outcomes-renewal-ii.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
doc=t('docs/operations/RELEASE_467_BUILD_257_WORKFLOW_TRIGGER_INVENTORY_OWNERSHIP_MAP.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
workflow=t('.github/workflows/release467-build257-workflow-trigger-inventory-ownership-map.yml')
cur=int(p.get('build') or 0)

q(a.get('build')==257 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 257 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='601ea5eda5296c189388dc6df595d029687dfa1a','Build 256 Development SHA missing')
q(pred.get('development_tree_sha')=='f7f8d07bedc07cd6f335fcbb8fb1c2443cee2c06','Build 256 Development tree missing')
q(pred.get('production_main_sha')=='36f48e66ea71b5cf598fb8bb7a9abce10e5ff7b9','Build 256 Production main missing')
q(pred.get('production_tree_sha')=='f7f8d07bedc07cd6f335fcbb8fb1c2443cee2c06' and pred.get('same_tree') is True,'Build 256 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 256 successor-ingested Production closure missing')

inv=a.get('inventory') or {}
q(inv.get('baseline_workflow_files')==146 and inv.get('expected_candidate_workflow_files')==147,'Build 257 workflow baseline/candidate count mismatch')
q(inv.get('workflow_disabled') is False and inv.get('workflow_deleted') is False,'Build 257 original inventory build must not disable/delete workflows')
base=inv.get('baseline_trigger_search') or {}
for k,v in {'pull_request':86,'push':90,'workflow_dispatch':89,'workflow_run':5,'issues':1,'schedule':0,'repository_dispatch':0,'workflow_call':0,'pull_request_target':0}.items():
    q(base.get(k)==v,f'Build 257 baseline trigger count drift: {k}')

with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as fh: out=fh.name
r=subprocess.run([sys.executable,'scripts/release467_workflow_trigger_inventory.py',out],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(r.returncode==0,f'Build 257 inventory script failed: {(r.stderr or r.stdout)[-2000:]}')
report={}
try:report=json.loads(Path(out).read_text(encoding='utf-8'))
except Exception as e:q(False,f'Build 257 inventory report unreadable: {e}')
q(report.get('baseline_file_count')==146 and report.get('baseline_missing')==[],'Build 257 baseline workflows must remain retained')
q((report.get('trigger_counts') or {}).get('workflow_run')==5,'Build 257 must preserve five measured workflow_run chains')

if cur==257:
    q(report.get('workflow_file_count')==147,'Build 257 candidate must contain 147 workflow files')
    tc=report.get('trigger_counts') or {}
    q(tc.get('pull_request')>=87 and tc.get('push')>=91 and tc.get('workflow_dispatch')>=90,'Build 257 self-trigger additions are missing')
    q(p.get('accepted_dev_sha')=='601ea5eda5296c189388dc6df595d029687dfa1a','Build 257 must start from exact Build 256 Development')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='36f48e66ea71b5cf598fb8bb7a9abce10e5ff7b9','Build 257 Production baseline must be Build 256')
    q('Recover exact Build 256 Development and Production workflow evidence' in workflow,'Build 257 exact predecessor recovery missing')
elif cur>=258:
    q(a.get('state')=='PRODUCTION_GREEN','Build 258+ must retain Build 257 Production closure')
    final=a.get('final_closure') or {};prod=a.get('production_checkpoint') or {}
    q(final.get('dev_sha')=='5e6fa8772be5946a0cd53eadbd4b3daa36fce253' and final.get('tree_sha')=='df03a29c947144f298f0908abf53ca3cdda1c159','Build 257 final Development closure mismatch')
    q(final.get('dedicated_gate_run')==36077890220,'Build 257 dedicated Development proof mismatch')
    q(prod.get('main_sha')=='9e95bca825599dea1459838e10812c74d799c976' and prod.get('tree_sha')=='df03a29c947144f298f0908abf53ca3cdda1c159','Build 257 Production closure mismatch')
    q(prod.get('build_specific_proof_run')==36078158019,'Build 257 Production-specific proof mismatch')
    h=header(workflow)
    q('workflow_dispatch:' in h and 'pull_request:' not in h and 'push:' not in h,'Build 257 historical workflow must be manual-only from Build 258 onward')
    q(report.get('workflow_file_count',0)>=148,'Build 258+ must retain Build 257 workflow plus successors')
else:q(False,'Current authority cannot predate Build 257')

canon={x.get('path'):x.get('owner') for x in a.get('canonical_owners') or []}
for path,owner in {
 '.github/workflows/system-gate.yml':'DEVELOPMENT_SOURCE_SYSTEM',
 '.github/workflows/current-application-quality.yml':'DEVELOPMENT_APPLICATION_QUALITY',
 '.github/workflows/it-admin-runtime-proof.yml':'DEVELOPMENT_IT_RUNTIME',
 '.github/workflows/repository-branch-hygiene.yml':'REPOSITORY_HYGIENE',
 '.github/workflows/production-pages-deploy-current.yml':'PRODUCTION_DEPLOY',
 '.github/workflows/production-live-resource-integrity-proof.yml':'PRODUCTION_RESOURCE_INTEGRITY',
 '.github/workflows/release467-build155-products-production-browser.yml':'PRODUCTION_PRODUCT_BROWSER',
 '.github/workflows/release467-build154-products-route-production-proof.yml':'PRODUCTION_PRODUCT_ROUTE'
}.items():q(canon.get(path)==owner,f'Canonical workflow owner mismatch: {path}')

q('Build 257 — Workflow Trigger Inventory & Ownership Map' in road and 'Build 258 — Historical Workflow Trigger Scope Tightening' in road,'Build 257/258 roadmap authority missing')
for token in ('146','140','86','90','89','workflow_run','Build 258','No workflow is disabled'):
    q(token in doc,f'Build 257 evidence document missing {token}')
q("run_current_contract('scripts/release467_build257_gate.py','Release 467 Build 257')" in sysgate,'System Gate must invoke Build 257')
q(cur>=257 and int(p.get('next_build') or 0)>=258 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 257 or verified successor')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 257 safety drift: {k}')

print('RELEASE 467 BUILD 257 WORKFLOW TRIGGER INVENTORY & OWNERSHIP MAP')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Build 257 inventory provenance retained; Build 258+ may narrow historical automatic triggers while retaining the proof source')
