#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def sql_statements(body):
    clean='\n'.join(line for line in body.splitlines() if not line.lstrip().startswith('--'))
    return [part.strip() for part in clean.split(';') if part.strip()]

a=j('release467-build262-operations-today-tasks-read-fanout-review.json')
prev=j('release467-build261-production-proof-dependency-orchestration.json')
p=j('current-development-authority.json')
service=t('functions/api/_lib/todayTasksReadService.js')
probe=t('scripts/release467_build262_today_tasks_measurement.sql')
wf=t('.github/workflows/release467-build262-operations-today-tasks-read-fanout-review.yml')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
doc=t('docs/operations/RELEASE_467_BUILD_262_OPERATIONS_TODAY_TASKS_READ_FANOUT_REVIEW.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==262 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 262 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='c4e57f8d4c47a709021fca65037b25f4e74d63e2','Build 261 Development SHA mismatch')
q(pred.get('development_tree_sha')=='a442d160e1619e4b362de2bbda509ab25c310290','Build 261 Development tree mismatch')
q(pred.get('production_main_sha')=='f90944f80ec193610d3b87312487799ec425d983','Build 261 Production main mismatch')
q(pred.get('production_tree_sha')=='a442d160e1619e4b362de2bbda509ab25c310290' and pred.get('same_tree') is True,'Build 261 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 261 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='c4e57f8d4c47a709021fca65037b25f4e74d63e2','Build 261 final Development closure missing')
q((prev.get('final_closure') or {}).get('dedicated_gate_run')==36087874900,'Build 261 dedicated Development proof missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='f90944f80ec193610d3b87312487799ec425d983','Build 261 Production checkpoint missing')
q((prev.get('production_checkpoint') or {}).get('build_specific_proof_run')==36088094406,'Build 261 Production-specific proof missing')

base=a.get('baseline') or {}; review=a.get('review') or {}
q(base.get('top_level_select_statements')==13 and base.get('provider_rows_read')==1132,'Build 250 Today Tasks baseline mismatch')
q(base.get('provider_rows_read_ceiling')==15000 and base.get('aggregate_provider_rows_read_ceiling')==25000,'Build 250 provider ceilings drifted')
q(review.get('change')=='BATCH_SIX_LATEST_ACTION_POINT_LOOKUPS_INTO_ONE_D1_STATEMENT','Build 262 change mode mismatch')
q(review.get('target_top_level_select_statements')==8 and review.get('statement_reduction')==5,'Build 262 statement reduction target mismatch')
q(review.get('provider_rows_read_ceiling')==15000 and review.get('seller_daily_rows_read_ceiling')==10000 and review.get('aggregate_rows_read_ceiling')==25000,'Build 262 must retain Build 250 provider ceilings')
q(review.get('production_d1_measurement') is False,'Build 262 Production D1 measurement must remain closed')

for token in ('const pointLookup =','TASK_KEYS.map(() =>','UNION ALL',"bind(...TASK_KEYS)",'created_at DESC, today_task_action_id DESC','LIMIT 1'):
    q(token in service,f'Build 262 runtime batching missing {token}')
q('Promise.all(TASK_KEYS.map' not in service,'Build 262 must remove six independent latest-action statements')
q(service.count("scalarRead(db,")==6,'Build 262 must preserve six task-count reads')
q('runtimeIncidentDetails(db)' in service,'Build 262 must preserve runtime incident detail read')

statements=sql_statements(probe)
q(len(statements)==8,f'Build 262 provider probe must contain 8 top-level statements, got {len(statements)}')
q(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA|VACUUM|REINDEX)\b',probe),'Build 262 provider probe contains mutation/DDL')
for key in ('readiness','custom_requests','orders','inventory','accounting','failed_api'):
    q(f"task_key='{key}'" in probe,f'Build 262 provider probe missing latest-action key {key}')
q(probe.count('UNION ALL')==5,'Build 262 latest-action probe must compose six branches into one statement')

for token in (
  "development_sha: c4e57f8d4c47a709021fca65037b25f4e74d63e2",
  "production_sha: f90944f80ec193610d3b87312487799ec425d983",
  "build_proof_name: Release 467 Build 261 Production Proof Dependency Orchestration",
  "database_name = \"devilndove-dev\"",
  'EXPECTED_TODAY_STATEMENTS: 8',
  'TODAY_TASKS_ROWS_READ_CEILING: 15000',
  'SELLER_DAILY_ROWS_READ_CEILING: 10000',
  'AGGREGATE_ROWS_READ_CEILING: 25000',
  'PRODUCTION D1 CONTACT: ZERO'
):
    q(token in wf,f'Build 262 workflow missing {token}')
q("! grep -q 'devilndove-prod' wrangler.toml" in wf,'Build 262 workflow must reject Production D1 binding')
q('d1 execute devilndove-prod' not in wf and 'd1 info devilndove-prod' not in wf,'Build 262 workflow must never execute against Production D1')
q("run_current_contract('scripts/release467_build262_gate.py','Release 467 Build 262')" in sysgate,'System Gate must invoke Build 262')
q('Build 263 — Release Efficiency & Read-Budget Outcome Verification' in road,'Build 263 successor missing from roadmap')
for token in ('13','8','15,000','25,000','Build 263'):
    q(token in doc,f'Build 262 document missing {token}')

if int(p.get('build') or 0)==262:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==263,'Current authority must expose Build 262 and successor 263')
    q(p.get('accepted_dev_sha')=='c4e57f8d4c47a709021fca65037b25f4e74d63e2','Build 262 must start from exact Build 261 Development')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='f90944f80ec193610d3b87312487799ec425d983','Build 262 must start from exact Build 261 Production')

m=a.get('measurement') or {}
if m.get('state')=='EXACT_DEVELOPMENT_MEASURED_GREEN':
    q(int(m.get('top_level_statement_count') or 0)==8,'Build 262 measured statement count must be 8')
    q(int(m.get('today_tasks_provider_rows_read') or 0)<=15000,'Build 262 measured Today Tasks rows_read exceeded ceiling')
    q(int(m.get('seller_daily_provider_rows_read') or 0)<=10000,'Build 262 measured Seller Daily rows_read exceeded ceiling')
    q(int(m.get('aggregate_provider_rows_read') or 0)<=25000,'Build 262 measured aggregate rows_read exceeded ceiling')
    q(m.get('production_d1_contact') is False and m.get('d1_mutation') is False,'Build 262 measured safety drift')
else:
    q(m.get('state')=='AWAITING_EXACT_DEVELOPMENT_PROVIDER_MEASUREMENT','Build 262 measurement state invalid before exact Development run')

for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 262 safety drift: {k}')

print('RELEASE 467 BUILD 262 OPERATIONS TODAY-TASKS READ FAN-OUT REVIEW')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Today Tasks top-level provider statements: 13 -> 8')
print('Provider ceilings retained: Today <=15000; Seller Daily <=10000; aggregate <=25000')
print('Production D1 contact/mutation: ZERO')
print('Next: Build 263 — Release Efficiency & Read-Budget Outcome Verification')
