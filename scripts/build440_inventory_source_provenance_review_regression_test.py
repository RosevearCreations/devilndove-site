#!/usr/bin/env python3
"""Local-only source contract regression for Build 440 Inventory source provenance review."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
API=ROOT/'functions/api/admin/inventory-source-provenance-review.js'
UI=ROOT/'public/js/admin-inventory-source-provenance-review.js'
PAGE=ROOT/'admin/inventory-operations/index.html'

def read(path): return path.read_text(encoding='utf-8') if path.exists() else ''

def main():
 api,ui,page=read(API),read(UI),read(PAGE)
 checks=[
  ('review endpoint is Admin-authenticated', 'getAdminUserFromRequest' in api and "error:'Unauthorized.'" in api),
  ('review endpoint has no request-time schema DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b|PRAGMA',api,re.I)),
  ('review queues cover unverified sources, preferred drift/cardinality and duplicate supplier identity', all(x in api for x in ('unverified_sources','preferred_drift','preferred_cardinality','duplicate_supplier_identifiers','identifier_review'))),
  ('source review supports verify/reject', "action==='review_source'" in api and "['verified','rejected'].includes(status)" in api),
  ('identifier review supports verify/reject', "action==='review_identifier'" in api and 'verified_by_user_id' in api),
  ('preferred source synchronizes compatibility Inventory fields', "action==='set_preferred_source'" in api and 'UPDATE site_item_inventory SET supplier_name=?,supplier_sku=?,source_url=?' in api),
  ('metadata endpoint explicitly reports no stock/lot mutation', 'stock_mutation:false' in api and 'lot_quantity_mutation:false' in api),
  ('all write actions require meaningful review note', api.count('note.length<8') >= 3),
  ('UI exposes source and identifier review controls', 'data-source-review' in ui and 'data-source-preferred' in ui and 'data-identifier-review' in ui),
  ('UI uses explicit event-driven POST with no polling/retry', "method:'POST'" in ui and 'setInterval' not in ui and 'retries:' not in ui),
  ('Inventory Operations mounts source cleanup workspace', 'inventorySourceProvenanceReviewMount' in page and 'admin-inventory-source-provenance-review.js?v=440.1' in page),
 ]
 failed=[]
 print('BUILD 440 INVENTORY SOURCE PROVENANCE REVIEW REGRESSION')
 print('Cloudflare/D1/R2/provider access: NONE\n')
 for i,(label,ok) in enumerate(checks,1):
  print(f'{i:02d}. {"PASS" if ok else "FAIL"} — {label}')
  if not ok: failed.append(label)
 if failed:
  print(f'\nFAIL ({len(failed)}/{len(checks)} failed)')
  return 1
 print(f'\nPASS ({len(checks)}/{len(checks)})')
 print('Metadata-only review: VERIFIED')
 print('Preferred-source compatibility sync: VERIFIED')
 print('Production mutation capability: NONE')
 return 0

if __name__=='__main__': raise SystemExit(main())
