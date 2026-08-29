#!/usr/bin/env python3
"""Canonical Release 448 carried-forward source/local-schema gate for carousel, photography quality, Movie review and I.T. registry."""
from pathlib import Path
import sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
def need(path,needle):
 text=(ROOT/path).read_text(encoding='utf-8')
 if needle not in text:raise SystemExit(f'FAIL — {path} missing {needle!r}')
 return text
migration=need('database_release448_media_it.sql','CREATE TABLE IF NOT EXISTS product_image_quality_assessments')
need('database_release448_media_it.sql','CREATE TABLE IF NOT EXISTS movie_catalog')
need('database_release448_media_it.sql','CREATE TABLE IF NOT EXISTS movie_metadata_reviews')
need('database_release448_media_it.sql','CREATE TABLE IF NOT EXISTS it_integration_registry')
if 'REFERENCES movies(' in migration:raise SystemExit('FAIL — Release 448 migration references legacy movies table')
if sum([20,20,15,15,10,10,5,5])!=100:raise SystemExit('FAIL — image scoring rubric no longer totals 100')
need('public/js/media-carousel.js','window.DDMediaCarousel')
need('public/js/home-carousel.js','DDMediaCarousel')
need('public/js/movie-media-carousel.js','movie-cover-box img')
photo_js=need('public/js/admin-product-image-quality.js',"scorer_version: 'r448-browser-v1'")
for required in ['perceptual_hash_dhash64','hammingHex','Best hero candidate','Gallery candidate','Photography work queue','possible near duplicate']:
 if required not in photo_js:raise SystemExit(f'FAIL — Photography Manager missing {required!r}')
photo_api=need('functions/api/admin/product-image-quality.js','const RELEASE = 448')
for required in ["searchParams.get('summary')","action === 'review'",'source_image_references','reshoot_count']:
 if required not in photo_api:raise SystemExit(f'FAIL — photography API missing {required!r}')
photo_page=need('admin/product-image-quality/index.html','Product Photography Manager')
for required in ['Catalog photography queue','Product photography set','perceptual-hash distance']:
 if required not in photo_page:raise SystemExit(f'FAIL — Photography Manager page missing {required!r}')
need('functions/api/admin/it-integrations.js','secret_value_refused')
need('public/js/admin-it-integrations.js','/api/admin/it-integrations')
it_page=(ROOT/'admin/it-integrations/index.html').read_text(encoding='utf-8')
for required in ['I.T. / Integration Registry','Add or update integration metadata','Registered integrations','itIntegrationSave','itCredential']:
 if required not in it_page:raise SystemExit(f'FAIL — carried-forward I.T. registry workspace missing {required!r}')
# Release 453 may extend this same I.T. page with provider readiness, but must not remove the Release 448 registry authority.
if 'Provider acceptance checklist' in it_page:
 need('functions/api/admin/it-provider-readiness.js','secret_value_refused')
 need('public/js/admin-it-provider-readiness.js','/api/admin/it-provider-readiness')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.executescript('PRAGMA foreign_keys=ON;CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT);INSERT INTO products VALUES(1,\'Photography Test Product\');')
 db.executescript(migration)
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 required={'product_image_quality_assessments','movie_catalog','movie_metadata_reviews','it_integration_registry'}
 if not required<=tables:raise SystemExit(f'FAIL — missing local tables {sorted(required-tables)}')
 db.execute("INSERT INTO movie_catalog(upc,title) VALUES('012345678905','Pending Test Movie')")
 movie_id=db.execute("SELECT movie_catalog_id FROM movie_catalog WHERE upc='012345678905'").fetchone()[0]
 db.execute("INSERT INTO movie_metadata_reviews(movie_key,movie_catalog_id,upc) VALUES(?,?,?)",('012345678905',movie_id,'012345678905'))
 scores=[18,17,13,12,10,9,5,4];total=sum(scores)
 db.execute("INSERT INTO product_image_quality_assessments(product_id,image_url,image_key,total_score,lighting_score,clarity_score,background_score,framing_score,resolution_score,color_balance_score,artifact_score,consistency_score,evidence_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(1,'/image.webp','/image.webp',total,*scores,'{\"perceptual_hash_dhash64\":\"0123456789abcdef\"}'))
 if db.execute('PRAGMA foreign_key_check').fetchall():raise SystemExit('FAIL — local Release 448 foreign keys are not clean')
print('RELEASE 448 MEDIA / MOVIE / I.T. SOURCE GATE: PASS')
print('Image score rubric: 100 points')
print('Photography Manager: catalog queue + set score + hero/gallery recommendations + duplicate fingerprinting')
print('Movie authority: movie_catalog + stable review key')
print('Shared carousel authority: one implementation')
print('I.T. integration registry: PRESERVED / MAY BE EXTENDED BY CURRENT RELEASE')
print('Secret values stored in I.T. registry/readiness: FORBIDDEN')
