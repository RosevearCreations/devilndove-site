#!/usr/bin/env python3
"""Release 451 marketplace calibration + SEO preservation source gate."""
from pathlib import Path
import re, subprocess
ROOT=Path(__file__).resolve().parents[1]
failures=[]
def text(p): return (ROOT/p).read_text(encoding='utf-8')
def require(ok,msg):
    if not ok: failures.append(msg)
def has(p,*needles):
    value=text(p)
    for n in needles: require(n in value,f'{p} missing {n!r}')
    return value

helper=has('functions/api/_lib/marketplaceCalibration.js','MARKETPLACE_CALIBRATION_RELEASE = 451','CALIBRATION_CHECKS','provider_execution_allowed: false','publication_allowed: false','fee_model_ready','payout_reconciliation_ready','channel_compliance_ready','seo_ready')
ids=re.findall(r"\['([a-z_]+)','",helper)
require(len(ids)==26,f'Release 451 must expose exactly 26 calibration checks; found {len(ids)}')
require(len(set(ids))==26,'Release 451 calibration check IDs must be unique')
for expected in ('provider_setup','publication_disabled','image_depth','taxonomy_ready','shipping_ready','personalization_ready','variations_ready','fee_model_ready','payout_reconciliation_ready','tax_handling_ready','currency_ready','channel_compliance_ready','seo_ready'):
    require(expected in ids,f'calibration check missing {expected}')
require('fetch(' not in helper,'calibration helper must not contact providers')
require('CREATE TABLE' not in helper.upper() and 'ALTER TABLE' not in helper.upper(),'calibration helper must not mutate schema')

api=has('functions/api/admin/marketplace-calibration.js',
    "mode:'read-only-marketplace-calibration'",'request_time_schema_mutation:false','provider_execution_allowed:false','publication_allowed:false',
    'commerce_transaction_costs','evaluateMarketplaceCalibration','pr.product_id=p.product_id','selected_image_urls_json',
    'provider_key,marketplace_key,provider_reference,transaction_date,currency','provider_fee_cents,marketplace_fee_cents,currency_conversion_fee_cents,shipping_cost_cents')
require('CREATE TABLE' not in api.upper() and 'ALTER TABLE' not in api.upper(),'calibration API must not perform request-time DDL')
require('fetch(' not in api,'calibration API must not contact marketplace providers')
for forbidden in ('SELECT provider,marketplace_channel','c.payout_reference','c.amount_cents','occurred_at','pr.id=p.product_id','SELECT channel_key,product_id,image_url'):
    require(forbidden not in api,f'calibration API contains stale/non-authoritative D1 read contract {forbidden!r}')

migration449=text('migrations/dev/20260829_release449_corporate_commerce.sql')
for marker in ('provider_key TEXT','marketplace_key TEXT','provider_reference TEXT','transaction_date TEXT NOT NULL','provider_fee_cents INTEGER','marketplace_fee_cents INTEGER','currency_conversion_fee_cents INTEGER','shipping_cost_cents INTEGER'):
    require(marker in migration449,f'Release 449 commerce authority missing expected column {marker!r}')
migration450=text('migrations/dev/20260829_release450_marketplace_seo_readiness.sql')
for marker in ('channel TEXT NOT NULL','product_id INTEGER NOT NULL','selected_image_urls_json TEXT','channel_key TEXT NOT NULL','marketplace_listing_profiles'):
    require(marker in migration450,f'Release 450 marketplace authority missing expected column {marker!r}')

page=has('admin/marketplace-calibration/index.html','noindex,nofollow','/css/admin-marketplace-calibration.css?v=450.451','/public/js/admin-marketplace-calibration.js?v=450.451','Provider execution remains locked.')
require(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'calibration admin page must have exactly one H1')
has('css/admin-marketplace-calibration.css','@media(max-width:950px)','@media(max-width:650px)','@media(max-width:420px)','grid-template-columns:1fr')
ui=has('public/js/admin-marketplace-calibration.js','Release 451 marketplace calibration','Checks needing work','Quarter costs','/api/admin/marketplace-calibration?quarter=')
require('method:' not in ui and 'method :' not in ui,'calibration UI must remain read-only')

has('functions/api/_lib/marketplaceReadiness.js','max_personalization_questions','Third Etsy variation','provider_execution_allowed','publication_allowed')
has('scripts/release450_marketplace_seo_gate.py','20 images / 13 tags / 3 variations / 5 personalization questions','Provider execution/publication: DISABLED')

for js in ('functions/api/_lib/marketplaceCalibration.js','functions/api/admin/marketplace-calibration.js','public/js/admin-marketplace-calibration.js'):
    r=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    require(r.returncode==0,f'JavaScript syntax failed for {js}: {(r.stderr or r.stdout).strip()}')
for gate in ('scripts/release450_marketplace_seo_gate.py','scripts/public_seo_gate.py','scripts/public_seo_depth_gate.py'):
    r=subprocess.run(['python',str(ROOT/gate)],capture_output=True,text=True)
    require(r.returncode==0,f'carried-forward gate failed: {gate}\n{r.stdout}\n{r.stderr}')

print('RELEASE 451 MARKETPLACE CALIBRATION GATE')
print('Calibration checks: 26')
print('Release 449/450 D1 read contracts: PINNED')
print('Etsy draft/personalization/variation authority: CARRIED FORWARD')
print('Commerce fee/payout completeness: READ ONLY')
print('Provider execution/publication: DISABLED')
print('Marketplace calibration admin: NOINDEX + RESPONSIVE')
print('Public structural + SEO depth gates: REQUIRED')
print('D1 schema mutation required by Release 451 calibration: NO')
if failures:
    for i,f in enumerate(failures,1): print(f'{i:03d}. FAIL — {f}')
    raise SystemExit(1)
print('RELEASE 451 MARKETPLACE CALIBRATION GATE: PASS')
