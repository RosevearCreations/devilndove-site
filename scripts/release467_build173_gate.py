#!/usr/bin/env python3
"""Release 467 Build 173 — Product media publication/save/rendering repair proof, successor-aware through Build 178."""
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'migrations/canonical/0006_release467_product_media_publication_guard.sql'
MANIFEST=ROOT/'migrations/canonical/manifest.json'
API=ROOT/'functions/api/admin/product-image-editor.js'
EDITOR_UI=ROOT/'public/js/admin-product-editor-v163.js'
MEDIA_PAGE=ROOT/'admin/catalog-media/index.html'
EDITOR_PAGE=ROOT/'admin/product-editor/index.html'

files=[MIG,MANIFEST,API,EDITOR_UI,MEDIA_PAGE,EDITOR_PAGE]
for path in files:
    if not path.is_file():
        raise SystemExit(f'Missing Build 173 authority: {path.relative_to(ROOT)}')

mig=MIG.read_text(encoding='utf-8')
manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
api=API.read_text(encoding='utf-8')
ui=EDITOR_UI.read_text(encoding='utf-8')
media_page=MEDIA_PAGE.read_text(encoding='utf-8')
editor_page=EDITOR_PAGE.read_text(encoding='utf-8')

remove=api[api.index("if(action==='remove')"):api.index("if(action==='score')")]
save=api[api.index("if(action!=='save_metadata')"):]

checks={
  'canonical migration registered': any(x.get('version')==6 and x.get('file')==MIG.name for x in manifest.get('migrations',[])),
  'legacy activation trigger replaced forward-only': 'DROP TRIGGER IF EXISTS release465_products_block_unready_activation' in mig,
  'activation guard only evaluates activation transition': 'BEFORE UPDATE OF status ON products' in mig and "OLD.status" in mig and "<> 'active'" in mig,
  'active required-field no-degrade guard exists': 'release467_products_block_active_required_field_degrade' in mig,
  'active readiness no-degrade guard exists': 'release467_products_block_active_readiness_degrade' in mig,
  'selected image authority includes Product status': 'p.status AS product_status' in api,
  'featured pointer moves before canonical row delete': remove.find('UPDATE products SET featured_image_url=') >= 0 and remove.find('UPDATE products SET featured_image_url=') < remove.find('DELETE FROM product_images'),
  'active last-featured removal fails closed': 'featured_image_requires_replacement' in remove,
  'set featured is proven before metadata writes': save.find("if(body.set_featured===true)") >= 0 and save.find("if(body.set_featured===true)") < save.find('UPDATE product_images SET alt_text='),
  'Product Editor uses candidate fallback': 'function mediaCandidates(raw)' in ui and 'function armMediaImage(img,raw)' in ui,
  'public asset URL precedes same-origin fallback': "list.push(value);if(key)list.push(" in ui,
  'Product Editor arms loaded media images': "img[data-media-raw]" in ui and "armMediaImage(img,img.dataset.mediaRaw" in ui,
  'Media page cache bumped': any(token in media_page for token in ('Release 467 • Build 173','Release 467 • Build 178')) and any(token in media_page for token in ('admin-product-media-editor-v172.js?v=173','admin-product-media-editor-v172.js?v=178')),
  'Product Editor cache bumped': any(token in editor_page for token in ('Release 467 • Build 173','Release 467 • Build 174','Release 467 • Build 175','Release 467 • Build 178')) and any(token in editor_page for token in ('admin-product-editor-v163.js?v=173','admin-product-editor-v163.js?v=174','admin-product-editor-v163.js?v=175','admin-product-editor-v163.js?v=178')),
  'no automatic background media polling': all(token not in ui for token in ('setInterval(','MutationObserver(')),
}

failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit('Release 467 Build 173 gate failed: '+'; '.join(failed))

print('RELEASE 467 BUILD 173 PRODUCT MEDIA REPAIR: PASS')
print('Canonical migration: 0006')
print('Featured deletion ordering: FAIL-CLOSED')
print('Product Editor media delivery: PUBLIC URL -> SAME-ORIGIN RECOVERY -> PLACEHOLDER')
print('Background polling: NONE')
