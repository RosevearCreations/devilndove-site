#!/usr/bin/env python3
"""Release 461 source-only product image quality acceptance gate."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'migrations/dev/20260830_release461_product_image_quality_authority.sql'
API=ROOT/'functions/api/admin/product-media-score.js'
UI=ROOT/'public/js/admin-product-media-score.js'
PAGE=ROOT/'admin/catalog-media/index.html'
for path in (MIG,API,UI,PAGE):
    if not path.is_file(): raise SystemExit(f'Missing product image quality authority: {path.relative_to(ROOT)}')

migration=MIG.read_text(encoding='utf-8')
api=API.read_text(encoding='utf-8')
ui=UI.read_text(encoding='utf-8')
page=PAGE.read_text(encoding='utf-8')
checks={
 'migration owns role table':'CREATE TABLE IF NOT EXISTS product_media_role_assignments' in migration,
 'migration owns quality review table':'CREATE TABLE IF NOT EXISTS product_image_quality_reviews' in migration,
 'migration forward only':not re.search(r'\b(?:ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b',migration,re.I),
 'api has no runtime ddl':not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b',api,re.I),
 'api fails closed on missing migration':'product_media_quality_migration_required' in api,
 'primary width threshold':'PRIMARY_MIN_WIDTH = 1200' in api,
 'primary height threshold':'PRIMARY_MIN_HEIGHT = 1200' in api,
 'primary alt threshold':'PRIMARY_MIN_ALT = 12' in api,
 'primary score threshold':'PRIMARY_MIN_SCORE = 70' in api,
 'server recomputes score':'qualityScore({' in api and 'altLength = clean(image.alt_text).length' in api,
 'browser measures natural dimensions':'naturalWidth' in ui and 'naturalHeight' in ui,
 'ui states acceptance requirements':'at least ${esc(t.min_width_px||1200)}×${esc(t.min_height_px||1200)}' in ui,
 'catalog media loads quality ui':'/public/js/admin-product-media-score.js' in page,
}
failed=[name for name,ok in checks.items() if not ok]
if failed: raise SystemExit('Release 461 product image quality gate failed: '+'; '.join(failed))
print('RELEASE 461 PRODUCT IMAGE QUALITY ACCEPTANCE: PASS')
print('Primary dimensions: >=1200x1200')
print('Primary alt text: >=12 characters')
print('Primary quality score: >=70')
print('Runtime DDL: NONE')
print('D1 / R2 / provider / Production mutation: NONE')
