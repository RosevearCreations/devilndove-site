#!/usr/bin/env python3
"""Release 461 product-image quality contract, with Build 163 current-runtime convergence."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'migrations/dev/20260830_release461_product_image_quality_authority.sql'
LEGACY_API=ROOT/'functions/api/admin/product-media-score.js'
LEGACY_UI=ROOT/'public/js/admin-product-media-score.js'
PAGE=ROOT/'admin/catalog-media/index.html'
NEW_API=ROOT/'functions/api/admin/product-image-editor.js'
NEW_UI=ROOT/'public/js/admin-product-media-editor-v163.js'
for path in (MIG,LEGACY_API,LEGACY_UI,PAGE):
    if not path.is_file(): raise SystemExit(f'Missing product image quality authority: {path.relative_to(ROOT)}')
migration=MIG.read_text(encoding='utf-8');legacy_api=LEGACY_API.read_text(encoding='utf-8');legacy_ui=LEGACY_UI.read_text(encoding='utf-8');page=PAGE.read_text(encoding='utf-8')
build163='product-media-v163' in page and NEW_API.is_file() and NEW_UI.is_file()
api=NEW_API.read_text(encoding='utf-8') if build163 else legacy_api
ui=NEW_UI.read_text(encoding='utf-8') if build163 else legacy_ui
checks={
 'migration owns role table':'CREATE TABLE IF NOT EXISTS product_media_role_assignments' in migration,
 'migration owns quality review table':'CREATE TABLE IF NOT EXISTS product_image_quality_reviews' in migration,
 'migration forward only':not re.search(r'\b(?:ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b',migration,re.I),
 'current scoring api has no runtime ddl':not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b',api,re.I),
}
if build163:
    checks.update({
      'primary width threshold':'PRIMARY_MIN_WIDTH=1200' in api,
      'primary height threshold':'PRIMARY_MIN_HEIGHT=1200' in api,
      'primary alt threshold':'PRIMARY_MIN_ALT=12' in api,
      'primary score threshold':'PRIMARY_MIN_SCORE=70' in api,
      'server recomputes selected-image score':'function score({' in api and "action==='score'" in api,
      'browser measures natural dimensions':'naturalWidth' in ui and 'naturalHeight' in ui,
      'catalog media loads Build 163 editor':'/public/js/admin-product-media-editor-v163.js' in page,
      'scoring is explicit':'Measure &amp; Score Selected Image' in page and 'scoring was not run automatically' in api.lower(),
      'scoring stays selected-image':'WHERE pi.product_image_id=? LIMIT 1' in api,
    })
else:
    checks.update({
      'api fails closed on missing migration':'product_media_quality_migration_required' in legacy_api,
      'primary width threshold':'PRIMARY_MIN_WIDTH = 1200' in legacy_api,
      'primary height threshold':'PRIMARY_MIN_HEIGHT = 1200' in legacy_api,
      'primary alt threshold':'PRIMARY_MIN_ALT = 12' in legacy_api,
      'primary score threshold':'PRIMARY_MIN_SCORE = 70' in legacy_api,
      'server recomputes score':'qualityScore({' in legacy_api and 'altLength = clean(image.alt_text).length' in legacy_api,
      'browser measures natural dimensions':'naturalWidth' in legacy_ui and 'naturalHeight' in legacy_ui,
      'catalog media loads quality ui':'/public/js/admin-product-media-score.js' in page,
    })
failed=[name for name,ok in checks.items() if not ok]
if failed: raise SystemExit('Release 461 product image quality gate failed: '+'; '.join(failed))
print('RELEASE 461 PRODUCT IMAGE QUALITY ACCEPTANCE: PASS')
print('Current runtime:', 'Build 163 selected-image scorer' if build163 else 'legacy Product media scorer')
print('Primary dimensions: >=1200x1200')
print('Primary alt text: >=12 characters')
print('Primary quality score: >=70')
print('Runtime DDL: NONE')
print('Build 163 automatic gallery scoring: NONE' if build163 else 'Legacy behavior retained')
