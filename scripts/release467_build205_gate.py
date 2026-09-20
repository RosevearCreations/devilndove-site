#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='61163ceaeb07a28cac1df0f9ff6b3ab46b498c02';TREE='0710a7dfe8a81342704c92b810d6e18249b960e7';MAIN='0a6144bc4b9767c06ccf82a78853b8375a55637a';PROOFS={'system_gate_run':35485817330,'current_application_quality_run':35485817347,'it_admin_runtime_proof_run':35485817370,'branch_hygiene_run':35485817325}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
p=load('current-development-authority.json');b=load('release467-build205-current-authority-manufacturing-era-roadmap-convergence.json');m=load('migrations/canonical/manifest.json')
req(b.get('release')==467 and b.get('build')==205 and b.get('title')=='Current Authority & Manufacturing-Era Roadmap Convergence','Build 205 identity drifted')
req(b.get('state')=='PRODUCTION_GREEN','Build 205 closure must remain Production GREEN')
f=b.get('final_closure') or {};req(f.get('dev_sha')==DEV and f.get('tree_sha')==TREE and (f.get('proofs') or {})==PROOFS,'Build 205 exact Development closure drifted')
q=b.get('production_checkpoint') or {};req(q.get('main_sha')==MAIN and q.get('tree_sha')==TREE and int(q.get('production_pages_deploy_run') or 0)==35485914734 and int(q.get('production_live_resource_integrity_run') or 0)==35485940566,'Build 205 Production closure drifted')
exp=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql'];rows=m.get('migrations') or [];req([x.get('file') for x in rows[:6]]==exp,'Build 205 migration prefix drifted')
pb=int(p.get('build') or 0);req(pb>=205,'current pointer regressed before Build 205');a=[str(x) for x in p.get('current_release_authorities') or []];req('release467-build205-current-authority-manufacturing-era-roadmap-convergence.json' in a,'Build 205 authority missing from successor chain')
if FAIL:print('RELEASE 467 BUILD 205 RETAINED CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 205 RETAINED CLOSURE: PASS')
