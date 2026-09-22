#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='b67c23231d06f9faaf2952784878c11784936c48';TREE='42d45f7d521b4f93a891cea9351dc65f656f89c6';MAIN='eab246604f1fd3a7d4762d17ee4868451f87584b'
PROOFS={'system_gate_run':35681244435,'current_application_quality_run':35681244619,'it_admin_runtime_proof_run':35681244610,'branch_hygiene_run':35681244451}
def q(x,m):
 if not x:F.append(m)
def t(p):
 f=R/p
 if not f.is_file():F.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def l(p):return json.loads(t(p) or '{}')
p=l('current-development-authority.json');b=l('release467-build230-cost-margin-qa-knowledge-evidence-adoption.json');m=l('migrations/canonical/manifest.json')
q(int(p.get('build') or 0)>=230,'current pointer regressed before Build 230')
q('release467-build230-cost-margin-qa-knowledge-evidence-adoption.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 230 authority')
q(b.get('build')==230 and b.get('state')=='PRODUCTION_GREEN','Build 230 retained authority must be Production GREEN')
final=b.get('final_closure') or {};q(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35681244469,'Build 230 exact Development closure drifted')
q(final.get('business_exit')=='HOLD_NO_QUALIFYING_REAL_RUN','Build 230 bounded business exit drifted')
prod=b.get('production_checkpoint') or {};q(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35681417751 and int(prod.get('production_live_resource_integrity_run') or 0)==35681463987 and int(prod.get('build_specific_proof_run') or 0)==35681417827,'Build 230 Production closure drifted')
q(prod.get('business_exit')=='HOLD_NO_QUALIFYING_REAL_RUN','Build 230 Production business exit drifted')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)>=22 and mf[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 230 retained canonical stream drifted')
a=t('functions/api/admin/cost-margin-qa-knowledge-adoption.js');q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 230 retained API must remain GET-only')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):q(forbidden not in a,'Build 230 retained API crossed mutation boundary: '+forbidden)
for zpath in ('functions/api/admin/cost-margin-qa-knowledge-adoption.js','public/js/admin-cost-margin-qa-knowledge-adoption-build230.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 230 RETAINED EVIDENCE ADOPTION CLOSURE: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 230 RETAINED EVIDENCE ADOPTION CLOSURE: PASS')
print('Business exit: HOLD_NO_QUALIFYING_REAL_RUN / no synthetic evidence')
