#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='3292ac5c20780e23bd9d5ae593368e82b6e4826b';TREE='1108fecdeac23c69b8ea4d810c0375a0899ff469';MAIN='92df5745fc2d4311dfacfbd214c1032a34c46bb8'
PROOFS={'system_gate_run':35533703475,'current_application_quality_run':35533703446,'it_admin_runtime_proof_run':35533703481,'branch_hygiene_run':35533703474}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build213-digital-proof-customer-approval.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=213,'current pointer regressed before Build 213')
req('release467-build213-digital-proof-customer-approval.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 213 authority')
req(b.get('build')==213 and b.get('state')=='PRODUCTION_GREEN','Build 213 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35533703458,'Build 213 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35534081643 and int(prod.get('production_live_resource_integrity_run') or 0)==35534292686 and int(prod.get('build_specific_proof_run') or 0)==35534081642,'Build 213 Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req('0013_release467_digital_proof_customer_approval.sql' in files,'Build 213 migration missing from canonical stream')
mig=read('migrations/canonical/0013_release467_digital_proof_customer_approval.sql');admin=read('functions/api/admin/custom-work-proof.js');public=read('functions/api/custom-request-proof.js')
for token in ('custom_request_proof_versions','custom_request_proof_events','REFERENCES custom_requests(custom_request_id)'):req(token in mig,f'Build 213 migration lost {token}')
for src,label in ((admin,'admin API'),(public,'public API')):
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):req(ddl not in src.upper(),f'Build 213 {label} contains request-time DDL {ddl}')
if FAIL:print('RELEASE 467 BUILD 213 RETAINED DIGITAL PROOF CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 213 RETAINED DIGITAL PROOF CLOSURE: PASS')
