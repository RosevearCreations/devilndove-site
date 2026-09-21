#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='17d606f63d91ec178668c215caf263b95e3bd580';TREE='cffc68c278b69f389372e4d43c022a9f0140a9d1';MAIN='94a977f0732cc649037423a415dfba60417d4a47'
PROOFS={'system_gate_run':35553944193,'current_application_quality_run':35553944303,'it_admin_runtime_proof_run':35553944241,'branch_hygiene_run':35553944239}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build218-quote-production-cost-margin-guardrails.json');b217=load('release467-build217-production-cost-evidence-v2.json');m=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/custom-work-margin-guardrails.js');ui=read('public/js/admin-custom-work-margin-guardrails-build218.js');page=read('admin/custom-request/index.html')
req(p.get('build')==218 and p.get('title')=='Quote ↔ Production Cost ↔ Margin Guardrails','Build 218 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 218 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==217 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35554258043 and int(prod.get('production_live_resource_integrity_run') or 0)==35554327033,'Build 217 Production predecessor drifted')
req(b.get('build')==218 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 218 authority drifted')
req((b.get('safety') or {}).get('schema_change') is False,'Build 218 must remain schema-neutral')
req(b217.get('state')=='PRODUCTION_GREEN','Build 217 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==17 and files[-1]=='0017_release467_production_cost_evidence_v2.sql','Build 218 must retain canonical migrations through 0017 only')
req(not list((ROOT/'migrations/canonical').glob('*218*')),'Build 218 declared schema-neutral but a Build 218 canonical migration exists')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):
 req(ddl not in api.upper(),f'Build 218 API contains request-time DDL {ddl}')
for token in (
 'custom_request_quote_drafts','custom_request_quote_line_items','custom_request_quote_revisions',
 'creative_project_manufacturing_lifecycles','creative_project_production_cost_evidence',
 'loadProductLinks','buildProfitabilityEvidence','loadProfitabilityIntelligence',
 "revision_type='build218_margin_review'","'build218_margin_review'","action!=='record_review'",
 'expected_production_cost_cents','expected_unit_cost_cents','actual_reviewed_direct_cost_cents',
 'unknown_cost_is_zero:false','automatic_price_rewrite:false','accounting_posting:false','inventory_mutation:false'
):req(token in api,f'Build 218 API missing {token}')
req("INSERT INTO custom_request_quote_revisions" in api,'Build 218 must append review through existing quote revision authority')
for forbidden in (
 'UPDATE custom_request_quote_line_items','UPDATE custom_request_quote_drafts SET','UPDATE products SET','UPDATE site_item_inventory',
 'INSERT INTO accounting_','UPDATE creative_project_profitability','INSERT INTO payments','INSERT INTO orders','bucket.put(','bucket.delete('
):req(forbidden not in api,f'Build 218 crosses authority boundary: {forbidden}')
for token in (
 'Quote ↔ Production Cost ↔ Margin Guardrails','Quote revenue lane','Production cost evidence lane','Expected ↔ actual review',
 'Linked-resource margin — Product evidence only','Full Finance profitability — separate authority',
 'Unknown cost remains unknown','Append margin review','does not rewrite price lines'
):req(token in ui,f'Build 218 UI missing {token}')
req('customWorkMarginGuardrails218Mount' in page and '/public/js/admin-custom-work-margin-guardrails-build218.js?v=467b218' in page,'Custom Work page missing Build 218 workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
req('data:' not in ui,'Build 218 UI contains literal data: token that would inflate legacy inline-data budget')
for path in ('functions/api/admin/custom-work-margin-guardrails.js','public/js/admin-custom-work-margin-guardrails-build218.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1500:]}')
if FAIL:
 print('RELEASE 467 BUILD 218 QUOTE PRODUCTION COST MARGIN GUARDRAILS: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 218 QUOTE PRODUCTION COST MARGIN GUARDRAILS: PASS')
print('Schema change: ZERO')
print('Quote revision authority: REUSED')
print('Unknown cost -> zero: FORBIDDEN')
print('Automatic price rewrite: ZERO')
print('Inventory / Finance / Accounting / payment / provider / order execution: ZERO')
