#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):
 f=R/p
 if not f.is_file():F.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def l(p):return json.loads(t(p) or '{}')
p=l('current-development-authority.json');b=l('release467-build229-first-creative-project-prototype-to-run-pilot.json');pre=l('release467-build228-first-real-custom-work-route-to-proof-pilot.json');m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/creative-project-prototype-run-pilot.js');h=t('admin/creative-project-pilot/index.html');n=t('data/admin-navigation-modules.json');s=t('scripts/current_system_gate_provenance_gate.py');d=t('docs/operations/RELEASE_467_BUILD_229_FIRST_CREATIVE_PROJECT_PROTOTYPE_TO_RUN_PILOT.md')
q(p.get('build')==229 and p.get('title')=='First Creative Project Prototype-to-Run Pilot','pointer identity')
q(p.get('promotion_state')=='BUILD229_CANDIDATE_NOT_YET_VERIFIED','pointer fail-closed state')
q(b.get('state')=='DEVELOPMENT_CANDIDATE','Build 229 authority candidate state')
q((b.get('predecessor') or {}).get('production_main_sha')=='9b4a12fe90b207006c9593d7440f56bf681c43aa','Build 228 Production predecessor drifted')
q(pre.get('state')=='PRODUCTION_GREEN' and (pre.get('final_closure') or {}).get('business_exit')=='HOLD_NO_REAL_REQUEST','Build 228 retained closure not ingested')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)==22 and mf[-1]=='0022_release467_capability_profile_coverage_closure.sql','Build 229 must add no migration')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 229 API must remain GET-only')
for token in ('HOLD_NO_REAL_PROJECT','PROVEN_REAL_REVIEWED_EVIDENCE','creative_project_operations','creative_project_manufacturing_lifecycles','creative_project_job_travelers','creative_project_production_runs','creative_project_production_run_qa_checks','creative_project_production_run_handoffs','synthetic_project_or_production_records:false'):q(token in a,'Build 229 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','bucket.put(','bucket.delete('):q(forbidden not in a,'Build 229 API mutation/DDL boundary crossed: '+forbidden)
q('Release 467 Build 229' in h and len(re.findall(r'<h1(?:\s|>)',h,re.I))==1,'Build 229 page identity/one-H1')
q('/public/js/admin-creative-project-prototype-run-pilot-build229.js?v=467b229' in h,'Build 229 page client activation')
q('/admin/creative-project-pilot/' in n and 'Creative Project Prototype-to-Run Pilot' in n,'Build 229 navigation')
q("run_current_contract('scripts/release467_build229_gate.py','Release 467 Build 229')" in s,'Current System Gate must invoke Build 229')
q('HOLD_NO_REAL_PROJECT' in d and 'Builds **230–232** remain planned' in d,'Build 229 operations doc')
for current in ('functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','public/js/admin-it-control-tower.js','admin/it/index.html','admin/deployment-preflight/index.html','admin/reliability/index.html'):q('Build 229' in t(current),current+' not advanced to Build 229 current truth')
for zpath in ('functions/api/admin/creative-project-prototype-run-pilot.js','public/js/admin-creative-project-prototype-run-pilot-build229.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 229 FIRST CREATIVE PROJECT PROTOTYPE-TO-RUN PILOT: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 229 FIRST CREATIVE PROJECT PROTOTYPE-TO-RUN PILOT: PASS')
print('Exit policy: REAL reviewed evidence OR HOLD_NO_REAL_PROJECT with software acceptance GREEN')
print('Canonical migration: NONE / remains 0001-0022')
print('Mutation authority: NONE / GET-ONLY PILOT EVIDENCE')
print('Future queue exhausted: NO / Builds 230-232 remain planned')
