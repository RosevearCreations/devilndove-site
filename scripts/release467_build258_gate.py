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

a=j('release467-build258-historical-workflow-trigger-scope-tightening.json')
prev=j('release467-build257-workflow-trigger-inventory-ownership-map.json')
p=j('current-development-authority.json')
cur=int(p.get('build') or 0)
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
doc=t('docs/operations/RELEASE_467_BUILD_258_HISTORICAL_WORKFLOW_TRIGGER_SCOPE_TIGHTENING.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
workflow=t('.github/workflows/release467-build258-historical-workflow-trigger-scope-tightening.yml')
rel=t('functions/api/_lib/currentReliability.js');it=t('functions/api/admin/it-operations-control-tower.js')
pre=t('functions/api/admin/current-deployment-preflight.js');guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
itpage=t('admin/it/index.html');relpage=t('admin/reliability/index.html');prepage=t('admin/deployment-preflight/index.html')

q(a.get('build')==258 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 258 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='5e6fa8772be5946a0cd53eadbd4b3daa36fce253','Build 257 Development SHA missing')
q(pred.get('development_tree_sha')=='df03a29c947144f298f0908abf53ca3cdda1c159','Build 257 Development tree missing')
q(pred.get('production_main_sha')=='9e95bca825599dea1459838e10812c74d799c976','Build 257 Production main missing')
q(pred.get('production_tree_sha')=='df03a29c947144f298f0908abf53ca3cdda1c159' and pred.get('same_tree') is True,'Build 257 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 257 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='5e6fa8772be5946a0cd53eadbd4b3daa36fce253','Build 257 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='9e95bca825599dea1459838e10812c74d799c976','Build 257 Production checkpoint missing')

scope=a.get('scope') or {}
q(scope.get('target_build_span')=='242-257' and scope.get('target_workflow_count')==16,'Build 258 target span/count mismatch')
q(scope.get('retirement_mode')=='MANUAL_ONLY_PROVENANCE','Build 258 retirement mode mismatch')
q(scope.get('historical_proof_scripts_retained') is True and scope.get('workflow_files_deleted') is False,'Historical proof source retention missing')
q(scope.get('canonical_development_proofs_retained') is True and scope.get('canonical_production_proofs_retained') is True,'Canonical proof owners must remain retained')
q(scope.get('workflow_run_chains_retained')==5 and scope.get('exact_sha_promotion_preserved') is True,'workflow_run/exact-SHA retention missing')

targets=a.get('target_workflows') or []
q(len(targets)==16,'Build 258 must target exactly 16 historical workflows')
for path in targets:
    h=header(t(path))
    q('workflow_dispatch:' in h,f'{path} must remain manually dispatchable')
    q('pull_request:' not in h,f'{path} must not auto-run on pull requests')
    q('push:' not in h,f'{path} must not auto-run on pushes')
for n in range(242,258):
    q((R/f'scripts/release467_build{n}_gate.py').is_file(),f'Historical gate script missing for Build {n}')

with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as fh: out=fh.name
r=subprocess.run([sys.executable,'scripts/release467_workflow_trigger_inventory.py',out],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(r.returncode==0,f'Build 258 inventory failed: {(r.stderr or r.stdout)[-2000:]}')
report={}
try:report=json.loads(Path(out).read_text(encoding='utf-8'))
except Exception as e:q(False,f'Build 258 inventory report unreadable: {e}')
q(report.get('baseline_file_count')==146 and report.get('baseline_missing')==[],'Build 258 must retain every Build 257 baseline workflow')
tc=report.get('trigger_counts') or {}
if cur==258:
    q(report.get('workflow_file_count')==148,'Build 258 candidate must contain 148 workflow files')
    for k,v in {'pull_request':72,'push':122,'workflow_dispatch':123,'workflow_run':5,'issues':0,'schedule':0,'repository_dispatch':0,'workflow_call':0,'pull_request_target':0}.items():
        q(tc.get(k)==v,f'Build 258 trigger count mismatch: {k} expected {v} got {tc.get(k)}')
else:
    q(cur>=259 and report.get('workflow_file_count',0)>=149,'Build 259+ must retain Build 258 workflow plus successors')
    q(tc.get('workflow_run')==5,'Build 259+ must preserve the five workflow_run chains')
q((a.get('expected_candidate') or {}).get('net_pull_request_reduction')==15 and (a.get('expected_candidate') or {}).get('net_push_reduction')==15,'Build 258 net fan-out reduction mismatch')

canon=set(a.get('canonical_owners_retained') or [])
q(len(canon)==8,'Build 258 canonical owner set mismatch')
q(not canon.intersection(targets),'Canonical current proof owner cannot be in manual-only target set')
q("run_current_contract('scripts/release467_build258_gate.py','Release 467 Build 258')" in sysgate,'System Gate must invoke Build 258')
q(cur>=258 and int(p.get('next_build') or 0)>=259 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 258 or a verified successor')
if cur==258:
    q(p.get('accepted_dev_sha')=='5e6fa8772be5946a0cd53eadbd4b3daa36fce253' and p.get('accepted_dev_tree_sha')=='df03a29c947144f298f0908abf53ca3cdda1c159','Build 258 must start from exact Build 257 Development')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9e95bca825599dea1459838e10812c74d799c976','Build 258 Production baseline must be exact Build 257 Production')
else:
    final=a.get('final_closure') or {};prod=a.get('production_checkpoint') or {}
    q(a.get('state')=='PRODUCTION_GREEN','Build 259+ must retain Build 258 Production closure')
    q(final.get('dev_sha')=='3675554c0c2ce64923ec3e1763a243e03d103f1a' and final.get('tree_sha')=='64dab693be764fb11a3cb9c36d06352a2f02eb1a','Build 258 final Development closure mismatch')
    q(final.get('dedicated_gate_run')==36081394877,'Build 258 dedicated Development proof mismatch')
    q(prod.get('main_sha')=='436c4e724efc736492f9772ffea7d5141feb3416' and prod.get('tree_sha')=='64dab693be764fb11a3cb9c36d06352a2f02eb1a','Build 258 Production closure mismatch')
    q(prod.get('build_specific_proof_run')==36081526248,'Build 258 Production-specific proof mismatch')
q('Build 259 — Reusable Exact-SHA Proof Composition' in road,'Build 259 successor missing from roadmap')
for token in ('16','242','257','72','122','123','manual-only','Build 259'):
    q(token in doc,f'Build 258 document missing {token}')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(pre,'Preflight'),(itpage,'I.T. page'),(relpage,'Reliability page'),(prepage,'Preflight page'),(guide,'I.T. guide')):
    q(str(cur) in source and str(p.get('title') or '') in source,f'{label} must identify the current verified successor')
q('Recover exact Build 257 Development and Production workflow evidence' in workflow,'Build 258 exact predecessor recovery missing')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 258 safety drift: {k}')

print('RELEASE 467 BUILD 258 HISTORICAL WORKFLOW TRIGGER SCOPE TIGHTENING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Builds 242-257 historical proof workflows: MANUAL_ONLY_PROVENANCE')
print('Candidate trigger counts: pull_request=72 push=122 workflow_dispatch=123 workflow_run=5')
print('Historical gate scripts retained; canonical proof owners retained; exact-SHA promotion preserved')
print('Next: Build 259 — Reusable Exact-SHA Proof Composition')
