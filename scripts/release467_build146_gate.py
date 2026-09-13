#!/usr/bin/env python3
"""Release 467 Build 146 — Resilient Cart, Guest Checkout & Payment Recovery gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
closure=load('docs/operations/release467-build145-external-closure.json')
overlay=read('public/js/checkout-resilience-build146.js')
page=read('checkout/index.html')
checkout=read('public/js/checkout.js')
handler=read('functions/api/checkout-create-order.js')
payment=read('functions/api/checkout-prepare-payment.js')
prov=read('scripts/current_system_gate_provenance_gate.py')
manifest=load('migrations/canonical/manifest.json')
req(closure.get('state')=='PRODUCTION_GREEN','Build 145 external closure must be Production GREEN')
req(closure.get('dev_sha')=='5186b6258103ea438a73f0dbe1d2f94b010e8142','Build 145 SHA drifted')
req(closure.get('tree_sha')=='b9e519f7ec9a10937261e0883360207554aebea7','Build 145 tree drifted')
for n in (34768792584,34768792638,34768792563,34768792590,34769058927,34769104453): req(str(n) in read('docs/operations/release467-build145-external-closure.json'),f'missing Build145 proof {n}')
for t in ('BUILD = 146',"ATTEMPT_KEY = 'dd_checkout_attempt_v78'",'navigator.onLine','Guest checkout','Payment is never queued offline','Connection restored','press Place Order manually','stopImmediatePropagation','aria-live','existing order'):
    req(t in overlay,f'Build146 resilience overlay missing {t}')
for forbidden in ('fetch(', '/api/', 'localStorage.setItem', 'sessionStorage.setItem', 'window.location.href ='):
    req(forbidden not in overlay,f'Build146 overlay gained forbidden execution authority: {forbidden}')
req('/public/js/checkout-resilience-build146.js?v=467b146' in page,'Checkout page does not load Build146 resilience overlay')
for t in ('ATTEMPT_KEY = "dd_checkout_attempt_v78"','checkout_request_key: attempt.request_key','Resuming order','idempotent_replay','clearAttempt()'):
    req(t in checkout,f'retained Build78 checkout authority missing {t}')
for t in ('normalizeCheckoutRequestKey','orderNumberForRequestKey','existingOrderPayload','idempotent_replay','checkout_request_key_conflict','WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number=?)','server_totals_authoritative: true','inventory_revalidated: true','pricing_revalidated: true'):
    req(t in handler,f'retained idempotent order authority missing {t}')
for t in ('existingPendingPayments',"LOWER(COALESCE(payment_status, '')) IN ('pending', 'authorized')"):
    req(t in payment,f'retained payment-recovery authority missing {t}')
files=[str(x.get('file')or'') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical D1 migrations must remain 0001-0004')
req("run_current_contract('scripts/release467_build146_gate.py','Release 467 Build 146')" in prov,'active provenance must call Build146')
node=subprocess.run(['node','--check',str(ROOT/'public/js/checkout-resilience-build146.js')],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
req(node.returncode==0,f'Build146 JavaScript syntax failed: {(node.stderr or node.stdout).strip()[-1200:]}')
if FAIL:
    print('RELEASE 467 BUILD 146 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 146 GATE: PASS')
print('Build 145 six-proof closure: INGESTED EXTERNALLY')
print('Checkout: GUEST-FIRST / OFFLINE LOCK / MANUAL RECONNECT RESUME')
print('Build 78 transaction authority: RETAINED / IDEMPOTENT')
print('Payment while offline: NEVER QUEUED')
print('Canonical D1: 0001-0004 / UNCHANGED')
