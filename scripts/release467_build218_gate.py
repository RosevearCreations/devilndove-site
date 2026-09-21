#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='068b99a9f4f5e32e4d3547a69a23549d9dcd1c1a';TREE='0bb22258a030eb529be3a7b5faf9ba12baa66f46';MAIN='24b59add984ea0be5acc3ebe3bf8ae558db747ee'
PROOFS={'system_gate_run':35556952902,'current_application_quality_run':35556952735,'it_admin_runtime_proof_run':35556952815,'branch_hygiene_run':35556952797}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build218-quote-production-cost-margin-guardrails.json');m=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/custom-work-margin-guardrails.js');ui=read('public/js/admin-custom-work-margin-guardrails-build218.js');page=read('admin/custom-request/index.html')
req(int(p.get('build') or 0)>=218,'current successor must retain Build 218 or later')
req(b.get('build')==218 and b.get('state')=='PRODUCTION_GREEN','Build 218 retained authority must be Production GREEN')
final=b.get('final_closure') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35556952722,'Build 218 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35557094198 and int(prod.get('production_live_resource_integrity_run') or 0)==35557137931 and int(prod.get('products_browser_proof_run') or 0)==35557137831 and int(prod.get('products_route_proof_run') or 0)==35557137932 and int(prod.get('build_specific_proof_run') or 0)==35557094182 and prod.get('state')=='PRODUCTION_GREEN','Build 218 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=17 and files[16]=='0017_release467_production_cost_evidence_v2.sql','retained canonical stream lost migration 0017')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),'Build 218 retained API contains request-time DDL '+ddl)
for token in ('custom_request_quote_drafts','custom_request_quote_revisions','creative_project_production_cost_evidence','unknown_cost_is_zero:false','automatic_price_rewrite:false','accounting_posting:false','inventory_mutation:false'):req(token in api,'Build 218 retained API missing '+token)
for token in ('Quote ↔ Production Cost ↔ Margin Guardrails','Quote revenue lane','Production cost evidence lane','Unknown cost remains unknown'):req(token in ui,'Build 218 retained UI missing '+token)
req('customWorkMarginGuardrails218Mount' in page and '/public/js/admin-custom-work-margin-guardrails-build218.js?v=467b218' in page,'Custom Work page lost Build 218 workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/admin/custom-work-margin-guardrails.js','public/js/admin-custom-work-margin-guardrails-build218.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 218 QUOTE PRODUCTION COST MARGIN GUARDRAILS: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 218 QUOTE PRODUCTION COST MARGIN GUARDRAILS: PASS')
print('Build 218 Development closure: EXACT GREEN')
print('Build 218 Production closure: EXACT GREEN')
print('Build 218 authority: RETAINED BY SUCCESSOR')
