#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='3292ac5c20780e23bd9d5ae593368e82b6e4826b';TREE='1108fecdeac23c69b8ea4d810c0375a0899ff469';MAIN='92df5745fc2d4311dfacfbd214c1032a34c46bb8'
PROOFS={'system_gate_run':35533703475,'current_application_quality_run':35533703446,'it_admin_runtime_proof_run':35533703481,'branch_hygiene_run':35533703474}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build214-prototype-sample-production-run.json');b213=load('release467-build213-digital-proof-customer-approval.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0014_release467_prototype_sample_production_run.sql')
api=read('functions/api/admin/manufacturing-lifecycle.js');helper=read('functions/api/_lib/manufacturingMaturity.js');client=read('public/js/admin-manufacturing-lifecycle-build214.js')
creative=read('admin/creative-process/index.html');custom=read('admin/custom-request/index.html')
req(p.get('build')==214 and p.get('title')=='Prototype → Sample → Production Run','Build 214 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 214 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==213 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35534081643 and int(prod.get('production_live_resource_integrity_run') or 0)==35534292686,'Build 213 Production predecessor drifted')
req(b.get('build')==214 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 214 authority drifted')
req(b213.get('state')=='PRODUCTION_GREEN','Build 213 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==14 and files[-1]=='0014_release467_prototype_sample_production_run.sql','canonical migration stream must end at 0014')
for token in (
 'CREATE TABLE IF NOT EXISTS creative_project_manufacturing_lifecycles',
 'CREATE TABLE IF NOT EXISTS creative_project_manufacturing_lifecycle_events',
 "current_stage IN ('concept','prototype','prototype_failed_rework','sample_candidate','approved_sample','production_authorized','production_run','qa_rework','completed')",
 'REFERENCES creative_work_projects(creative_work_project_id)',
 'REFERENCES custom_requests(custom_request_id)',
 'REFERENCES custom_request_proof_versions(custom_request_proof_version_id)',
 'REFERENCES creative_work_events(creative_work_event_id)',
 'idx_manufacturing_lifecycle_project_unique',
 'idx_manufacturing_lifecycle_request_unique'
):req(token in mig,f'Build 214 migration missing {token}')
for forbidden in ('INSERT INTO creative_project_manufacturing_lifecycles','INSERT INTO creative_project_manufacturing_lifecycle_events'):req(forbidden not in mig,'migration 0014 must create no lifecycle business rows')
for src,label in ((api,'admin API'),(helper,'helper')):
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in src.upper(),f'Build 214 {label} contains request-time DDL {ddl}')
for forbidden in ('INSERT INTO creative_work_events','UPDATE creative_work_events','INSERT INTO product_production_runs','UPDATE product_production_runs','UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO orders','INSERT INTO payments','bucket.put(','bucket.delete('):
 req(forbidden not in api,f'Build 214 API touches forbidden owner authority: {forbidden}')
for token in (
 'allowedManufacturingTransitions','loadManufacturingMaturityReadiness','proof_required','production_authorization_ready',
 'automatic_production_start:false','product_production_run_mutation:false','publication_authorized:false'
):req(token in helper,f'Build 214 helper missing {token}')
for token in (
 "action==='save_link'","action!=='transition'","to==='approved_sample'","to==='production_authorized'",
 'validateApprovedSampleEvidence','custom_request_proof_versions','creative_work_events',
 "proof_status||'')!=='approved'","Build 213 proof-readiness gate",'sample_superseded',
 'No production, Inventory, Product-run, payment or publication action was executed.'
):req(token in api,f'Build 214 API missing {token}')
for token in ('Prototype → sample → production run','Approved-sample evidence type','Append-only maturity history','Record transition','does not start production'):req(token in client,f'Build 214 client missing {token}')
req('manufacturingLifecycle214Mount' in creative and '/public/js/admin-manufacturing-lifecycle-build214.js?v=467b214' in creative,'Creative Process missing Build 214 workspace')
req('customWorkLifecycle214Mount' in custom and '/public/js/admin-manufacturing-lifecycle-build214.js?v=467b214' in custom,'Custom Work missing Build 214 workspace')
req(len(re.findall(r'<h1(?:\s|>)',creative,re.I))==1,'Creative Process must retain one H1')
req(len(re.findall(r'<h1(?:\s|>)',custom,re.I))==1,'Custom Work must retain one H1')
for path in ('functions/api/admin/manufacturing-lifecycle.js','functions/api/_lib/manufacturingMaturity.js','public/js/admin-manufacturing-lifecycle-build214.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1000:]}')
if FAIL:print('RELEASE 467 BUILD 214 PROTOTYPE SAMPLE PRODUCTION RUN: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 214 PROTOTYPE SAMPLE PRODUCTION RUN: PASS')
print('Failed/rework history: APPEND-ONLY')
print('Automatic production start / Inventory / Product-run / payment / publication mutation: ZERO')
