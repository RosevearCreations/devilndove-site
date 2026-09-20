#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='9b6b22291bd98bdd2d57c8793a0c892f937b4287';TREE='36bed0abebbb47b375277562355c3517d171b629';MAIN='9a1bd2b3d99edf69651a17e790866d3b8fa744d4'
PROOFS={'system_gate_run':35517349532,'current_application_quality_run':35517349713,'it_admin_runtime_proof_run':35517349672,'branch_hygiene_run':35517349600}
COLS=('quantity','project_intent','intended_use','organization_name','event_context_structured','supplied_item','desired_material','desired_finish','personalization_text','requested_capability_key','tolerance_size_notes','help_choose_method')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build210-custom-work-intake-2.json');b209=load('release467-build209-workshop-capability-profiles-constraints.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0010_release467_custom_work_intake_2.sql');api=read('functions/api/custom-request.js');ready=read('functions/api/_lib/publicRuntimeSchemaReadiness.js');page=read('custom-request/index.html');client=read('public/js/custom-request-intake.js');admin_read=read('functions/api/admin/contracts/operations-custom-work-build151-read.js');admin_client=read('public/js/admin-custom-work-build151.js')
req(p.get('build')==210 and p.get('title')=='Custom Work Intake 2.0','Build 210 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 210 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==209 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35517517613 and int(prod.get('production_live_resource_integrity_run') or 0)==35517574976,'Build 209 Production predecessor drifted')
req(b.get('build')==210 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 210 authority drifted');req(b209.get('state')=='PRODUCTION_GREEN','Build 209 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==10 and files[-1]=='0010_release467_custom_work_intake_2.sql','canonical migration stream must end at 0010')
for col in COLS:req(f'ADD COLUMN {col}' in mig,f'migration 0010 missing {col}')
req('REFERENCES workshop_capability_profiles(capability_key)' in mig,'capability preference must reference Build 209 profile authority')
req('CREATE TABLE custom_requests' not in mig and 'CREATE TABLE IF NOT EXISTS custom_requests' not in mig,'Build 210 must not create a second custom request table')
for col in COLS:req(f'"{col}"' in ready,f'public runtime readiness missing {col}')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in api.upper(),f'public Custom Request API contains request-time DDL {forbidden}')
for token in ('quantity','projectIntent','intendedUse','organizationName','eventContextStructured','suppliedItem','desiredMaterial','desiredFinish','personalizationText','requestedCapabilityKey','toleranceSizeNotes','helpChooseMethod','workshop_capability_profiles','manufacturing_route_proposed: false','automatic_quote_created: false'):req(token in api,f'public Custom Request API missing Build 210 token {token}')
for token in ('name="quantity"','name="project_intent"','name="intended_use"','name="organization_name"','name="event_context_structured"','name="supplied_item"','name="desired_material"','name="desired_finish"','name="personalization_text"','name="requested_capability_key"','name="tolerance_size_notes"','name="help_choose_method"','Help me decide how to make it'):req(token in page,f'public form missing {token}')
for preserved in ('name="budget"','name="deadline_date"','name="gift_intent"','name="recipient_name"','name="occasion"','name="fulfillment_preference"','name="reference_images"'):req(preserved in page,f'existing intake authority lost {preserved}')
req('/api/capabilities' in client and 'build210_structured_intake' in client,'Build 210 capability-aware client behavior missing')
for col in COLS:req(col in admin_read,f'admin read projection missing {col}')
req('manufacturing_route_authority' in admin_read and 'BUILD_211_NOT_YET_STARTED' in admin_read,'Build 211 boundary missing from admin read')
req('Structured intake:' in admin_client and 'help me decide' in admin_client,'admin queue does not surface Build 210 context')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/custom-request.js','functions/api/_lib/publicRuntimeSchemaReadiness.js','public/js/custom-request-intake.js','functions/api/admin/contracts/operations-custom-work-build151-read.js','public/js/admin-custom-work-build151.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 210 CUSTOM WORK INTAKE 2.0: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 210 CUSTOM WORK INTAKE 2.0: PASS')
print('Structured custom_requests columns: 12')
print('Capability preference authority: workshop_capability_profiles')
print('Automatic feasibility / route / quote / order: ZERO')
