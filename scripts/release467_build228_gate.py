#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='db896df37a89e3477d77a26707277d0ca65eed5d';TREE='414d747065b3d95002224fa4975c6da86a5d7c79';MAIN='9b4a12fe90b207006c9593d7440f56bf681c43aa'
PROOFS={'system_gate_run':35675467679,'current_application_quality_run':35675467644,'it_admin_runtime_proof_run':35675467795,'branch_hygiene_run':35675467898}
def q(x,m):
 if not x:F.append(m)
def t(p):
 f=R/p
 if not f.is_file():F.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def l(p):return json.loads(t(p) or '{}')
p=l('current-development-authority.json');b=l('release467-build228-first-real-custom-work-route-to-proof-pilot.json');m=l('migrations/canonical/manifest.json')
q(int(p.get('build') or 0)>=228,'current pointer regressed before Build 228')
q('release467-build228-first-real-custom-work-route-to-proof-pilot.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 228 authority')
q(b.get('build')==228 and b.get('state')=='PRODUCTION_GREEN','Build 228 retained authority must be Production GREEN')
final=b.get('final_closure') or {};q(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35675467986,'Build 228 exact Development closure drifted')
q(final.get('business_exit')=='HOLD_NO_REAL_REQUEST','Build 228 bounded business exit drifted')
prod=b.get('production_checkpoint') or {};q(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35675671813 and int(prod.get('production_live_resource_integrity_run') or 0)==35675740985 and int(prod.get('build_specific_proof_run') or 0)==35675671688,'Build 228 Production closure drifted')
q(prod.get('business_exit')=='HOLD_NO_REAL_REQUEST','Build 228 Production business exit drifted')
mf=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(mf)>=22 and mf[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 228 retained canonical 0001-0022 boundary drifted');q(len(mf)==22 or int(p.get('build') or 0)>=234,'later canonical migrations require a verified forward successor')
a=t('functions/api/admin/custom-work-route-proof-pilot.js');q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 228 retained API must remain GET-only')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):q(forbidden not in a,'Build 228 retained API crossed mutation boundary: '+forbidden)
for zpath in ('functions/api/admin/custom-work-route-proof-pilot.js','public/js/admin-custom-work-route-proof-pilot-build228.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 228 RETAINED ROUTE-TO-PROOF CLOSURE: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 228 RETAINED ROUTE-TO-PROOF CLOSURE: PASS')
print('Business exit: HOLD_NO_REAL_REQUEST / no synthetic records')
