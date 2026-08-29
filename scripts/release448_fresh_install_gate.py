#!/usr/bin/env python3
"""Prove a fresh Devil n Dove database converges through Release 447 and all Release 448 migrations."""
from pathlib import Path
import sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
FILES=[
 'database_full_schema.sql',
 'database_platform_convergence.sql',
 'database_release448_product_lineage.sql',
 'database_release448_media_it.sql',
 'database_release448_storefront_merchandising.sql',
 'database_release448_caip_content_handoff.sql',
 'database_release448_tool_lifecycle.sql',
]
REQUIRED={
 'app_modules','app_module_role_access','app_module_user_access','home_carousel_slides','home_carousel_events',
 'product_lineage_profiles','product_resource_lineage_reviews','inventory_manufacturers','inventory_manufacturer_links','inventory_vendor_reviews',
 'product_image_quality_assessments','movie_catalog','movie_metadata_reviews','it_integration_registry',
 'storefront_collections','storefront_collection_products','storefront_collage_presets',
 'creative_media_evidence_ranges','creative_story_evidence','creative_story_segments','creative_story_segment_evidence_links',
 'caip_content_handoffs','caip_content_handoff_evidence','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events',
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
 if db.execute("SELECT COUNT(*) FROM app_module_role_access WHERE module_key IN ('storefront','creators','socials','financials','it-platform')").fetchone()[0]!=10:raise SystemExit('FAIL — verified Release 447 canonical role-module baseline did not survive fresh-install composition')
 if db.execute("SELECT COUNT(*) FROM app_module_role_access WHERE module_key='it-platform' AND is_allowed<>0").fetchone()[0]!=0:raise SystemExit('FAIL — I.T. role authority must remain explicit-user only')
 active_admins=db.execute("SELECT COUNT(*) FROM users WHERE is_active=1 AND lower(trim(role))='admin'").fetchone()[0]
 it_managers=db.execute("SELECT COUNT(*) FROM app_module_user_access WHERE module_key='it-platform' AND is_allowed=1 AND access_level='manage'").fetchone()[0]
 if active_admins==0 and it_managers!=0:raise SystemExit('FAIL — fresh database created an I.T. manager without an active admin user')
 if active_admins>0 and it_managers<1:raise SystemExit('FAIL — active admin exists but explicit I.T. manager bootstrap is missing')
 if db.execute("SELECT COUNT(*) FROM app_module_user_access a LEFT JOIN users u ON u.user_id=a.user_id WHERE a.module_key='it-platform' AND a.is_allowed=1 AND a.access_level='manage' AND u.user_id IS NULL").fetchone()[0]!=0:raise SystemExit('FAIL — orphan I.T. manager grant found')
print('RELEASE 448 COMPOSED FRESH INSTALL: PASS')
print('Base aggregate + Release 447 platform convergence + all Release 448 migrations: COMPATIBLE')
print('Canonical modules / role rows / explicit-user-only I.T. authority: VERIFIED')
print(f'Fresh-install active admins: {active_admins}; explicit I.T. managers: {it_managers}')
print('Product lineage / media-I.T. / Storefront / CAIP handoff / Tool lifecycle tables: PRESENT')
print('Foreign keys: CLEAN')
