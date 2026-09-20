#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='9b6b22291bd98bdd2d57c8793a0c892f937b4287';TREE='36bed0abebbb47b375277562355c3517d171b629';MAIN='9a1bd2b3d99edf69651a17e790866d3b8fa744d4'
PROOFS={'system_gate_run':35517349532,'current_application_quality_run':35517349713,'it_admin_runtime_proof_run':35517349672,'branch_hygiene_run':35517349600}
REQUIRED=('laser-engraving','cricut-vinyl-htv','resin','3d-printing','cnc-machining','metal-lathe','jewelry','paracord','lapidary','candles-soap','packaging-labeling','mechanical-automotive-fabrication')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build209-workshop-capability-profiles-constraints.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=209,'current pointer regressed before Build 209')
req('release467-build209-workshop-capability-profiles-constraints.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 209 authority')
req(b.get('build')==209 and b.get('state')=='PRODUCTION_GREEN','Build 209 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35517349698,'Build 209 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35517517613 and int(prod.get('production_live_resource_integrity_run') or 0)==35517574976 and int(prod.get('build_specific_proof_run') or 0)==35517517656,'Build 209 Production closure drifted')
mig=read('migrations/canonical/0009_release467_workshop_capability_profiles.sql')
req('CREATE TABLE IF NOT EXISTS workshop_capability_profiles' in mig,'Build 209 profile table missing')
req(mig.count('INSERT OR IGNORE INTO workshop_capability_profiles')==12,'Build 209 initial profile count drifted')
for key in REQUIRED:req(f"'{key}'" in mig,f'Build 209 missing capability {key}')
hub=read('capabilities/index.html');req(len(re.findall(r'<h1(?:\s|>)',hub,re.I))==1,'capability hub must retain one H1')
for path in ('functions/api/capabilities.js','functions/api/admin/workshop-capabilities.js','public/js/capabilities.js','public/js/admin-workshop-capabilities.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed')
if FAIL:print('RELEASE 467 BUILD 209 RETAINED CAPABILITY PROFILES CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 209 RETAINED CAPABILITY PROFILES CLOSURE: PASS')
