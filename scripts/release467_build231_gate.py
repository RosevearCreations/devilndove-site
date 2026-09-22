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
p=l('current-development-authority.json');b=l('release467-build231-workshop-journal-capability-case-study-activation.json');pre=l('release467-build230-cost-margin-qa-knowledge-evidence-adoption.json');m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/workshop-journal-case-study-activation.js');h=t('admin/public-story-activation/index.html');n=t('data/admin-navigation-modules.json');s=t('scripts/current_system_gate_provenance_gate.py');d=t('docs/operations/RELEASE_467_BUILD_231_WORKSHOP_JOURNAL_CAPABILITY_CASE_STUDY_ACTIVATION.md');pub=t('functions/api/capability-case-studies.js')
q(int(p.get('build') or 0)>=231,'current pointer regressed before Build 231')
q(b.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 231 retained authority state')
q((b.get('final_closure') or {}).get('business_exit') in (None,'HOLD_NO_PUBLISHABLE_EVIDENCE'),'Build 231 retained business exit drifted')
q((b.get('predecessor') or {}).get('production_main_sha')=='eab246604f1fd3a7d4762d17ee4868451f87584b','Build 230 Production predecessor drifted')
q(pre.get('state')=='PRODUCTION_GREEN' and (pre.get('final_closure') or {}).get('business_exit')=='HOLD_NO_QUALIFYING_REAL_RUN','Build 230 retained closure not ingested')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)>=22 and mf[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 231 must add no migration')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 231 API must remain GET-only')
for token in ('HOLD_NO_PUBLISHABLE_EVIDENCE','READY_FOR_OPERATOR_PUBLICATION','PROVEN_REVIEWED_PUBLIC_STORY','content_publications','content_projects','workshop_capability_profiles','creative_project_operations','automatic_publication:false','raw_private_caip_exposed:false','private_media_queries:false'):q(token in a,'Build 231 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','publishContentPublication','prepareContentPublications','bucket.put(','bucket.delete(','creative_assets'):q(forbidden not in a,'Build 231 API mutation/private boundary crossed: '+forbidden)
q('publicContentPublications' in pub and 'automatic_publication:false' in pub and 'raw_private_caip_exposed:false' in pub,'Build 223 public projection authority drifted')
q('Release 467 Build 231' in h and len(re.findall(r'<h1(?:\s|>)',h,re.I))==1,'Build 231 page identity/one-H1')
q('/public/js/admin-public-story-activation-build231.js?v=467b231' in h,'Build 231 page client activation')
q('/admin/public-story-activation/' in n and 'Workshop Journal & Capability Case-Study Activation' in n,'Build 231 navigation')
q("run_current_contract('scripts/release467_build231_gate.py','Release 467 Build 231')" in s,'Current System Gate must invoke Build 231')
q('HOLD_NO_PUBLISHABLE_EVIDENCE' in d and 'Build **232** remains planned' in d,'Build 231 operations doc')
for zpath in ('functions/api/admin/workshop-journal-case-study-activation.js','public/js/admin-public-story-activation-build231.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 231 WORKSHOP JOURNAL CASE STUDY ACTIVATION: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 231 WORKSHOP JOURNAL CASE STUDY ACTIVATION: PASS')
print('Exit policy: proven public story, ready for human publication, or HOLD_NO_PUBLISHABLE_EVIDENCE')
print('Historical build migration: NONE / canonical prefix 0001-0022 preserved; later forward migrations allowed')
print('Publication authority: EXISTING content_publications / Build 231 GET-ONLY')
print('Future queue exhausted: NO / Build 232 remains planned')
