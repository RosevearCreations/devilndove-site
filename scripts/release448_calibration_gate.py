#!/usr/bin/env python3
"""Release 448 real-data calibration cockpit source gate."""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
API=ROOT/'functions/api/admin/release448-calibration.js';HTML=ROOT/'admin/release448-calibration/index.html';JS=ROOT/'public/js/admin-release448-calibration.js';DASH=ROOT/'public/js/admin-route-usage.js'
for path in (API,HTML,JS,DASH):
 if not path.exists():raise SystemExit(f'FAIL — calibration/discovery file missing: {path.relative_to(ROOT)}')
api=API.read_text(encoding='utf-8');html=HTML.read_text(encoding='utf-8');js=JS.read_text(encoding='utf-8');dash=DASH.read_text(encoding='utf-8')
if 'onRequestPost' in api:raise SystemExit('FAIL — calibration cockpit must remain read-only')
for forbidden in ('INSERT INTO ','UPDATE site_','DELETE FROM ','automatic_ordering:true','mutation_capability:\'write\''):
 if forbidden.lower() in api.lower():raise SystemExit(f'FAIL — calibration cockpit gained mutation authority: {forbidden}')
for marker in ('photography','lineage','storefront','caip','inventory','tools','supplies','it'):
 if f"area('{marker}'" not in api:raise SystemExit(f'FAIL — calibration area missing: {marker}')
if "calibration_ledger_duplicated:false" not in api or "mutation_capability:'none'" not in api:raise SystemExit('FAIL — calibration authority declarations missing')
if html.lower().count('<h1')!=1:raise SystemExit('FAIL — calibration admin page must contain exactly one H1')
for workspace in ('/admin/product-image-quality/','/admin/product-lineage/','/admin/storefront-merchandising/','/admin/caip-content-handoff/','/admin/inventory-intelligence/','/admin/tool-lifecycle/','/admin/supply-sourcing/','/admin/it-integrations/'):
 if workspace not in api:raise SystemExit(f'FAIL — calibration workspace link missing: {workspace}')
for workspace in ('/admin/release448-calibration/','/admin/inventory-intelligence/','/admin/supply-sourcing/','/admin/tool-lifecycle/','/admin/storefront-merchandising/','/admin/caip-content-handoff/'):
 if workspace not in dash:raise SystemExit(f'FAIL — Admin Dashboard discovery link missing: {workspace}')
if '/api/admin/release448-calibration' not in js:raise SystemExit('FAIL — calibration UI is not wired to its API')
for path in (API,JS,DASH):
 result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
 if result.returncode:raise SystemExit(f'FAIL — JavaScript syntax failed for {path.relative_to(ROOT)}: {result.stderr.strip()}')
print('RELEASE 448 REAL-DATA CALIBRATION COCKPIT: PASS')
print('Areas: Photography / Lineage / Storefront / CAIP / Inventory / Tools / Supplies / I.T.')
print('Admin Dashboard operational workspace discovery: PRESENT')
print('Derived status ledger duplicated: NO')
print('Mutation capability: NONE')
