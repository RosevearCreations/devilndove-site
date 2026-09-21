#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='45a6bbb5ea01fa8b79ea9df331d87086ca5c7657';TREE='6792f4ed926e3c52b197dfe8f3cc68e074b92d62';MAIN='6e3e8f04578998e16e1e8b8d27daad28b2332603'
PROOFS={'system_gate_run':35544979662,'current_application_quality_run':35544979675,'it_admin_runtime_proof_run':35544979731,'branch_hygiene_run':35544979736}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build214-prototype-sample-production-run.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=214,'current pointer regressed before Build 214')
req('release467-build214-prototype-sample-production-run.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 214 authority')
req(b.get('build')==214 and b.get('state')=='PRODUCTION_GREEN','Build 214 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35544979792,'Build 214 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35545124565 and int(prod.get('production_live_resource_integrity_run') or 0)==35545169766 and int(prod.get('build_specific_proof_run') or 0)==35545124482,'Build 214 Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req('0014_release467_prototype_sample_production_run.sql' in files,'Build 214 migration missing from canonical stream')
if FAIL:print('RELEASE 467 BUILD 214 RETAINED PROTOTYPE SAMPLE PRODUCTION RUN CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 214 RETAINED PROTOTYPE SAMPLE PRODUCTION RUN CLOSURE: PASS')
