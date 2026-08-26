#!/usr/bin/env python3
"""Build 440 source-only regression for Ingredient + Product Media Integrity queues."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/product-integrity-review.js'
UI = ROOT / 'public/js/admin-product-integrity-review.js'
PAGE = ROOT / 'admin/inventory-operations/index.html'
CSS = ROOT / 'css/product-integrity-review.css'

checks = []
def check(condition, label):
    checks.append((bool(condition), label))

api = API.read_text(encoding='utf-8') if API.exists() else ''
ui = UI.read_text(encoding='utf-8') if UI.exists() else ''
page = PAGE.read_text(encoding='utf-8') if PAGE.exists() else ''
css = CSS.read_text(encoding='utf-8') if CSS.exists() else ''
joined = '\n'.join([api, ui, page, css]).lower()

check(API.exists(), 'review API exists')
check('getAdminUserFromRequest' in api, 'review API is Admin-authenticated')
check('product_resource_ingredient_profiles' in api and 'product_resource_links' in api, 'ingredient queue reuses existing Product Resources ingredient authority')
check("is_label_ingredient,0)=1" in api or "is_label_ingredient, 0)=1" in api, 'ingredient queue is limited to label ingredients')
check('inci_name' in api and 'translation_review_status' in api, 'ingredient queue identifies missing INCI and review status')
check('product_media_integrity_snapshots' in api and 'product_images' in api, 'media queue reuses Build 245 media integrity and canonical gallery authority')
check('recoverable_unique_image_count' in api and 'gallery_count' in api, 'media queue exposes recoverable-gap and gallery-count evidence')
check('unique_gallery_count' in api, 'media queue detects duplicate gallery URLs')
check('featured_image_url' in api, 'media queue detects gallery-without-featured condition')
check('LIMIT ? OFFSET ?' in api, 'review reads are bounded and paginated')
check('MAX_LIMIT = 80' in api, 'review request limit is explicitly capped')
check(not re.search(r'\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER)\b', api, re.I), 'review API contains no request-time schema DDL')
check('export async function onRequestGet' in api and 'onRequestPost' not in api and 'onRequestPatch' not in api and 'onRequestDelete' not in api, 'queue endpoint is read-only GET authority')
check("mutation_capability: 'none'" in api, 'API explicitly reports zero mutation capability')
check('productIntegrityReviewMount' in page and 'admin-product-integrity-review.js?v=440' in page, 'Inventory Operations mounts and loads the queue workspace')
check('product-integrity-review.css?v=440' in page, 'queue workspace has scoped responsive CSS')
check('/admin/catalog/?product_id=' in api and '/admin/catalog-media/?product_id=' in api, 'queue sends issues to their owning Product/Media workspaces')
check('Open Product Resources' in ui and 'Open Media workspace' in ui, 'UI exposes explicit owner navigation actions')
check('setInterval' not in ui and 'setTimeout' not in ui, 'queue UI contains no polling/timer loop')
check('provider' not in re.sub(r'//.*', '', ui, flags=re.M).lower() and 'fetch(' not in ui.replace('apiFetch(', ''), 'queue UI contains no provider/direct-fetch execution')
check('@media(max-width:900px)' in css and '@media(max-width:620px)' in css, 'queue workspace is responsive on tablet and phone')
check('r2' not in api.lower() and 'bucket.' not in api.lower(), 'review queue performs no R2 object operations')

print('BUILD 440 PRODUCT INTEGRITY REVIEW REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')
print()
failed = 0
for i, (ok, label) in enumerate(checks, 1):
    print(f'{i:02d}. {"PASS" if ok else "FAIL"} — {label}')
    failed += 0 if ok else 1
print()
if failed:
    print(f'BUILD 440 PRODUCT INTEGRITY REVIEW REGRESSION: FAIL ({failed}/{len(checks)} failed)')
    raise SystemExit(1)
print(f'BUILD 440 PRODUCT INTEGRITY REVIEW REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Ingredient review: LABEL INGREDIENTS / INCI + HUMAN REVIEW')
print('Product media integrity: BUILD 245 SNAPSHOT + CANONICAL GALLERY CHECKS')
print('Mutation authority: NONE / OPEN OWNER WORKSPACE ONLY')
print('Polling/provider/R2 execution: NONE')
print('PRODUCTION PROMOTION: CLOSED')
