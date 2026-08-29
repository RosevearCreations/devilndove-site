#!/usr/bin/env python3
"""Prove a fresh Devil n Dove database can converge through the verified 447 baseline and complete Release 448 migration set."""
from pathlib import Path
import sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
FILES=[
 'database_full_schema.sql',
 'database_platform_convergence.sql',
 'database_release448_product_lineage.sql',
 'database_release448_media_it.sql',
 'database_release448_storefront_merchandising.sql',
]
REQUIRED={
 'app_modules','app_role_module_access','app_user_module_managers',
 'product_lineage_profiles','product_resource_lineage_reviews','inventory_manufacturers','inventory_manufacturer_links','inventory_vendor_reviews',
 'product_image_quality_assessments','movie_catalog','movie_metadata_reviews','it_integration_registry',
 'storefront_collections','storefront_collection_products','storefront_collage_presets',
}
for name in FILES:
 if not (ROOT/name).exists():raise SystemExit(f'FAIL — fresh-install input missing: {name}')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON')
 for name in FILES:
  try:db.executescript((ROOT/name).read_text(encoding='utf-8'))
  except Exception as error:raise SystemExit(f'FAIL — {name} did not compose into a fresh Release 448 database: {error}')
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 missing=sorted(REQUIRED-tables)
 if missing:raise SystemExit(f'FAIL — Release 448 fresh install missing tables: {missing}')
 violations=db.execute('PRAGMA foreign_key_check').fetchall()
 if violations:raise SystemExit(f'FAIL — Release 448 fresh-install foreign-key violations: {violations[:10]}')
 if db.execute("SELECT COUNT(*) FROM storefront_collections WHERE status='published'").fetchone()[0]<4:raise SystemExit('FAIL — seeded Storefront Collections missing')
 if db.execute("SELECT COUNT(*) FROM app_modules WHERE module_key IN ('storefront','creators','socials','financials','it-platform')").fetchone()[0]!=5:raise SystemExit('FAIL — canonical module baseline did not survive fresh-install composition')
 if db.execute("SELECT COUNT(*) FROM app_role_module_access").fetchone()[0]!=10:raise SystemExit('FAIL — verified Release 447 canonical role-module baseline did not survive fresh-install composition')
 if db.execute("SELECT COUNT(*) FROM app_user_module_managers WHERE module_key='it-platform' AND is_active=1").fetchone()[0]!=1:raise SystemExit('FAIL — verified Release 447 explicit I.T. manager baseline did not survive fresh-install composition')
print('RELEASE 448 COMPOSED FRESH INSTALL: PASS')
print('Base aggregate + Release 447 platform convergence + all Release 448 migrations: COMPATIBLE')
print('Canonical modules / role rows / I.T. manager: VERIFIED')
print('Required Release 448 tables: PRESENT')
print('Foreign keys: CLEAN')
