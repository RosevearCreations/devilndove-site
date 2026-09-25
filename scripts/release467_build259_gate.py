#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys,tempfile
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build259-reusable-exact-sha-proof-composition.json')
prev=j('release467-build258-historical-workflow-trigger-scope-tightening.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
doc=t('docs/operations/RELEASE_467_BUILD_259_REUSABLE_EXACT_SHA_PROOF_COMPOSITION.md')
action=t('.github/actions/release467-exact-sha-proof/action.yml')
verifier=t('scripts/release467_exact_sha_proof_composition.py')
wf258=t('.github/workflows/release467-build258-historical-workflow-trigger-scope-tightening.yml')
wf259=t('.github/workflows/release467-build259-reusable-exact-sha-proof-composition.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
rel=t('functions/api/_lib/currentReliability.js');it=t('functions/api/admin/it-operations-control-tower.js')
pre=t('functions/api/admin/current-deployment-preflight.js');guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
itpage=t('admin/it/index.html');relpage=t('admin/reliability/index.html');prepage=t('admin/deployment-preflight/index.html')

q(a.get('build')==259 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 259 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='3675554c0c2ce64923ec3e1763a243e03d103f1a','Build 258 Development SHA missing')
q(pred.get('development_tree_sha')=='64dab693be764fb11a3cb9c36d06352a2f02eb1a','Build 258 Development tree missing')
q(pred.get('production_main_sha')=='436c4e724efc736492f9772ffea7d5141feb3416','Build 258 Production main missing')
q(pred.get('production_tree_sha')=='64dab693be764fb11a3cb9c36d06352a2f02eb1a' and pred.get('same_tree') is True,'Build 258 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 258 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='3675554c0c2ce64923ec3e1763a243e03d103f1a','Build 258 final Development closure missing')
q((prev.get('final_closure') or {}).get('dedicated_gate_run')==36081394877,'Build 258 dedicated Development proof missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='436c4e724efc736492f9772ffea7d5141feb3416','Build 258 Production checkpoint missing')
q((prev.get('production_checkpoint') or {}).get('build_specific_proof_run')==36081526248,'Build 258 Production-specific proof missing')

comp=a.get('composition') or {}
q(comp.get('mode')=='READ_ONLY_EXACT_SHA_NAMED_PROOF_COMPOSITION','Build 259 composition mode mismatch')
q(comp.get('exact_head_sha_filter') is True and comp.get('completed_success_required') is True,'Build 259 exact-SHA/success requirements missing')
q(comp.get('missing_or_non_green_fails_closed') is True and comp.get('mutation_capability')=='NONE','Build 259 must fail closed and remain read-only')
q(comp.get('build258_current_workflow_refactored') is True and comp.get('build259_workflow_uses_same_component') is True,'Build 259 reuse evidence missing')
q(comp.get('historical_manual_only_builds_242_257_rewritten') is False,'Build 259 must not rewrite historical manual-only workflows')

for token in ('using: composite','github_token:','development_sha:','production_sha:','build_proof_name:','scripts/release467_exact_sha_proof_composition.py'):
    q(token in action,f'Reusable composite action missing {token}')
for token in ('DEV_REQUIRED=', 'PROD_REQUIRED=', 'System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene','Production Pages Deploy','Production Live Resource Integrity Proof','Release 467 Build 155 Products Production Browser Proof','Release 467 Build 154 Products Route Production Proof','headSha','completed','success','EXACT_SHA_PROOF_COMPOSITION_SELF_TEST=PASS'):
    q(token in verifier,f'Exact-SHA verifier missing contract token: {token}')
selftest=subprocess.run([sys.executable,'scripts/release467_exact_sha_proof_composition.py','--self-test'],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(selftest.returncode==0 and 'EXACT_SHA_PROOF_COMPOSITION_SELF_TEST=PASS' in selftest.stdout,'Reusable exact-SHA verifier self-test failed')

for body,label in ((wf258,'Build 258'),(wf259,'Build 259')):
    q('uses: ./.github/actions/release467-exact-sha-proof' in body,f'{label} workflow must use reusable exact-SHA action')
    q("gh','run','list" not in body and 'MISSING_OR_NOT_GREEN' not in body,f'{label} workflow must not retain duplicated inline proof recovery')
q('development_sha: 5e6fa8772be5946a0cd53eadbd4b3daa36fce253' in wf258 and 'production_sha: 9e95bca825599dea1459838e10812c74d799c976' in wf258,'Build 258 composed predecessor SHA binding drifted')
q('development_sha: 3675554c0c2ce64923ec3e1763a243e03d103f1a' in wf259 and 'production_sha: 436c4e724efc736492f9772ffea7d5141feb3416' in wf259,'Build 259 composed predecessor SHA binding missing')
q('build_proof_name: Release 467 Build 258 Historical Workflow Trigger Scope Tightening' in wf259,'Build 259 build-specific predecessor proof name missing')

with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as fh: out=fh.name
r=subprocess.run([sys.executable,'scripts/release467_workflow_trigger_inventory.py',out],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(r.returncode==0,f'Build 259 inventory failed: {(r.stderr or r.stdout)[-2000:]}')
report={}
try:report=json.loads(Path(out).read_text(encoding='utf-8'))
except Exception as e:q(False,f'Build 259 inventory report unreadable: {e}')
q(report.get('workflow_file_count')==149,'Build 259 candidate must contain 149 workflow files')
tc=report.get('trigger_counts') or {}
for k,v in {'pull_request':73,'push':123,'workflow_dispatch':124,'workflow_run':5,'issues':0,'schedule':0,'repository_dispatch':0,'workflow_call':0,'pull_request_target':0}.items():
    q(tc.get(k)==v,f'Build 259 trigger count mismatch: {k} expected {v} got {tc.get(k)}')

q("run_current_contract('scripts/release467_build259_gate.py','Release 467 Build 259')" in sysgate,'System Gate must invoke Build 259')
q(int(p.get('build') or 0)==259 and int(p.get('next_build') or 0)==260 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 259 and successor 260')
q(p.get('accepted_dev_sha')=='3675554c0c2ce64923ec3e1763a243e03d103f1a' and p.get('accepted_dev_tree_sha')=='64dab693be764fb11a3cb9c36d06352a2f02eb1a','Build 259 must start from exact Build 258 Development')
q((p.get('production_checkpoint') or {}).get('main_sha')=='436c4e724efc736492f9772ffea7d5141feb3416','Build 259 Production baseline must be exact Build 258 Production')
q('Build 260 — Pull-Request Matrix Fan-Out Reduction' in road,'Build 260 successor missing from roadmap')
for token in ('read-only reusable composition','System Gate','Production Pages Deploy','149 workflow files','73 pull_request','123 push','124 workflow_dispatch','Build 260'):
    q(token in doc,f'Build 259 document missing {token}')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(pre,'Preflight'),(itpage,'I.T. page'),(relpage,'Reliability page'),(prepage,'Preflight page'),(guide,'I.T. guide')):
    q('259' in source and 'Reusable Exact-SHA Proof Composition' in source,f'{label} must identify Build 259')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 259 safety drift: {k}')

print('RELEASE 467 BUILD 259 REUSABLE EXACT-SHA PROOF COMPOSITION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Reusable component: exact-SHA + named Development/Production proofs + fail-closed success selection')
print('Build 258 and Build 259 workflows use the same read-only composition')
print('Next: Build 260 — Pull-Request Matrix Fan-Out Reduction')
