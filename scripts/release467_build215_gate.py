#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
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
p=load('current-development-authority.json');b=load('release467-build215-small-batch-corporate-event-quoting.json');b214=load('release467-build214-prototype-sample-production-run.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0015_release467_small_batch_corporate_event_quoting.sql')
api=read('functions/api/admin/custom-work-batch-quote.js');ui=read('public/js/admin-custom-work-batch-quote-build215.js')
admin_owner=read('functions/api/admin/custom-requests.js');public_api=read('functions/api/custom-request-quote.js');public_ui=read('public/js/custom-request-quote-preview.js');page=read('admin/custom-request/index.html')
req(p.get('build')==215 and p.get('title')=='Small-Batch, Corporate & Event Quoting','Build 215 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 215 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==214 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35545124565 and int(prod.get('production_live_resource_integrity_run') or 0)==35545169766,'Build 214 Production predecessor drifted')
req(b.get('build')==215 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 215 authority drifted')
req(b214.get('state')=='PRODUCTION_GREEN','Build 214 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==15 and files[-1]=='0015_release467_small_batch_corporate_event_quoting.sql','canonical migration stream must end at 0015')
for token in (
 'CREATE TABLE IF NOT EXISTS custom_request_quote_batch_terms',
 'CREATE TABLE IF NOT EXISTS custom_request_quote_quantity_tiers',
 'REFERENCES custom_requests(custom_request_id)',
 'REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id)',
 "unit_assumption_mode IN ('single_unit','tiered','mixed','manual')",
 "personalization_scope IN ('none','fixed','variable','mixed','unknown')",
 "handoff_method IN ('tbd','pickup','shipping','event_handoff','corporate_delivery','other')",
 "production_cost_state IN ('unknown','partial','reviewed')",
 'idx_custom_quote_quantity_tiers_selected'
):req(token in mig,f'Build 215 migration missing {token}')
for forbidden in ('INSERT INTO custom_request_quote_batch_terms','INSERT INTO custom_request_quote_quantity_tiers'):req(forbidden not in mig,'migration 0015 must create no quote business rows')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):
 req(ddl not in api.upper(),f'Build 215 admin API contains request-time DDL {ddl}')
 req(ddl not in public_api.upper(),f'active public quote API contains request-time DDL {ddl}')
for token in (
 'custom_request_quote_drafts','custom_request_quote_line_items','custom_request_quote_revisions',
 'custom_request_quote_batch_terms','custom_request_quote_quantity_tiers',
 "build215_batch_units","build215_setup","build215_prototype_sample","build215_packaging",
 'recordRevision','termsSummary','production_cost_state','unknown_cost_is_zero:false',
 'payment_execution:false','provider_execution:false','order_creation:false'
):req(token in api,f'Build 215 admin API missing {token}')
for forbidden in ('INSERT INTO payments','INSERT INTO orders','INSERT INTO custom_request_order_drafts','INSERT INTO custom_request_payment_request_drafts','bucket.put(','bucket.delete('):
 req(forbidden not in api,f'Build 215 admin extension touches forbidden execution authority: {forbidden}')
for token in ('build215BatchQuoteContext','build215_batch_terms','build215_quantity_tiers'):req(token in admin_owner,f'existing Custom Work owner handoff missing Build 215 context: {token}')
for token in ('batch_terms','quantity_tiers','effectiveExpiresAt','build215_batch_terms','build215_quantity_tiers'):req(token in public_api,f'customer quote API missing Build 215 integration: {token}')
for token in ('Small-batch, corporate & event quoting','Production-cost evidence','Quantity tiers','Unknown production cost'):req(token in ui,f'Build 215 admin UI missing {token}')
for token in ('Batch / corporate assumptions','Production-cost evidence','Unknown — not treated as zero'):req(token in public_ui,f'customer quote UI missing {token}')
req('customWorkBatchQuote215Mount' in page and '/public/js/admin-custom-work-batch-quote-build215.js?v=467b215' in page,'Custom Work page missing Build 215 workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain one H1')
for path in ('functions/api/admin/custom-work-batch-quote.js','functions/api/admin/custom-requests.js','functions/api/custom-request-quote.js','public/js/admin-custom-work-batch-quote-build215.js','public/js/custom-request-quote-preview.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1500:]}')
if FAIL:print('RELEASE 467 BUILD 215 SMALL-BATCH CORPORATE EVENT QUOTING: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 215 SMALL-BATCH CORPORATE EVENT QUOTING: PASS')
print('Existing quote drafts / revisions / line items: REUSED')
print('Unknown production cost -> zero: FORBIDDEN')
print('Payment / provider / real-order execution: ZERO')
