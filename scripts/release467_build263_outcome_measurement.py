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
PROOF_RUN_IDS={
257:{'dev':[36077891398,36077890063,36077891374,36077890258,36077890220],'prod':[36078157785,36078244247,36078244252,36078244289,36078158019]},
258:{'dev':[36081394811,36081394936,36081394824,36081394851,36081394877],'prod':[36081526239,36081651628,36081651602,36081651629,36081526248]},
259:{'dev':[36082784059,36082784168,36082783908,36082784042,36082783905],'prod':[36082913970,36082967263,36082967302,36082967286,36082914063]},
260:{'dev':[36084629755,36084629532,36084629588,36084629993,36084629902],'prod':[36084774858,36084851964,36084851996,36084851949,36084775035]},
261:{'dev':[36087874819,36087874854,36087874772,36087874784,36087874900],'prod':[36088094461,36088159346,36088159392,36088159367,36088094406]},
262:{'dev':[36132080145,36132080034,36132080001,36132080008,36132080219],'prod':[36132870627,36133110145,36133110183,36133110049,36132870623]}}
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
def run_by_id(run_id):return api(f'/repos/{REPO}/actions/runs/{run_id}')
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
    all_runs=runs_for(sha)
    build=int(label.split('-')[0]); lane='dev' if label.endswith('-dev') else 'prod'
    required=(DEV_REQUIRED if lane=='dev' else PROD_REQUIRED)+[BUILD_PROOFS[build]]
    recorded=PROOF_RUN_IDS[build][lane]
    recorded_rows=[run_by_id(run_id) for run_id in recorded]
    recorded_names=[r.get('name') for r in recorded_rows]
    if recorded_names!=required: proof_errors.append({'head':label,'recorded_proof_name_mismatch':{'expected':required,'actual':recorded_names}})
    for r in recorded_rows:
        if r.get('status')!='completed' or r.get('conclusion')!='success' or r.get('head_sha')!=sha:
            proof_errors.append({'head':label,'recorded_proof_not_exact_green':{'run_id':r.get('id'),'name':r.get('name'),'status':r.get('status'),'conclusion':r.get('conclusion'),'head_sha':r.get('head_sha'),'expected_sha':sha}})
    cutoff=max(str(r.get('updated_at') or r.get('created_at')) for r in recorded_rows)
    runs=[r for r in all_runs if str(r.get('created_at') or '')<=cutoff]
    later=[r for r in all_runs if str(r.get('created_at') or '')>cutoff]
    d={'closure_cutoff':cutoff,'total':len(runs),'success':0,'failure':0,'skipped':0,'cancelled':0,'other':0,'rerun_attempts':0,'current_all_time_total':len(all_runs),'post_closure_runs':len(later)}
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
baseline_avg=870/14; current_avg=tot['runs']/12
normalized_reduction=(baseline_avg-current_avg)/baseline_avg*100
build262_closure_runs=detail['262-dev']['total']+detail['262-prod']['total']
assert current_avg<baseline_avg,(current_avg,baseline_avg)
assert build262_closure_runs<134,(build262_closure_runs,134)
result={
'release':467,'build':263,'title':'Release Efficiency & Read-Budget Outcome Verification',
'exact_candidate_sha':os.environ.get('GITHUB_SHA',''),'workflow_inventory':{'workflow_files':inv.get('workflow_file_count'),'pull_request':tc.get('pull_request'),'push':tc.get('push'),'workflow_dispatch':tc.get('workflow_dispatch'),'workflow_run':tc.get('workflow_run')},
'measurement_mode':'CLOSURE_SCOPED_BY_RECORDED_FINAL_PROOF_TIMESTAMP','accepted_heads':detail,'accepted_head_totals':tot,'exact_tree_continuity':trees,'required_named_proofs_green':True,'required_named_proof_source':'recorded immutable proof run IDs verified against exact accepted SHA',
'historical_noncanonical_failures':failure_rows,'baseline_runs_per_head':round(baseline_avg,6),'current_runs_per_head':round(current_avg,6),
'normalized_runs_per_head_reduction_percent':round(normalized_reduction,4),
'build255_closure_runs':134,'build262_closure_runs':build262_closure_runs,'build255_to_build262_reduction_percent':round((134-build262_closure_runs)/134*100,4),
'workflow_mutation':False,'d1_mutation':False,'r2_mutation':False,'production_d1_contact':False}
OUT.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
print(json.dumps(result,indent=2,sort_keys=True))
