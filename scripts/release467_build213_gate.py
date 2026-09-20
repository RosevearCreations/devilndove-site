#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='7891a869d748072846a1ac9452782e119f01cd53';TREE='f972119d10f98ea566173868915463ce31cdf22c';MAIN='9ea6c728a4df978d653be910388ea7081b800de9'
PROOFS={'system_gate_run':35526209718,'current_application_quality_run':35526209719,'it_admin_runtime_proof_run':35526209723,'branch_hygiene_run':35526209630}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build213-digital-proof-customer-approval.json');b212=load('release467-build212-hybrid-creative-project-operations.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0013_release467_digital_proof_customer_approval.sql')
admin=read('functions/api/admin/custom-work-proof.js');public=read('functions/api/custom-request-proof.js');artifact=read('functions/api/custom-request-proof-artifact.js');helper=read('functions/api/_lib/customRequestProofReadiness.js')
client=read('public/js/admin-custom-work-proof-build213.js');public_client=read('public/js/custom-request-proof-build213.js');admin_page=read('admin/custom-request/index.html');public_page=read('custom-request/proof/index.html')
req(p.get('build')==213 and p.get('title')=='Digital Proof & Customer Approval','Build 213 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 213 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==212 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35526432043 and int(prod.get('production_live_resource_integrity_run') or 0)==35526530121,'Build 212 Production predecessor drifted')
req(b.get('build')==213 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 213 authority drifted')
req(b212.get('state')=='PRODUCTION_GREEN','Build 212 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==13 and files[-1]=='0013_release467_digital_proof_customer_approval.sql','canonical migration stream must end at 0013')
for token in (
 'CREATE TABLE IF NOT EXISTS custom_request_proof_versions',
 'CREATE TABLE IF NOT EXISTS custom_request_proof_events',
 "proof_status IN ('draft','sent','viewed','changes_requested','approved','expired','superseded')",
 "source_kind IN ('text_only','customer_safe_url','stage_photo','packaging_version')",
 'REFERENCES custom_requests(custom_request_id)',
 'REFERENCES custom_order_stage_photos(custom_order_stage_photo_id)',
 'REFERENCES packaging_project_versions(packaging_project_version_id)',
 'UNIQUE(custom_request_id, version_number)'
):req(token in mig,f'Build 213 migration missing {token}')
for forbidden in ('INSERT INTO custom_request_proof_versions','INSERT INTO custom_request_proof_events'):req(forbidden not in mig,'migration 0013 must create no proof business rows')
for src,label in ((admin,'admin API'),(public,'public API'),(artifact,'artifact API'),(helper,'readiness helper')):
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):
  req(ddl not in src.upper(),f'Build 213 {label} contains request-time DDL {ddl}')
for token in ('custom_request_proof_versions','custom_request_proof_events','proofToken','packaging_project_versions','custom_order_stage_photos','publication_authorized:false','provider_message_sent:false','caip_private_originals_exposed:false','activate_link','internal_review'):req(token in admin,f'Build 213 admin API missing {token}')
for token in ('loadCustomRequestProofReadiness','proof_required','exact_customer_approved_version','production_ready','customer_approval_is_publication_approval:false'):req(token in helper,f'Build 213 readiness helper missing {token}')
for token in ("CUSTOMER_STATUSES=new Set(['sent','viewed'])","'approve','request_changes'","publication_authorized:false","customer_approval_is_publication_approval:false"):req(token in public,f'Build 213 public API missing {token}')
req('packaging_project_versions' in artifact and "Content-Security-Policy" in artifact and 'caip' not in artifact.lower().replace('// no caip/private-media access and no mutation.',''),'Packaging artifact bridge safety drifted')
for forbidden in ('bucket.put(','bucket.delete(','INSERT INTO creative_assets','INSERT INTO creative_projects','UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO payments','INSERT INTO orders'):
 req(forbidden not in (admin+public+artifact),f'Build 213 touches forbidden authority: {forbidden}')
for token in ('Digital proof & customer approval','Create proof version','Production proof gate','Activate link','Copy link'):req(token in client,f'Build 213 admin client missing {token}')
for token in ('Review your design proof','Approve this exact version','Request changes','does not authorize public posting'):req(token in public_client+public_page,f'Build 213 customer surface missing {token}')
req('customWorkProof213Mount' in admin_page and '/public/js/admin-custom-work-proof-build213.js?v=467b213' in admin_page,'Custom Work page missing Build 213 workspace')
req('/public/js/custom-request-proof-build213.js?v=467b213' in public_page,'Private proof page missing Build 213 customer client')
req('noindex,nofollow' in public_page and 'no-referrer' in public_page,'Private proof page privacy metadata missing')
req(len(re.findall(r'<h1(?:\s|>)',admin_page,re.I))==1,'Custom Work admin page must retain exactly one H1')
req(len(re.findall(r'<h1(?:\s|>)',public_page,re.I))==1,'Private proof page must contain exactly one H1')
for path in ('functions/api/admin/custom-work-proof.js','functions/api/custom-request-proof.js','functions/api/custom-request-proof-artifact.js','functions/api/_lib/customRequestProofReadiness.js','public/js/admin-custom-work-proof-build213.js','public/js/custom-request-proof-build213.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1000:]}')
if FAIL:print('RELEASE 467 BUILD 213 DIGITAL PROOF & CUSTOMER APPROVAL: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 213 DIGITAL PROOF & CUSTOMER APPROVAL: PASS')
print('Customer approval publication authority: ZERO')
print('Provider messaging / payment / Inventory / CAIP private media mutation: ZERO')
