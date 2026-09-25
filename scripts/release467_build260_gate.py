#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys,tempfile
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def header(body):
    for marker in ('\npermissions:','\njobs:'):
        if marker in body:return body.split(marker,1)[0]
    return body

a=j('release467-build260-pull-request-matrix-fanout-reduction.json')
prev=j('release467-build259-reusable-exact-sha-proof-composition.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
doc=t('docs/operations/RELEASE_467_BUILD_260_PULL_REQUEST_MATRIX_FANOUT_REDUCTION.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
wf=t('.github/workflows/release467-build260-pull-request-matrix-fanout-reduction.yml')
rel=t('functions/api/_lib/currentReliability.js');it=t('functions/api/admin/it-operations-control-tower.js')
pre=t('functions/api/admin/current-deployment-preflight.js');guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')
itpage=t('admin/it/index.html');relpage=t('admin/reliability/index.html');prepage=t('admin/deployment-preflight/index.html')

q(a.get('build')==260 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 260 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='270eea921559b2439459180998cc367b6fe7c9bb','Build 259 Development SHA missing')
q(pred.get('development_tree_sha')=='e81b613e5a4b491927ab89c89800345025853b99','Build 259 Development tree missing')
q(pred.get('production_main_sha')=='af294ad20ec26222ec0f7ccdb856f39de9fbbd2e','Build 259 Production main missing')
q(pred.get('production_tree_sha')=='e81b613e5a4b491927ab89c89800345025853b99' and pred.get('same_tree') is True,'Build 259 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 259 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='270eea921559b2439459180998cc367b6fe7c9bb','Build 259 final Development closure missing')
q((prev.get('final_closure') or {}).get('dedicated_gate_run')==36082783905,'Build 259 dedicated Development proof missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='af294ad20ec26222ec0f7ccdb856f39de9fbbd2e','Build 259 Production checkpoint missing')
q((prev.get('production_checkpoint') or {}).get('build_specific_proof_run')==36082914063,'Build 259 Production-specific proof missing')

red=a.get('reduction') or {}
q(red.get('target_workflow_count')==38 and red.get('target_build_span')=='206-241,258-259','Build 260 target span/count mismatch')
q(red.get('mode')=='REMOVE_PULL_REQUEST_TRIGGER_ONLY','Build 260 reduction mode mismatch')
q(red.get('push_triggers_retained') is True and red.get('workflow_dispatch_retained') is True,'Build 260 push/manual retention missing')
q(red.get('workflow_files_deleted') is False and red.get('gate_scripts_deleted') is False,'Build 260 must retain workflows/gate scripts')
q(red.get('system_gate_contract_coverage') is True and red.get('exact_sha_promotion_preserved') is True,'Build 260 current proof semantics missing')

target_builds=list(range(206,242))+[258,259]
target_paths=[]
for n in target_builds:
    matches=sorted(R.glob(f'.github/workflows/release467-build{n}-*.yml'))+sorted(R.glob(f'.github/workflows/release467-build{n}-*.yaml'))
    q(len(matches)==1,f'Build {n} must resolve to exactly one target workflow, got {len(matches)}')
    if len(matches)!=1:continue
    path=matches[0];target_paths.append(path)
    h=header(path.read_text(encoding='utf-8',errors='replace'))
    q('pull_request:' not in h,f'{path.as_posix()} must not auto-run on pull requests')
    q('push:' in h,f'{path.as_posix()} must retain push evidence')
    q('workflow_dispatch:' in h,f'{path.as_posix()} must retain manual evidence')
    q((R/f'scripts/release467_build{n}_gate.py').is_file(),f'Build {n} gate script must be retained')
    q(f"run_current_contract('scripts/release467_build{n}_gate.py'" in sysgate,f'System Gate must retain Build {n} contract coverage')
q(len(target_paths)==38,'Build 260 must resolve all 38 target workflows')

with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as fh: out=fh.name
r=subprocess.run([sys.executable,'scripts/release467_workflow_trigger_inventory.py',out],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(r.returncode==0,f'Build 260 inventory failed: {(r.stderr or r.stdout)[-2000:]}')
report={}
try:report=json.loads(Path(out).read_text(encoding='utf-8'))
except Exception as e:q(False,f'Build 260 inventory report unreadable: {e}')
q(report.get('workflow_file_count')==150,'Build 260 candidate must contain 150 workflow files')
q(report.get('baseline_file_count')==146 and report.get('baseline_missing')==[],'Build 260 must retain every Build 257 baseline workflow')
tc=report.get('trigger_counts') or {}
for k,v in {'pull_request':36,'push':124,'workflow_dispatch':125,'workflow_run':5,'issues':0,'schedule':0,'repository_dispatch':0,'workflow_call':0,'pull_request_target':0}.items():
    q(tc.get(k)==v,f'Build 260 trigger count mismatch: {k} expected {v} got {tc.get(k)}')
exp=a.get('expected_candidate') or {}
q(exp.get('scanner_pr_reduction_from_build259')==37 and exp.get('scanner_pr_reduction_from_build256')==51,'Build 260 measured scanner reduction mismatch')
q((a.get('baseline') or {}).get('build259_actual_pr_runs')==72 and exp.get('expected_actual_pr_runs')==35,'Build 260 exact PR run baseline/target mismatch')

q('uses: ./.github/actions/release467-exact-sha-proof' in wf,'Build 260 must use reusable exact-SHA proof composition')
q('development_sha: 270eea921559b2439459180998cc367b6fe7c9bb' in wf and 'production_sha: af294ad20ec26222ec0f7ccdb856f39de9fbbd2e' in wf,'Build 260 exact predecessor SHA binding missing')
q('build_proof_name: Release 467 Build 259 Reusable Exact-SHA Proof Composition' in wf,'Build 260 predecessor build-specific proof name missing')
q("run_current_contract('scripts/release467_build260_gate.py','Release 467 Build 260')" in sysgate,'System Gate must invoke Build 260')
q(int(p.get('build') or 0)==260 and int(p.get('next_build') or 0)==261 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 260 and successor 261')
q(p.get('accepted_dev_sha')=='270eea921559b2439459180998cc367b6fe7c9bb' and p.get('accepted_dev_tree_sha')=='e81b613e5a4b491927ab89c89800345025853b99','Build 260 must start from exact Build 259 Development')
q((p.get('production_checkpoint') or {}).get('main_sha')=='af294ad20ec26222ec0f7ccdb856f39de9fbbd2e','Build 260 Production baseline must be exact Build 259 Production')
q('Build 261 — Production Proof Dependency Orchestration' in road,'Build 261 successor missing from roadmap')
for token in ('38','206','241','258','259','36 pull_request','124 push','125 workflow_dispatch','Build 261'):
    q(token in doc,f'Build 260 document missing {token}')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(pre,'Preflight'),(itpage,'I.T. page'),(relpage,'Reliability page'),(prepage,'Preflight page'),(guide,'I.T. guide')):
    q('260' in source and 'Pull-Request Matrix Fan-Out Reduction' in source,f'{label} must identify Build 260')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 260 safety drift: {k}')

print('RELEASE 467 BUILD 260 PULL-REQUEST MATRIX FAN-OUT REDUCTION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Historical PR-only trigger removals: 38 workflows / Builds 206-241 + 258-259')
print('Candidate trigger counts: pull_request=36 push=124 workflow_dispatch=125 workflow_run=5')
print('Push/manual evidence, System Gate contracts, exact-SHA promotion and named Production proofs retained')
print('Next: Build 261 — Production Proof Dependency Orchestration')
