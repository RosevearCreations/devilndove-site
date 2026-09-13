#!/usr/bin/env python3
"""Release 467 Build 147 — Buyer Account, Saved Items & Order Hub gate."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
closure=load('docs/operations/release467-build146-external-closure.json')
hub=read('public/js/buyer-account-hub-build147.js')
page=read('members/index.html')
wishlist=read('public/js/member-wishlist.js')
wishlist_api=read('functions/api/member/wishlist.js')
orders=read('public/js/member-orders.js')
adaptive=read('public/js/adaptive-shell.js')
prov=read('scripts/current_system_gate_provenance_gate.py')
manifest=load('migrations/canonical/manifest.json')
req(closure.get('state')=='PRODUCTION_GREEN','Build 146 external closure must be Production GREEN')
req(closure.get('dev_sha')=='d0ae95999e920125e5e7cdf0b0764a07e303b082','Build 146 SHA drifted')
req(closure.get('tree_sha')=='6f682c80af77d18a46f31cfdc162846c002ee6c1','Build 146 tree drifted')
for n in (34769450462,34769450571,34769450487,34769450546,34769541728,34769586008): req(str(n) in read('docs/operations/release467-build146-external-closure.json'),f'missing Build146 proof {n}')
for t in ('BUILD = 147',"SAVED_KEY = 'dd:saved-products:v1'","RECENT_KEY = 'dd_recently_viewed_products_v1'",'Your buyer account hub','Orders last live refresh','cached status is never presented as live','Nothing syncs automatically','Sync device Saved to account Wishlist','navigator.onLine','syncSaved','dd:build147:saved-synced',"window.DDAuth.apiFetch('/api/member/wishlist'", "method: 'POST'",'The device copy was preserved','MutationObserver'):
    req(t in hub,f'Build147 buyer hub missing {t}')
req("localStorage.setItem(ORDER_REFRESH_KEY" in hub,'Build147 must persist only the successful live-order refresh marker')
req("localStorage.setItem(SAVED_KEY" not in hub,'Build147 reconciliation must not mutate/delete device Saved storage')
req('/public/js/buyer-account-hub-build147.js?v=467b147' in page,'Members page does not load Build147 buyer hub')
req('/public/js/member-wishlist.js?v=467b147' in page,'Members page does not load Build147 Wishlist refresh')
req("document.addEventListener('dd:build147:saved-synced'" in wishlist,'Member Wishlist must refresh after explicit Build147 reconciliation')
for t in ('export async function onRequestPost','ON CONFLICT(user_id, product_id) DO NOTHING','product_id is required'):
    req(t in wishlist_api,f'idempotent account Wishlist authority missing {t}')
for t in ('/api/member/orders','Loaded ${allOrders.length} order','Refresh Orders'):
    req(t in orders,f'live member order authority missing {t}')
req("SAVED_KEY='dd:saved-products:v1'" in adaptive,'device Saved authority key drifted')
req('do not reserve inventory' in adaptive,'device Saved non-authoritative inventory boundary drifted')
files=[str(x.get('file')or'') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical D1 migrations must remain 0001-0004')
req("run_current_contract('scripts/release467_build147_gate.py','Release 467 Build 147')" in prov,'active provenance must call Build147')
node=subprocess.run(['node','--check',str(ROOT/'public/js/buyer-account-hub-build147.js')],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
req(node.returncode==0,f'Build147 JavaScript syntax failed: {(node.stderr or node.stdout).strip()[-1200:]}')
if FAIL:
    print('RELEASE 467 BUILD 147 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 147 GATE: PASS')
print('Build 146 six-proof closure: INGESTED EXTERNALLY')
print('Buyer account hub: ORDERS / WISHLIST / PROFILE / DEVICE SAVED')
print('Saved reconciliation: USER-TRIGGERED / ADDITIVE / IDEMPOTENT / DEVICE COPY PRESERVED')
print('Order freshness: LAST SUCCESSFUL LIVE REFRESH MARKER / NEVER CACHED-AS-LIVE')
print('Canonical D1: 0001-0004 / UNCHANGED')
