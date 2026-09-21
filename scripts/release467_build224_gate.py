#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='f69deaa659520af182edc60dfc7cfefc7914d8f8'
TREE='23394309d09e765c5327fbf8715532faabc78d6a'
MAIN='704c407485c0fd0c3de785b696113d3cc7be5a27'
MEASURED_DEV='95fd199e4345a6e191996f5de7ef56057a0ffde8'
MEASURED_TREE='11ea923c36a0e2cd56c8319a545c63743ed4df41'
PROOFS={'system_gate_run':35636209245,'current_application_quality_run':35636209377,'it_admin_runtime_proof_run':35636209182,'branch_hygiene_run':35636209309}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json')
b=load('release467-build224-manufacturing-era-closure-next-roadmap.json')
b223=load('release467-build223-capability-case-studies-workshop-journal-search-richness.json')
m=load('migrations/canonical/manifest.json')
sql=read('scripts/release467_build224_measurement.sql')
doc=read('docs/operations/RELEASE_467_BUILD_224_MANUFACTURING_ERA_CLOSURE_NEXT_ROADMAP.md')
workflow=read('.github/workflows/release467-build224-manufacturing-era-closure-next-roadmap.yml')
roadmap=read('docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md')
nextroad=read('docs/operations/RELEASE_467_POST_MANUFACTURING_AUTONOMOUS_BUILDS_225_232.md')
system=read('scripts/current_system_gate_provenance_gate.py')

req(p.get('build')==224 and p.get('title')=='Manufacturing-Era Closure & Next Roadmap','Build 224 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 224 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==223 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE,'Build 224 Production predecessor SHA/tree drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==35636523017 and int(prod.get('production_live_resource_integrity_run') or 0)==35636619207,'Build 223 Production predecessor proof drifted')

req(b.get('build')==224 and b.get('state')=='DEVELOPMENT_MEASURED_CLOSURE_CANDIDATE','Build 224 measured authority state drifted')
req(b223.get('state')=='PRODUCTION_GREEN','Build 223 retained authority must be Production GREEN')
f223=b223.get('final_closure') or {};q223=b223.get('production_checkpoint') or {}
req(f223.get('dev_sha')==DEV and f223.get('tree_sha')==TREE and (f223.get('proofs') or {})==PROOFS and int(f223.get('build_specific_proof_run') or 0)==35636209003,'Build 223 exact Development closure missing')
req(q223.get('main_sha')==MAIN and q223.get('tree_sha')==TREE and int(q223.get('production_pages_deploy_run') or 0)==35636523017 and q223.get('state')=='PRODUCTION_GREEN','Build 223 exact Production closure missing')

files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==21 and files[-1]=='0021_release467_project_knowledge_recipe_history.sql','Build 224 must not add a canonical migration')

for token in (
 'LIMIT 240','ready_products','review_required_products','externally_blocked_products','media_blocked_products',
 'canonical_active_processes','public_reviewed_capability_profiles','active_processes_with_public_profile',
 'custom_requests_with_sufficient_triage','hybrid_projects','proofs_sent','proofs_approved','proofs_changed',
 'lifecycles_with_prototype_evidence','lifecycles_with_approved_sample','reviewed_production_runs',
 'quote_drafts_with_expected_cost_review','projects_with_fully_reviewed_cost_evidence','projects_with_reviewed_known_direct_cost',
 'production_run_qa_checks','qa_rework_checks','qa_fail_checks','reviewed_runs_with_rework','reviewed_runs_with_scrap',
 'knowledge_entries_reviewed','approved_recipe_versions','published_project_case_studies',
 'published_capability_backed_case_studies','published_hybrid_case_studies'
):
 req(token in sql,'Build 224 measurement query missing '+token)
req(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA)\b',sql),'Build 224 measurement query contains mutation or DDL')

