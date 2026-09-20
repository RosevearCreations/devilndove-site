#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='ee62ddd837d2ecbb8f0695fa7efb19e9dffb8b98';TREE='4c71f152a75c401d3dfd2a5b83852a821dc82cb3';MAIN='16689f6eb5982bb72253aba677cfadf636c89ec9'
PROOFS={'system_gate_run':35486635313,'current_application_quality_run':35486635381,'it_admin_runtime_proof_run':35486635362,'branch_hygiene_run':35486635293}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build206-launch-set-remediation-campaign.json');m=load('migrations/canonical/manifest.json')
route=read('functions/api/admin/storefront-launch-remediation.js');launch=read('functions/api/admin/storefront-launch-set.js');ui=read('public/js/admin-storefront-launch-remediation-v206.js');page=read('admin/catalog-health/index.html');mig=read('migrations/canonical/0007_release467_storefront_launch_remediation.sql')
req(int(p.get('build') or 0)>=206,'current pointer regressed before Build 206')
req('release467-build206-launch-set-remediation-campaign.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 206 authority')
req(b.get('build')==206 and b.get('state')=='PRODUCTION_GREEN' and (b.get('baseline') or {})=={'source_build':204,'products_reviewed':43,'ready':1,'review_required':42},'Build 206 retained authority/baseline drifted')
final=b.get('final_closure') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35486635345,'Build 206 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35486756097 and int(prod.get('production_live_resource_integrity_run') or 0)==35486808590 and int(prod.get('build_specific_proof_run') or 0)==35486756132,'Build 206 Production closure drifted')
exp=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql']
rows=m.get('migrations') or [];req([x.get('file') for x in rows[:7]]==exp and len(rows)>=7,'Build 206 canonical migration prefix 0001-0007 drifted')
for x in ('CREATE TABLE IF NOT EXISTS storefront_launch_remediation_items','UNIQUE(product_id, blocker_code)','completion_evidence'):req(x in mig,f'migration missing {x}')
req('export async function loadProjection' in launch and 'export function summary' in launch,'Build 204 projection must remain directly reusable')
for x in ("from './storefront-launch-set.js'","loadProjection(db,0,MAX_SOURCE_ROWS)","products_reviewed:43","review_required:42"):req(x in route,f'campaign missing {x}')
for x in ('analyzeBuyerReadiness','policyPublicSnapshot','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(x not in route,f'campaign duplicated forbidden authority {x}')
for x in ('data-recheck','/api/admin/storefront-launch-set?mode=product','completion_evidence','Open owner workspace'):req(x.lower() in ui.lower(),f'UI missing {x}')
req('storefrontLaunchRemediationMount' in page and '/public/js/admin-storefront-launch-remediation-v206.js?v=206' in page,'Catalog Health missing Build 206 campaign');req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Catalog Health one-H1 rule failed')
for path in ('functions/api/admin/storefront-launch-set.js','functions/api/admin/storefront-launch-remediation.js','public/js/admin-storefront-launch-remediation-v206.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'JS syntax failed {path}: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 206 RETAINED LAUNCH-SET REMEDIATION CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 206 RETAINED LAUNCH-SET REMEDIATION CLOSURE: PASS')
