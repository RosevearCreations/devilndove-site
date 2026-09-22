#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='4a195f435c4491408db6c39dadc1d874d166cf36';TREE='2ec97031a2c774fc2920a03d6fc72d63998421b8';MAIN='4ba7631cfd0da23925c82b1ec3cf8ed247b75f0c'
PROOFS={'system_gate_run':35677766703,'current_application_quality_run':35677766653,'it_admin_runtime_proof_run':35677766460,'branch_hygiene_run':35677766514}
def q(x,m):
 if not x:F.append(m)
def t(p):
 f=R/p
 if not f.is_file():F.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def l(p):return json.loads(t(p) or '{}')
p=l('current-development-authority.json');b=l('release467-build229-first-creative-project-prototype-to-run-pilot.json');m=l('migrations/canonical/manifest.json')
q(int(p.get('build') or 0)>=229,'current pointer regressed before Build 229')
q('release467-build229-first-creative-project-prototype-to-run-pilot.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 229 authority')
q(b.get('build')==229 and b.get('state')=='PRODUCTION_GREEN','Build 229 retained authority must be Production GREEN')
final=b.get('final_closure') or {};q(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35677766604,'Build 229 exact Development closure drifted')
q(final.get('business_exit')=='HOLD_NO_REAL_PROJECT','Build 229 bounded business exit drifted')
prod=b.get('production_checkpoint') or {};q(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35678474432 and int(prod.get('production_live_resource_integrity_run') or 0)==35678533786 and int(prod.get('build_specific_proof_run') or 0)==35678474416,'Build 229 Production closure drifted')
q(prod.get('business_exit')=='HOLD_NO_REAL_PROJECT','Build 229 Production business exit drifted')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)>=22 and mf[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 229 retained canonical stream drifted')
a=t('functions/api/admin/creative-project-prototype-run-pilot.js');q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 229 retained API must remain GET-only')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):q(forbidden not in a,'Build 229 retained API crossed mutation boundary: '+forbidden)
for zpath in ('functions/api/admin/creative-project-prototype-run-pilot.js','public/js/admin-creative-project-prototype-run-pilot-build229.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 229 RETAINED PROTOTYPE-TO-RUN CLOSURE: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 229 RETAINED PROTOTYPE-TO-RUN CLOSURE: PASS')
print('Business exit: HOLD_NO_REAL_PROJECT / no synthetic records')
