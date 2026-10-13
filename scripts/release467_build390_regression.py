#!/usr/bin/env python3
"""Release467 Build390 product price corruption regression and operational evidence decision source gate."""
from pathlib import Path
import subprocess,json,sys
R=Path(__file__).resolve().parents[1];bad=[]
def file(p):return (R/p).read_text(encoding='utf8')
def check(x,msg):
 if not x:bad.append(msg)
tests=subprocess.run(['node','--test','scripts/release467_build390_money.test.mjs'],cwd=R,capture_output=True,text=True)
check(tests.returncode==0,'money tests: '+tests.stdout[-900:]+tests.stderr[-900:])
files=['public/js/admin-product-editor-v163.js','functions/api/admin/product-editor-save.js','functions/api/admin/create-product.js','public/js/admin-product-zero-price-review-v390.js','functions/api/admin/product-zero-price-review.js','public/js/admin-product-videos-v389.js']
for path in files:
 r=subprocess.run(['node','--check',str(R/path)],capture_output=True,text=True)
 check(r.returncode==0,'syntax '+path+': '+r.stderr[-250:])
server=file('functions/api/admin/product-editor-save.js')
for token in ['price_cents_confirmed:true','product_price_readback_unconfirmed','invalid_price_cents','zero_price_not_confirmed',
 'SELECT price_cents,compare_at_price_cents,currency FROM products WHERE product_id=? LIMIT 1','confirm_zero_price']:
 check(token in server,'server price safety '+token)
check('body.source_editor_build390' in file('functions/api/admin/create-product.js'),'intentional zero on new Product create')
page=file('admin/products/index.html')
check('productBrowser390PriceAudit' in page and 'admin-product-zero-price-review-v390.js' in page,'manual zero-price review page')
audit=file('functions/api/admin/product-zero-price-review.js')
check("WHERE COALESCE(price_cents,0)=0" in audit and 'ORDER BY product_id DESC LIMIT 26' in audit,'bounded zero-price review')
check('no_automatic_price_repair:true' in audit and 'onRequestGet' in audit and 'onRequestPost' not in audit,'no unsolicited source repair')
video=file('public/js/admin-product-videos-v389.js')
check("reviewCount" in video and "approvedCount" in video and "blockedCount" in video,'video approval counts')
invoice=file('public/js/admin-inventory-tax-review-v388.js')
check('eligibility remain UNVERIFIED' in invoice,'supplier invoice eligibility decision never assumed')
a=json.loads(file('current-development-authority.json'))
check(a.get('build')==390 and a.get('next_build')==391,'authority 390 queued 391')
check('release467-build390-price-video-invoice.json' in file('current-development-authority.json'),'Build390 authority pointer')
print('RELEASE467_BUILD390_GATE='+('FAIL' if bad else 'GREEN'))
for f in bad:print('FAIL:',f)
sys.exit(bool(bad))
