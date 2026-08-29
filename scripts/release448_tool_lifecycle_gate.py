#!/usr/bin/env python3
"""Carried-forward Release 448 source/fresh-schema gate for durable Tool lifecycle."""
from pathlib import Path
import json,re,sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
FILES=['database_full_schema.sql','database_platform_convergence.sql','database_release448_product_lineage.sql','database_release448_media_it.sql','database_release448_storefront_merchandising.sql','database_release448_caip_content_handoff.sql','database_release448_tool_lifecycle.sql']
REQUIRED={'site_item_inventory','product_resource_links','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events'}
for f in FILES:
 if not (ROOT/f).exists():raise SystemExit(f'FAIL — missing Tool lifecycle composition input: {f}')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON')
 for f in FILES:
  try:db.executescript((ROOT/f).read_text(encoding='utf-8'))
  except Exception as e:raise SystemExit(f'FAIL — {f} did not compose for Tool lifecycle: {e}')
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 missing=sorted(REQUIRED-tables)
 if missing:raise SystemExit(f'FAIL — Tool lifecycle parent/current tables missing: {missing}')
 if db.execute('PRAGMA foreign_key_check').fetchall():raise SystemExit('FAIL — Tool lifecycle introduced foreign-key violations')
api=(ROOT/'functions/api/admin/tool-lifecycle.js').read_text(encoding='utf-8')
page=(ROOT/'admin/tool-lifecycle/index.html').read_text(encoding='utf-8')
ui=(ROOT/'public/js/admin-tool-lifecycle.js').read_text(encoding='utf-8')
release=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
current=int(release.get('release') or 0)
if current<448:raise SystemExit('FAIL — current release predates Release 448 Tool lifecycle authority')
history={x.get('release'):x for x in release.get('release_history',[])}
if 448 not in history:raise SystemExit('FAIL — Release 448 history authority missing')
match=re.search(r'const\s+RELEASE\s*=\s*(\d+)',api)
if not match or int(match.group(1))<448:raise SystemExit('FAIL — Tool lifecycle API release authority regressed below Release 448')
if page.lower().count('<h1')!=1:raise SystemExit('FAIL — Tool lifecycle page must expose exactly one H1')
if 'noindex,nofollow' not in page:raise SystemExit('FAIL — Tool lifecycle page must remain private/noindex')
for invariant in ["lower(trim(COALESCE(source_type,'')))='tool'",'tool_quantity_mutated:false','Inventory quantity was not changed','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events']:
 if invariant not in api:raise SystemExit(f'FAIL — durable Tool invariant missing: {invariant}')
for forbidden in ['site_inventory_movements','on_hand_quantity=','UPDATE site_item_inventory SET on_hand_quantity']:
 if forbidden in api:raise SystemExit(f'FAIL — Tool lifecycle must not mutate quantity/movement authority: {forbidden}')
print('RELEASE 448 TOOL LIFECYCLE: CARRIED FORWARD PASS')
print(f'Current release: {current}')
print('Lifecycle/condition/service/retirement authority: PRESENT')
print('Tool Inventory quantity mutation: NONE')
print('Product contribution links: EXISTING product_resource_links')
