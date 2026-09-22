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
p=l('current-development-authority.json');b=l('release467-build230-cost-margin-qa-knowledge-evidence-adoption.json');pre=l('release467-build229-first-creative-project-prototype-to-run-pilot.json');m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/cost-margin-qa-knowledge-adoption.js');h=t('admin/evidence-adoption/index.html');n=t('data/admin-navigation-modules.json');s=t('scripts/current_system_gate_provenance_gate.py');d=t('docs/operations/RELEASE_467_BUILD_230_COST_MARGIN_QA_KNOWLEDGE_EVIDENCE_ADOPTION.md')
q(p.get('build')==230 and p.get('title')=='Cost, Margin, QA & Knowledge Evidence Adoption','pointer identity')
q(p.get('promotion_state')=='BUILD230_CANDIDATE_NOT_YET_VERIFIED','pointer fail-closed state')
q(b.get('state')=='DEVELOPMENT_CANDIDATE','Build 230 authority candidate state')
q((b.get('predecessor') or {}).get('production_main_sha')=='4ba7631cfd0da23925c82b1ec3cf8ed247b75f0c','Build 229 Production predecessor drifted')
q(pre.get('state')=='PRODUCTION_GREEN' and (pre.get('final_closure') or {}).get('business_exit')=='HOLD_NO_REAL_PROJECT','Build 229 retained closure not ingested')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)==22 and mf[-1]=='0022_release467_capability_profile_coverage_closure.sql','Build 230 must add no migration')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 230 API must remain GET-only')
for token in ('HOLD_NO_QUALIFYING_REAL_RUN','PROVEN_REVIEWED_ADOPTION','EVIDENCE_ADOPTION_IN_PROGRESS','custom_request_quote_revisions','creative_project_production_cost_evidence','creative_project_production_runs','creative_project_production_run_qa_checks','workshop_knowledge_entries','workshop_knowledge_recipe_versions','synthetic_cost_margin_qa_or_knowledge_records:false'):q(token in a,'Build 230 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','bucket.put(','bucket.delete('):q(forbidden not in a,'Build 230 API mutation/DDL boundary crossed: '+forbidden)
q('Release 467 Build 230' in h and len(re.findall(r'<h1(?:\s|>)',h,re.I))==1,'Build 230 page identity/one-H1')
q('/public/js/admin-cost-margin-qa-knowledge-adoption-build230.js?v=467b230' in h,'Build 230 page client activation')
q('/admin/evidence-adoption/' in n and 'Cost, Margin, QA & Knowledge Evidence Adoption' in n,'Build 230 navigation')
q("run_current_contract('scripts/release467_build230_gate.py','Release 467 Build 230')" in s,'Current System Gate must invoke Build 230')
q('HOLD_NO_QUALIFYING_REAL_RUN' in d and 'Builds **231–232** remain planned' in d,'Build 230 operations doc')
for zpath in ('functions/api/admin/cost-margin-qa-knowledge-adoption.js','public/js/admin-cost-margin-qa-knowledge-adoption-build230.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 230 COST MARGIN QA KNOWLEDGE EVIDENCE ADOPTION: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 230 COST MARGIN QA KNOWLEDGE EVIDENCE ADOPTION: PASS')
print('Exit policy: reviewed real evidence OR HOLD_NO_QUALIFYING_REAL_RUN with software acceptance GREEN')
print('Canonical migration: NONE / remains 0001-0022')
print('Mutation authority: NONE / GET-ONLY EVIDENCE MEASUREMENT')
print('Future queue exhausted: NO / Builds 231-232 remain planned')
