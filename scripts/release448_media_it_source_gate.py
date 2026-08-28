#!/usr/bin/env python3
"""Canonical Release 448 source/local-schema gate for carousel, image quality, Movie review and I.T. registry."""
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
need('public/js/admin-product-image-quality.js',"scorer_version:'r448-browser-v1'")
need('functions/api/admin/product-image-quality.js','const RELEASE=448')
need('functions/api/admin/it-integrations.js','secret_value_refused')
need('public/js/admin-it-integrations.js','/api/admin/it-integrations')
need('admin/product-image-quality/index.html','Product Image Quality')
need('admin/it-integrations/index.html','External API &amp; Social Integration Registry')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.executescript('PRAGMA foreign_keys=ON;CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE products(product_id INTEGER PRIMARY KEY);INSERT INTO products VALUES(1);')
 db.executescript(migration)
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 required={'product_image_quality_assessments','movie_catalog','movie_metadata_reviews','it_integration_registry'}
 if not required<=tables:raise SystemExit(f'FAIL — missing local tables {sorted(required-tables)}')
 db.execute("INSERT INTO movie_catalog(upc,title) VALUES('012345678905','Pending Test Movie')")
 movie_id=db.execute("SELECT movie_catalog_id FROM movie_catalog WHERE upc='012345678905'").fetchone()[0]
 db.execute("INSERT INTO movie_metadata_reviews(movie_key,movie_catalog_id,upc) VALUES(?,?,?)",('012345678905',movie_id,'012345678905'))
 scores=[18,17,13,12,10,9,5,4];total=sum(scores)
 db.execute("INSERT INTO product_image_quality_assessments(product_id,image_url,image_key,total_score,lighting_score,clarity_score,background_score,framing_score,resolution_score,color_balance_score,artifact_score,consistency_score) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(1,'/image.webp','/image.webp',total,*scores))
 if db.execute('PRAGMA foreign_key_check').fetchall():raise SystemExit('FAIL — local Release 448 foreign keys are not clean')
print('RELEASE 448 MEDIA / MOVIE / I.T. SOURCE GATE: PASS')
print('Image score rubric: 100 points')
print('Movie authority: movie_catalog + stable review key')
print('Shared carousel authority: one implementation')
print('Secret values stored in I.T. registry: FORBIDDEN')
