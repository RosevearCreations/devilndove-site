#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):return (R/p).read_text(encoding='utf-8')
def l(p):return json.loads(t(p))
p=l('current-development-authority.json')
b=l('release467-build228-first-real-custom-work-route-to-proof-pilot.json')
m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/custom-work-route-proof-pilot.js')
u=t('public/js/admin-custom-work-route-proof-pilot-build228.js')
h=t('admin/custom-work-pilot/index.html')
n=t('data/admin-navigation-modules.json')
s=t('scripts/current_system_gate_provenance_gate.py')
d=t('docs/operations/RELEASE_467_BUILD_228_FIRST_REAL_CUSTOM_WORK_ROUTE_TO_PROOF_PILOT.md')
q(p.get('build')==228 and p.get('title')=='First Real Custom Work Route-to-Proof Pilot','pointer identity')
q(p.get('promotion_state')=='BUILD228_CANDIDATE_NOT_YET_VERIFIED','pointer fail-closed state')
q(b.get('state')=='DEVELOPMENT_CANDIDATE','Build 228 authority candidate state')
pre=b.get('predecessor') or {}
q(pre.get('production_main_sha')=='2fbbb950b2598a518d14078b0252a8159472fbb7' and pre.get('promotion_pr')==301,'Build 227 promotion boundary drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
q(len(files)==22 and files[-1]=='0022_release467_capability_profile_coverage_closure.sql','Build 228 must add no migration')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 228 API must remain GET-only')
for token in ('HOLD_NO_REAL_REQUEST','PROVEN_REAL_REVIEWED_EVIDENCE','custom_request_manufacturing_triage','custom_request_route_processes','custom_request_quote_drafts','custom_request_proof_versions','synthetic_business_records:false'):
 q(token in a,'Build 228 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):
 q(forbidden not in a,'Build 228 API mutation/DDL boundary crossed: '+forbidden)
q('Release 467 Build 228' in h and len(re.findall(r'<h1(?:\\s|>)',h,re.I))==1,'Build 228 page identity/one-H1')
q('/public/js/admin-custom-work-route-proof-pilot-build228.js?v=467b228' in h,'Build 228 page client activation')
q('/admin/custom-work-pilot/' in n and 'Route-to-Proof Pilot' in n,'Build 228 navigation')
q("run_current_contract('scripts/release467_build228_gate.py','Release 467 Build 228')" in s,'Current System Gate must invoke Build 228')
q('HOLD_NO_REAL_REQUEST' in d and 'Builds **229–232** remain planned' in d,'Build 228 operations doc')
for zpath in ('functions/api/admin/custom-work-route-proof-pilot.js','public/js/admin-custom-work-route-proof-pilot-build228.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True)
 q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 228 FIRST REAL CUSTOM WORK ROUTE-TO-PROOF PILOT: FAIL')
 [print('-',x) for x in F]
 sys.exit(1)
print('RELEASE 467 BUILD 228 FIRST REAL CUSTOM WORK ROUTE-TO-PROOF PILOT: PASS')
print('Exit policy: REAL reviewed evidence OR HOLD_NO_REAL_REQUEST with software acceptance GREEN')
print('Canonical migration: NONE / remains 0001-0022')
print('Mutation authority: NONE / GET-ONLY PILOT EVIDENCE')
print('Future queue exhausted: NO / Builds 229-232 remain planned')