measurement=b.get('measurement') or {}
req(measurement.get('state')=='EXACT_DEVELOPMENT_MEASURED_GREEN','Build 224 exact measurement state missing')
req(measurement.get('development_sha')==MEASURED_DEV and measurement.get('tree_sha')==MEASURED_TREE,'Build 224 exact measured SHA/tree drifted')
req(int(measurement.get('workflow_run') or 0)==35641735469 and int(measurement.get('artifact_id') or 0)==10658891143,'Build 224 measurement proof transport drifted')
req(int(measurement.get('d1_provider_rows_read') or 0)==8781 and int(measurement.get('d1_rows_read_ceiling') or 0)==25000,'Build 224 D1 measurement budget drifted')
req(measurement.get('mutation')=='ZERO','Build 224 measurement mutation boundary drifted')
launch=measurement.get('launch_set_current') or {}
req(launch=={'products_reviewed':43,'ready_products':1,'review_required_products':42,'externally_blocked_products':0,'publicly_visible_products':40,'media_ready_products':3,'tracked_zero_stock_products':2,'products_with_linked_resources':2,'products_with_missing_linked_inventory':0,'products_with_unknown_linked_cost':2,'buyer_blocked_products':16},'Build 224 launch-set measurement drifted')
metrics=measurement.get('measurements') or {}
for key,val in {
 'canonical_active_processes':22,'active_processes_with_public_profile':21,'public_reviewed_capability_profiles':12,
 'active_custom_requests':0,'hybrid_projects':0,'proof_versions_total':0,'manufacturing_lifecycles':0,
 'reviewed_production_runs':0,'quote_drafts_total':0,'projects_with_actual_cost_evidence':0,
 'production_run_qa_checks':0,'knowledge_entries_total':0,'approved_recipe_versions':0,
 'published_workshop_journal_entries':0,'published_project_case_studies':0
}.items(): req(int(metrics.get(key) or 0)==val,'Build 224 measured metric drifted: '+key)

successor=b.get('successor_roadmap') or {}
req(successor.get('state')=='PLANNED_BLOCKED_UNTIL_BUILD224_PRODUCTION_GREEN','Build 224 successor roadmap state drifted')
req(successor.get('path')=='docs/operations/RELEASE_467_POST_MANUFACTURING_AUTONOMOUS_BUILDS_225_232.md','Build 224 successor roadmap path drifted')
req(successor.get('future_queue_exhausted') is False,'future queue must not be exhausted while Builds 225-232 are planned')
builds=successor.get('builds') or []
req([int(x.get('build') or 0) for x in builds]==list(range(225,233)),'Build 224 successor build sequence must be 225-232')

for token in ('95fd199e4345a6e191996f5de7ef56057a0ffde8','35641735469','10658891143','8,781 / 25,000','21 / 22 = 95.5%','Build 225 remains blocked until Build 224 is exact-SHA Production GREEN','future queue **has not run out**'):
 req(token.lower() in doc.lower(),'Build 224 measured closure doc missing '+token)
for n in range(225,233): req(f'Build {n}' in nextroad,f'Post-manufacturing roadmap missing Build {n}')
for token in ('43 reviewed / 1 ready / 42 review-required','21 / 22 active canonical processes','adoption evidence','No Build 225 work may begin until Build 224 is exact-SHA **Production GREEN**'):
 req(token.lower() in nextroad.lower(),'Post-manufacturing roadmap missing evidence token: '+token)

for token in (
 "github.event_name == 'push' && github.ref == 'refs/heads/dev'",
 'database_name = "devilndove-dev"','dbc1615b-dcbe-4951-973b-b47c99c73bfa','f34a741b-0000-45b0-9a96-6be08754d563',
 'release467_build224_measurement.sql','d1_rows_read_ceiling','25000','release467-build224-manufacturing-era-closure-',
 'actions/upload-artifact@v4','D1 MUTATION: ZERO','R2 MUTATION: ZERO','SCHEMA MIGRATION: NONE'
):
 req(token in workflow,'Build 224 workflow missing '+token)
req("python scripts/release467_build223_gate.py" in workflow,'Build 224 workflow must retain Build 223 gate')
req("run_current_contract('scripts/release467_build224_gate.py','Release 467 Build 224')" in system,'Current System Gate must invoke Build 224')
for token in ('Build 223','Build 224','final planned build','evidence'):
 req(token.lower() in roadmap.lower(),'Manufacturing roadmap current checkpoint missing '+token)

if FAIL:
 print('RELEASE 467 BUILD 224 MANUFACTURING ERA CLOSURE NEXT ROADMAP: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 224 MANUFACTURING ERA CLOSURE NEXT ROADMAP: PASS')
print('Build 223 predecessor: EXACT DEVELOPMENT + PRODUCTION GREEN')
print('Canonical migration: NONE / remains 0001-0021')
print('Build 224 exact Development measurement: GREEN / 8781 of 25000 provider rows')
print('Successor roadmap: Builds 225-232 PLANNED / BLOCKED UNTIL BUILD 224 PRODUCTION GREEN')
print('Future queue exhausted: NO')
