#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):return (R/p).read_text(encoding='utf-8')
def l(p):return json.loads(t(p))
p=l('current-development-authority.json');b=l('release467-build227-manufacturing-adoption-command-centre.json');m=l('migrations/canonical/manifest.json')
a=t('functions/api/admin/manufacturing-adoption-command-centre.js');u=t('public/js/admin-manufacturing-adoption-command-centre-build227.js');h=t('admin/manufacturing-adoption/index.html');n=t('data/admin-navigation-modules.json');s=t('scripts/current_system_gate_provenance_gate.py')
DEV='86a599178cfe473afc4dba15890d47db66f015ea';TREE='5694ea94c097505cc8db6795e839073fb210f746';MAIN='2fbbb950b2598a518d14078b0252a8159472fbb7'
PROOFS={'system_gate_run':35671994146,'current_application_quality_run':35671994173,'it_admin_runtime_proof_run':35671994145,'branch_hygiene_run':35671994205}
q(int(p.get('build') or 0)>=227,'pointer regressed behind Build 227')
q(b.get('state')=='PRODUCTION_GREEN','Build 227 retained authority must be Production GREEN')
fc=b.get('final_closure') or {};pc=b.get('production_checkpoint') or {}
q(fc.get('dev_sha')==DEV and fc.get('tree_sha')==TREE and (fc.get('proofs') or {})==PROOFS,'Build 227 exact Development closure drifted')
q(int(fc.get('build_specific_proof_run') or 0)==35671994164,'Build 227 Development proof drifted')
q(pc.get('main_sha')==MAIN and pc.get('tree_sha')==TREE and pc.get('state')=='PRODUCTION_GREEN','Build 227 exact Production closure drifted')
q(int(pc.get('production_pages_deploy_run') or 0)==35672279658 and int(pc.get('production_live_resource_integrity_run') or 0)==35672342976,'Build 227 Production deploy/live proof drifted')
q(int(pc.get('products_browser_proof_run') or 0)==35672342991 and int(pc.get('products_route_proof_run') or 0)==35672343003 and int(pc.get('build_specific_proof_run') or 0)==35672279694,'Build 227 downstream Production proof drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
q(len(files)>=22 and files[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 227 canonical migration retention drifted')
q('export async function onRequestGet' in a and 'onRequestPost' not in a,'Build 227 API must remain GET-only')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','bucket.put(','bucket.delete('):
 q(forbidden not in a,'Build 227 mutation/DDL boundary crossed: '+forbidden)
q('NO_REAL_WORK_YET' in a and 'BROKEN_EXISTING_AUTHORITY' in a and 'next_valid_action' in a,'Build 227 adoption contract drifted')
q('Release 467 Build 227' in h and len(re.findall(r'<h1(?:\\s|>)',h,re.I))==1,'Build 227 page identity/one-H1')
q('/admin/manufacturing-adoption/' in n,'Build 227 navigation missing')
q("run_current_contract('scripts/release467_build227_gate.py','Release 467 Build 227')" in s,'Current System Gate lost Build 227 retained proof')
for zpath in ('functions/api/admin/manufacturing-adoption-command-centre.js','public/js/admin-manufacturing-adoption-command-centre-build227.js'):
 r=subprocess.run(['node','--check',str(R/zpath)],capture_output=True,text=True);q(r.returncode==0,zpath+' syntax: '+(r.stderr or r.stdout)[-600:])
if F:
 print('RELEASE 467 BUILD 227 RETAINED MANUFACTURING ADOPTION: FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 227 RETAINED MANUFACTURING ADOPTION: PASS')
print('Development: EXACT BRANCH HEAD FOUR-PROOF GREEN')
print('Production: EXACT SAME TREE GREEN')
print('Mutation authority: NONE / GET-ONLY ADOPTION PROJECTION')
