#!/usr/bin/env python3
from pathlib import Path
import json,os,subprocess,sys,urllib.request
ROOT=Path(__file__).resolve().parents[1]
REPO=os.environ.get('GITHUB_REPOSITORY','RosevearCreations/devilndove-site')
TOKEN=os.environ.get('GITHUB_TOKEN','')
OUT=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/build263-release-efficiency-outcomes.json')
HEADS={
'257-dev':'5e6fa8772be5946a0cd53eadbd4b3daa36fce253','257-prod':'9e95bca825599dea1459838e10812c74d799c976',
'258-dev':'3675554c0c2ce64923ec3e1763a243e03d103f1a','258-prod':'436c4e724efc736492f9772ffea7d5141feb3416',
'259-dev':'270eea921559b2439459180998cc367b6fe7c9bb','259-prod':'af294ad20ec26222ec0f7ccdb856f39de9fbbd2e',
'260-dev':'28b6f64d43f05e6c00a1cec579fa51f6a8797c0d','260-prod':'2f227d8ceb2239b5dc95b6f7a730c755a338d6f2',
'261-dev':'c4e57f8d4c47a709021fca65037b25f4e74d63e2','261-prod':'f90944f80ec193610d3b87312487799ec425d983',
'262-dev':'dddbbb4c7fe7dfff8f59a4d54048e37a33fcf764','262-prod':'e65d9122252e9832a9e29027b13af163cbb30914'}
BUILD_PROOFS={
257:'Release 467 Build 257 Workflow Trigger Inventory Ownership Map',
258:'Release 467 Build 258 Historical Workflow Trigger Scope Tightening',
259:'Release 467 Build 259 Reusable Exact-SHA Proof Composition',
260:'Release 467 Build 260 Pull-Request Matrix Fan-Out Reduction',
261:'Release 467 Build 261 Production Proof Dependency Orchestration',
262:'Release 467 Build 262 Operations Today-Tasks Read Fan-Out Review'}
DEV_REQUIRED=['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene']
PROD_REQUIRED=['Production Pages Deploy','Production Live Resource Integrity Proof','Release 467 Build 155 Products Production Browser Proof','Release 467 Build 154 Products Route Production Proof']
def api(path):
    if not TOKEN: raise RuntimeError('GITHUB_TOKEN is required')
    req=urllib.request.Request('https://api.github.com'+path,headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'build263-outcome-verifier'})
    with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
def runs_for(sha):
    data=api(f'/repos/{REPO}/actions/runs?head_sha={sha}&per_page=100')
    runs=data.get('workflow_runs') or []
    if int(data.get('total_count') or 0)>100:raise RuntimeError('accepted head has >100 runs; pagination required')
    return runs
def commit_tree(sha):return str((api(f'/repos/{REPO}/git/commits/{sha}').get('tree') or {}).get('sha') or '')
inv_path='/tmp/build263-workflow-inventory.json'
subprocess.run([sys.executable,str(ROOT/'scripts/release467_workflow_trigger_inventory.py'),inv_path],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
inv=json.loads(Path(inv_path).read_text())
tc=inv.get('trigger_counts') or {}
expected={'workflow_file_count':153,'pull_request':39,'push':127,'workflow_dispatch':135,'workflow_run':5}
assert inv.get('workflow_file_count')==expected['workflow_file_count'],(inv.get('workflow_file_count'),expected)
for k in ('pull_request','push','workflow_dispatch','workflow_run'):assert tc.get(k)==expected[k],(k,tc.get(k),expected[k])
detail={};tot={'runs':0,'success':0,'failure':0,'skipped':0,'cancelled':0,'other':0,'rerun_attempts':0}
failure_rows=[];proof_errors=[];trees={}
for label,sha in HEADS.items():
    runs=runs_for(sha); d={'total':len(runs),'success':0,'failure':0,'skipped':0,'cancelled':0,'other':0,'rerun_attempts':0}
    names_success={r.get('name') for r in runs if r.get('conclusion')=='success'}
    build=int(label.split('-')[0]); required=(DEV_REQUIRED if label.endswith('-dev') else PROD_REQUIRED)+[BUILD_PROOFS[build]]
    missing=[x for x in required if x not in names_success]
    if missing: proof_errors.append({'head':label,'missing_success':missing})
    for r in runs:
        c=r.get('conclusion')
        if c in ('success','failure','skipped','cancelled'):d[c]+=1
        else:d['other']+=1
        d['rerun_attempts']+=max(0,int(r.get('run_attempt') or 1)-1)
        if c=='failure':failure_rows.append({'head':label,'run_id':r.get('id'),'name':r.get('name'),'event':r.get('event')})
    for k in tot:tot[k]+=d[k] if k!='runs' else len(runs)
    detail[label]=d
for build in range(257,263):
    dt=commit_tree(HEADS[f'{build}-dev']);pt=commit_tree(HEADS[f'{build}-prod']);trees[str(build)]={'development':dt,'production':pt,'same_tree':dt==pt}
    if dt!=pt: proof_errors.append({'build':build,'tree_mismatch':[dt,pt]})
assert not proof_errors,proof_errors
assert tot=={'runs':596,'success':584,'failure':9,'skipped':3,'cancelled':0,'other':0,'rerun_attempts':0},tot
assert all(x['name']=='Release 467 Build 155 Products Development Browser Proof' for x in failure_rows),failure_rows
EXPECTED_CURRENT_RUNS_PER_HEAD=49.666667
EXPECTED_NORMALIZED_REDUCTION_PERCENT=20.0766
baseline_avg=870/14; current_avg=tot['runs']/12
normalized_reduction=(baseline_avg-current_avg)/baseline_avg*100
assert round(current_avg,6)==EXPECTED_CURRENT_RUNS_PER_HEAD,(current_avg,EXPECTED_CURRENT_RUNS_PER_HEAD)
assert round(normalized_reduction,4)==EXPECTED_NORMALIZED_REDUCTION_PERCENT,(normalized_reduction,EXPECTED_NORMALIZED_REDUCTION_PERCENT)
result={
'release':467,'build':263,'title':'Release Efficiency & Read-Budget Outcome Verification',
'exact_candidate_sha':os.environ.get('GITHUB_SHA',''),'workflow_inventory':{'workflow_files':inv.get('workflow_file_count'),'pull_request':tc.get('pull_request'),'push':tc.get('push'),'workflow_dispatch':tc.get('workflow_dispatch'),'workflow_run':tc.get('workflow_run')},
'accepted_heads':detail,'accepted_head_totals':tot,'exact_tree_continuity':trees,'required_named_proofs_green':True,
'historical_noncanonical_failures':failure_rows,'baseline_runs_per_head':round(baseline_avg,6),'current_runs_per_head':round(current_avg,6),
'normalized_runs_per_head_reduction_percent':round(normalized_reduction,4),
'build255_closure_runs':134,'build262_closure_runs':68,'build255_to_build262_reduction_percent':round((134-68)/134*100,4),
'workflow_mutation':False,'d1_mutation':False,'r2_mutation':False,'production_d1_contact':False}
OUT.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
print(json.dumps(result,indent=2,sort_keys=True))
