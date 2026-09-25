#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build263-release-efficiency-read-budget-outcome-verification.json')
prev=j('release467-build262-operations-today-tasks-read-fanout-review.json')
p=j('current-development-authority.json')
wf=t('.github/workflows/release467-build263-release-efficiency-read-budget-outcome-verification.yml')
script=t('scripts/release467_build263_outcome_measurement.py')
doc=t('docs/operations/RELEASE_467_BUILD_263_RELEASE_EFFICIENCY_READ_BUDGET_OUTCOME_VERIFICATION.md')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==263 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 263 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='dddbbb4c7fe7dfff8f59a4d54048e37a33fcf764','Build 262 Development SHA mismatch')
q(pred.get('development_tree_sha')=='931cf56eff07247f34eec69d753fa908027b72bf','Build 262 Development tree mismatch')
q(pred.get('production_main_sha')=='e65d9122252e9832a9e29027b13af163cbb30914','Build 262 Production SHA mismatch')
q(pred.get('production_tree_sha')=='931cf56eff07247f34eec69d753fa908027b72bf' and pred.get('same_tree') is True,'Build 262 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 262 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dedicated_gate_run')==36132080219,'Build 262 final dedicated proof missing')
q((prev.get('production_checkpoint') or {}).get('build_specific_proof_run')==36132870623,'Build 262 Production-specific proof missing')
b=a.get('baseline') or {};m=a.get('remeasurement') or {}
q(b.get('accepted_head_workflow_runs')==870 and b.get('accepted_heads_reviewed')==14,'Build 256 accepted-head baseline mismatch')
q(m.get('accepted_heads_reviewed')==12 and int(m.get('accepted_head_workflow_runs') or 0)>0,'Build 263 accepted-head measurement missing')
q(float(m.get('normalized_runs_per_head_reduction_percent') or 0)>21.0,'Build 263 normalized release-efficiency reduction not proven')
q(m.get('required_named_proofs_green') is True and m.get('exact_tree_continuity_preserved') is True,'Build 263 required proof/tree correctness missing')
q(m.get('historical_noncanonical_failure_workflow')=='Release 467 Build 155 Products Development Browser Proof' and int(m.get('historical_noncanonical_failure_count') or 0)>=10,'Build 263 residual failure classification missing')
q(m.get('build262_closure_runs')==68 and float(m.get('build255_to_build262_closure_run_reduction_percent') or 0)>49.0,'Build 263 Build255->262 closure reduction mismatch')
q(m.get('expected_build263_candidate_workflow_files')==153 and m.get('expected_build263_candidate_pull_request')==39 and m.get('expected_build263_candidate_push')==127 and m.get('expected_build263_candidate_workflow_dispatch')==135 and m.get('expected_build263_candidate_workflow_run')==5,'Build 263 candidate workflow surface mismatch')
q(m.get('expected_today_tasks_select_statements')==8 and m.get('today_tasks_rows_read_ceiling')==15000 and m.get('seller_daily_rows_read_ceiling')==10000 and m.get('aggregate_rows_read_ceiling')==25000,'Build 263 read-budget boundary drift')
for token in ('CLOSURE_SCOPED_BY_RECORDED_FINAL_PROOF_TIMESTAMP','build262_closure_runs','153','39','127','135','required_named_proofs_green'):
    q(token in script,f'Build 263 outcome measurement missing {token}')
for token in ('uses: ./.github/actions/release467-exact-sha-proof','development_sha: dddbbb4c7fe7dfff8f59a4d54048e37a33fcf764','production_sha: e65d9122252e9832a9e29027b13af163cbb30914','build_proof_name: Release 467 Build 262 Operations Today-Tasks Read Fan-Out Review','EXPECTED_TODAY_STATEMENTS: 8','PRODUCTION D1 CONTACT: ZERO','build263-release-efficiency-outcomes-','build263-provider-read-budget-'):
    q(token in wf,f'Build 263 workflow missing {token}')
q("run_current_contract('scripts/release467_build263_gate.py','Release 467 Build 263')" in sysgate,'System Gate must invoke Build 263')
q('Build 264 — Refinement Outcomes Renewal III' in road,'Build 264 successor missing')
for token in ('870','584','21.69%','134','68','8 statements','Build 264'):
    q(token in doc,f'Build 263 document missing {token}')
if int(p.get('build') or 0)==263:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==264,'Current authority must expose Build 263 and successor 264')
    q(p.get('accepted_dev_sha')=='dddbbb4c7fe7dfff8f59a4d54048e37a33fcf764','Build 263 must start from exact Build 262 Development')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='e65d9122252e9832a9e29027b13af163cbb30914','Build 263 must start from exact Build 262 Production')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 263 safety drift: {k}')
print('RELEASE 467 BUILD 263 RELEASE EFFICIENCY & READ-BUDGET OUTCOME VERIFICATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Accepted-head workflow fan-out: closure-scoped by recorded final-proof timestamp')
print('Build 255 -> Build 262 closure comparison: measured outcome retained below baseline')
print('Today Tasks statement target retained: 8; provider ceilings unchanged')
print('Next: Build 264 — Refinement Outcomes Renewal III')
