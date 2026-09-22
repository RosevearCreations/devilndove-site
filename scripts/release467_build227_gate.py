#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):return (R/p).read_text(encoding='utf-8')
def l(p):return json.loads(t(p))
p=l('current-development-authority.json');b=l('release467-build227-manufacturing-adoption-command-centre.json');pre=l('release467-build226-capability-profile-coverage-closure.json');m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/manufacturing-adoption-command-centre.js');u=t('public/js/admin-manufacturing-adoption-command-centre-build227.js');h=t('admin/manufacturing-adoption/index.html');n=t('data/admin-navigation-modules.json');s=t('scripts/current_system_gate_provenance_gate.py');d=t('docs/operations/RELEASE_467_BUILD_227_MANUFACTURING_ADOPTION_COMMAND_CENTRE.md')
q(p.get('build')==227 and p.get('title')=='Manufacturing Adoption Command Centre','pointer identity')
q(p.get('promotion_state')=='BUILD227_CANDIDATE_NOT_YET_VERIFIED','pointer fail-closed state')
q(b.get('state')=='DEVELOPMENT_CANDIDATE','Build 227 authority candidate state')
q(pre.get('state')=='PRODUCTION_GREEN','Build 226 predecessor must be Production GREEN')
f=pre.get('final_closure')or{};z=pre.get('production_checkpoint')or{}
q(f.get('dev_sha')=='a3f220deb8c4cef7a2143ab1960c2ea33454ad6d' and f.get('tree_sha')=='c21821ae1ac1ba931b1f38e8fb3b9641bd3b4b3f','Build 226 exact Development closure drifted')
q(z.get('main_sha')=='8a4adf0a9108f482edd7aaa0c2f7e27d843a9d2e' and z.get('state')=='PRODUCTION_GREEN','Build 226 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
q(len(files)==22 and files[-1]=='0022_release467_capability_profile_coverage_closure.sql','Build 227 must add no migration')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 227 API must remain GET-only')
for token in ('NO_REAL_WORK_YET','BROKEN_EXISTING_AUTHORITY','next_valid_action','adoption_path','custom_request_manufacturing_triage','creative_project_job_travelers','creative_project_production_runs'):
 q(token in a,'Build 227 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):
 q(forbidden not in a,'Build 227 API mutation/DDL boundary crossed: '+forbidden)
q('Release 467 Build 227' in h and len(re.findall(r'<h1(?:\\s|>)',h,re.I))==1,'Build 227 page identity/one-H1')
q('/public/js/admin-manufacturing-adoption-command-centre-build227.js?v=467b227' in h,'Build 227 page client activation')
q('/admin/manufacturing-adoption/' in n and 'Manufacturing Adoption Command Centre' in n,'Build 227 navigation')
q("run_current_contract('scripts/release467_build227_gate.py','Release 467 Build 227')" in s,'Current System Gate must invoke Build 227')
q('NO_REAL_WORK_YET' in d and 'Builds **228–232** remain planned' in d,'Build 227 operations doc')
for zpath in ('functions/api/admin/manufacturing-adoption-command-centre.js','public/js/admin-manufacturing-adoption-command-centre-build227.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 227 MANUFACTURING ADOPTION COMMAND CENTRE: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 227 MANUFACTURING ADOPTION COMMAND CENTRE: PASS')
print('Predecessor: Build 226 EXACT DEVELOPMENT + PRODUCTION GREEN')
print('Canonical migration: NONE / remains 0001-0022')
print('Mutation authority: NONE / GET-ONLY ADOPTION PROJECTION')
print('Future queue exhausted: NO / Builds 228-232 remain planned')
