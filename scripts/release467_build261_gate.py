#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys,tempfile
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def triggers(body):
    found=set()
    m=re.search(r'(?m)^on:\s*\[([^\]]+)\]\s*$',body)
    if m:
        for item in m.group(1).split(','):
            key=item.strip().strip("'\"")
            if key:found.add(key)
    m=re.search(r'(?m)^on:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$',body)
    if m:found.add(m.group(1))
    lines=body.splitlines()
    for i,line in enumerate(lines):
        if re.match(r'^on:\s*$',line):
            for child in lines[i+1:]:
                if child and not child.startswith((' ','\t')):break
                mm=re.match(r'^\s{2}([A-Za-z_][A-Za-z0-9_-]*):',child)
                if mm:found.add(mm.group(1))
            break
    return found
def push_branches(body):
    lines=body.splitlines()
    for i,line in enumerate(lines):
        if re.match(r'^\s{2}push:\s*$',line):
            for child in lines[i+1:]:
                if child and not child.startswith((' ','\t')):break
                m=re.match(r'^\s{4}branches:\s*\[([^\]]+)\]\s*$',child)
                if m:return [x.strip().strip("'\"") for x in m.group(1).split(',')]
    return []
a=j('release467-build261-production-proof-dependency-orchestration.json')
doc=t('docs/operations/RELEASE_467_BUILD_261_PRODUCTION_PROOF_DEPENDENCY_ORCHESTRATION.md')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
wf=t('.github/workflows/release467-build261-production-proof-dependency-orchestration.yml')
q(a.get('build')==261 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 261 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='28b6f64d43f05e6c00a1cec579fa51f6a8797c0d','Build 260 Development SHA missing')
q(pred.get('development_tree_sha')=='bde6ee54115f549d47f9d1fcf1f59b016f099a79','Build 260 Development tree missing')
q(pred.get('production_main_sha')=='2f227d8ceb2239b5dc95b6f7a730c755a338d6f2','Build 260 Production main missing')
q(pred.get('production_tree_sha')=='bde6ee54115f549d47f9d1fcf1f59b016f099a79' and pred.get('same_tree') is True,'Build 260 exact-tree continuity missing')
target_builds=list(range(206,242))+[258,259,260]
paths=[]
for n in target_builds:
    matches=sorted(R.glob(f'.github/workflows/release467-build{n}-*.yml'))+sorted(R.glob(f'.github/workflows/release467-build{n}-*.yaml'))
    q(len(matches)==1,f'Build {n} must resolve to one historical workflow, got {len(matches)}')
    if len(matches)!=1:continue
    p=matches[0];paths.append(p)
    body=p.read_text(encoding='utf-8',errors='replace')
    ts=triggers(body);branches=push_branches(body)
    q('push' in ts,f'{p.as_posix()} must retain Development push evidence')
    q('workflow_dispatch' in ts,f'{p.as_posix()} must retain manual evidence')
    q('dev' in branches and 'main' not in branches,f'{p.as_posix()} push must be Development-only')
    q((R/f'scripts/release467_build{n}_gate.py').is_file(),f'Build {n} gate script must remain')
q(len(paths)==39,'Build 261 must resolve all 39 historical Production push targets')
prod=t('.github/workflows/production-pages-deploy-current.yml')
live=t('.github/workflows/production-live-resource-integrity-proof.yml')
browser=t('.github/workflows/release467-build155-products-production-browser.yml')
route=t('.github/workflows/release467-build154-products-route-production-proof.yml')
q('push:' in prod and 'branches: [main]' in prod,'Production Pages Deploy must remain on main push')
for body,label in ((live,'Live Resource'),(browser,'Product Browser'),(route,'Product Route')):
    q('workflow_run:' in body and 'Production Pages Deploy' in body,f'{label} must remain a Production Pages workflow_run dependency')
q('github.event.workflow_run.conclusion' in live and "head_branch == 'main'" in live,'Live Resource exact Production dependency guard missing')
q('branches: [main]' in browser and 'github.event.workflow_run.conclusion' in browser,'Product Browser exact Production dependency guard missing')
q("head_branch == 'main'" in route and 'github.event.workflow_run.conclusion' in route,'Product Route exact Production dependency guard missing')
with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as fh:out=fh.name
r=subprocess.run([sys.executable,'scripts/release467_workflow_trigger_inventory.py',out],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
q(r.returncode==0,f'Build 261 inventory failed: {(r.stderr or r.stdout)[-2000:]}')
report={}
try:report=json.loads(Path(out).read_text(encoding='utf-8'))
except Exception as e:q(False,f'Build 261 inventory unreadable: {e}')
tc=report.get('trigger_counts') or {}
successor_active=(R/'release467-build262-operations-today-tasks-read-fanout-review.json').is_file()
if not successor_active:
    for k,v in {'pull_request':37,'push':125,'workflow_dispatch':133,'workflow_run':5,'issues':0}.items():
        q(tc.get(k)==v,f'Build 261 trigger count mismatch: {k} expected {v} got {tc.get(k)}')
else:
    q(report.get('workflow_file_count',0)>=152,'Build 262+ must retain Build 261 workflow and successors')
    q(tc.get('workflow_run')==5,'Build 262+ must preserve the five workflow_run chains')
    q(tc.get('issues')==0,'Build 262+ must not introduce issues triggers')
expected_runs={
'.github/workflows/production-live-resource-integrity-proof.yml',
'.github/workflows/recovery-product-r2-reference-preflight.yml',
'.github/workflows/release467-build154-products-route-production-proof.yml',
'.github/workflows/release467-build155-products-development-browser.yml',
'.github/workflows/release467-build155-products-production-browser.yml'}
q(set(report.get('workflow_run_paths') or [])==expected_runs,'Build 261 must retain the exact five workflow_run chains')
q('uses: ./.github/actions/release467-exact-sha-proof' in wf,'Build 261 must use reusable exact-SHA proof composition')
q('development_sha: 28b6f64d43f05e6c00a1cec579fa51f6a8797c0d' in wf and 'production_sha: 2f227d8ceb2239b5dc95b6f7a730c755a338d6f2' in wf,'Build 261 exact Build 260 SHA binding missing')
q('build_proof_name: Release 467 Build 260 Pull-Request Matrix Fan-Out Reduction' in wf,'Build 261 predecessor proof name missing')
q('Build 262 — Operations Today-Tasks Read Fan-Out Review' in road,'Build 262 successor missing from roadmap')
for token in ('39','206','241','258','260','Production Pages Deploy','5','Build 262'):
    q(token in doc,f'Build 261 document missing {token}')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 261 safety drift: {k}')
print('RELEASE 467 BUILD 261 PRODUCTION PROOF DEPENDENCY ORCHESTRATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Historical Production main push subscriptions removed: 39 / Builds 206-241 + 258-260')
print('Development push/manual evidence retained')
print('Canonical Production Pages + Live Resource + Product Browser + Product Route proofs retained')
print('workflow_run chains retained: 5')
print('Next: Build 262 — Operations Today-Tasks Read Fan-Out Review')
