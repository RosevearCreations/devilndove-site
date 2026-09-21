#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='f69deaa659520af182edc60dfc7cfefc7914d8f8'
TREE='23394309d09e765c5327fbf8715532faabc78d6a'
MAIN='704c407485c0fd0c3de785b696113d3cc7be5a27'
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
system=read('scripts/current_system_gate_provenance_gate.py')
req(p.get('build')==224 and p.get('title')=='Manufacturing-Era Closure & Next Roadmap','Build 224 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 224 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==223 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE,'Build 224 Production predecessor SHA/tree drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==35636523017 and int(prod.get('production_live_resource_integrity_run') or 0)==35636619207,'Build 223 Production predecessor proof drifted')
req(b.get('build')==224 and b.get('state') in ('DEVELOPMENT_CLOSURE_CANDIDATE','DEVELOPMENT_MEASURED_CLOSURE_CANDIDATE'),'Build 224 authority state drifted')
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
for token in ('25,000','Build 204 baseline','f69deaa659520af182edc60dfc7cfefc7914d8f8','704c407485c0fd0c3de785b696113d3cc7be5a27','does **not** pre-authorize Build 225+ scope','D1 mutation ZERO'):
 req(token.lower() in doc.lower(),'Build 224 operations contract missing '+token)
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
print('Build 224 measurement: READ ONLY / EXACT DEV PUSH ONLY / <= 25000 provider rows')
print('Successor scope: BLOCKED UNTIL EXACT BUILD 224 MEASUREMENT')
