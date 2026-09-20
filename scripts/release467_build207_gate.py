#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='ee62ddd837d2ecbb8f0695fa7efb19e9dffb8b98';TREE='4c71f152a75c401d3dfd2a5b83852a821dc82cb3';MAIN='16689f6eb5982bb72253aba677cfadf636c89ec9'
PROOFS={'system_gate_run':35486635313,'current_application_quality_run':35486635381,'it_admin_runtime_proof_run':35486635362,'branch_hygiene_run':35486635293}
REQUIRED_KEYS=('laser-engraving','3d-printing','cnc-machining','resin','polymer-clay','candles','soap-bath-body','metal-ring-work','wire-wrapping','paracord','lapidary','soldering','forging-heat-work','metal-lathe','cricut-vinyl-htv','apparel-hat-finishing','drinkware-personalization','packaging-labeling','mechanical-automotive-fabrication','photography-content','mixed-media-hybrid','general-workshop')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build207-workshop-capability-process-taxonomy-expansion.json');b206=load('release467-build206-launch-set-remediation-campaign.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0008_release467_workshop_process_taxonomy.sql');api=read('functions/api/admin/inventory-process-assignments.js');page=read('admin/inventory-operations/index.html');doc=read('docs/operations/RELEASE_467_BUILD_207_WORKSHOP_CAPABILITY_PROCESS_TAXONOMY_EXPANSION.md')
req(p.get('build')==207 and p.get('title')=='Workshop Capability & Process Taxonomy Expansion','Build 207 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 207 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==206 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35486756097 and int(prod.get('production_live_resource_integrity_run') or 0)==35486808590,'Build 206 Production predecessor drifted')
req(b.get('build')==207 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 207 authority drifted')
req(b206.get('state')=='PRODUCTION_GREEN','Build 206 must remain the Production-GREEN predecessor')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
expected=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql','0008_release467_workshop_process_taxonomy.sql']
req(files==expected,'canonical migrations must be exactly 0001-0008 for Build 207')
for key in REQUIRED_KEYS:req(key in (mig+read('migrations/canonical/0005_release467_inventory_process_assignment.sql')),f'missing canonical process key {key}')
req('inventory_process_assignments' not in '\n'.join(line for line in mig.splitlines() if not line.lstrip().startswith('--')),'Build 207 migration must not write Tool/Supply assignments')
req('DROP TABLE' not in mig.upper() and 'ALTER TABLE' not in mig.upper(),'Build 207 taxonomy migration must remain additive/reference-only')
for token in ('const TAXONOMY_BUILD = 207','taxonomy_authority:\'inventory_processes\'','taxonomy_build:TAXONOMY_BUILD',"IN ('tool','supply')","action==='create_process'","action!=='assign'","action==='clear'"):req(token in api,f'process API missing {token}')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in api.upper(),f'process API contains request-time DDL {forbidden}')
req('id="workshopProcessTaxonomyBuild207"' in page and 'Release 467 Build 207' in page,'Inventory Operations missing Build 207 taxonomy note')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Inventory Operations must retain exactly one H1')
for token in ('Build 206 is exact-SHA Production GREEN','22 required canonical process keys','No parallel process dictionary'):req(token in doc,f'Build 207 doc missing {token}')
q=subprocess.run(['node','--check',str(ROOT/'functions/api/admin/inventory-process-assignments.js')],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'process API syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 207 WORKSHOP CAPABILITY & PROCESS TAXONOMY EXPANSION: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 207 WORKSHOP CAPABILITY & PROCESS TAXONOMY EXPANSION: PASS')
print('Canonical process coverage: 22 required keys')
print('Tool/Supply assignment authority: PRESERVED')
print('Automatic inventory assignment: ZERO')
