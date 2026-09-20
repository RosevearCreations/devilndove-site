#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[];DEV='61163ceaeb07a28cac1df0f9ff6b3ab46b498c02';TREE='0710a7dfe8a81342704c92b810d6e18249b960e7';MAIN='0a6144bc4b9767c06ccf82a78853b8375a55637a';PROOFS={'system_gate_run':35485817330,'current_application_quality_run':35485817347,'it_admin_runtime_proof_run':35485817370,'branch_hygiene_run':35485817325}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p))
p=load('current-development-authority.json');b=load('release467-build206-launch-set-remediation-campaign.json');m=load('migrations/canonical/manifest.json');route=read('functions/api/admin/storefront-launch-remediation.js');launch=read('functions/api/admin/storefront-launch-set.js');ui=read('public/js/admin-storefront-launch-remediation-v206.js');page=read('admin/catalog-health/index.html');mig=read('migrations/canonical/0007_release467_storefront_launch_remediation.sql')
req(p.get('build')==206 and p.get('title')=='Launch-Set Remediation Campaign' and p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 206 pointer/predecessor drifted');req((p.get('acceptance') or {})==PROOFS,'Build 206 inherited proofs drifted')
last=(p.get('restart_integrity') or {}).get('last_fully_verified') or {};req(last.get('build')==205 and last.get('dev_sha')==DEV and last.get('tree_sha')==TREE,'Build 205 restart predecessor drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==205 and prod.get('main_sha')==MAIN and int(prod.get('production_pages_deploy_run') or 0)==35485914734 and int(prod.get('production_live_resource_integrity_run') or 0)==35485940566,'Build 205 Production predecessor drifted')
req(b.get('build')==206 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and (b.get('baseline') or {})=={'source_build':204,'products_reviewed':43,'ready':1,'review_required':42},'Build 206 authority/baseline drifted')
exp=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql'];rows=m.get('migrations') or [];req([x.get('file') for x in rows]==exp,'canonical migrations must be exactly 0001-0007')
for x in ('CREATE TABLE IF NOT EXISTS storefront_launch_remediation_items','UNIQUE(product_id, blocker_code)','completion_evidence'):req(x in mig,f'migration missing {x}')
req('export async function loadProjection' in launch and 'export function summary' in launch,'Build 204 projection must remain directly reusable')
for x in ("from './storefront-launch-set.js'","loadProjection(db,0,MAX_SOURCE_ROWS)","products_reviewed:43","review_required:42"):req(x in route,f'campaign missing {x}')
for x in ('analyzeBuyerReadiness','policyPublicSnapshot','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(x not in route,f'campaign duplicated forbidden authority {x}')
for x in ('data-recheck','/api/admin/storefront-launch-set?mode=product','completion_evidence','Open owner workspace'):req(x.lower() in ui.lower(),f'UI missing {x}')
req('storefrontLaunchRemediationMount' in page and '/public/js/admin-storefront-launch-remediation-v206.js?v=206' in page,'Catalog Health missing Build 206 campaign');req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Catalog Health one-H1 rule failed')
for path in ('functions/api/admin/storefront-launch-set.js','functions/api/admin/storefront-launch-remediation.js','public/js/admin-storefront-launch-remediation-v206.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'JS syntax failed {path}: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 206 LAUNCH-SET REMEDIATION CAMPAIGN: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 206 LAUNCH-SET REMEDIATION CAMPAIGN: PASS')
