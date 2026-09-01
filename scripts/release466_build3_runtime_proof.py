#!/usr/bin/env python3
"""Assemble read-only Development evidence for Release 466 Build 3."""
from __future__ import annotations
import argparse,json
from pathlib import Path
REQUIRED=('site_page_views_table','cart_activity_table','orders_table','site_search_events_table','products_table','site_item_inventory_table','inventory_supply_replenishment_profiles_table','inventory_supply_source_options_table','creative_work_projects_table','creative_project_profitability_table','creative_work_events_table')
def find_row(value):
 if isinstance(value,dict):
  if all(k in value for k in REQUIRED):return value
  for child in value.values():
   found=find_row(child)
   if found:return found
 if isinstance(value,list):
  for child in value:
   found=find_row(child)
   if found:return found
 return None
def main():
 p=argparse.ArgumentParser();p.add_argument('--d1',required=True);p.add_argument('--source-sha',required=True);p.add_argument('--output',required=True);args=p.parse_args()
 data=json.loads(Path(args.d1).read_text(encoding='utf-8'));row=find_row(data)
 if not row:raise SystemExit('Build 3 Development D1 evidence row not found')
 missing=[key.removesuffix('_table') for key in REQUIRED if int(row.get(key) or 0)!=1]
 if missing:raise SystemExit(f'Build 3 required Development authorities missing: {missing}')
 evidence={'release':466,'build':3,'status':'PASS','source_sha':args.source_sha,'environment':'development','schema_change':False,'required_authorities':{key.removesuffix('_table'):True for key in REQUIRED},'observed_rows':{key:int(row.get(key) or 0) for key in ('page_view_rows','cart_rows','order_rows','search_rows','product_rows','inventory_rows','creative_project_rows','profitability_rows')},'interpretation':'Observed row counts are coverage evidence only. Zero rows are not interpreted as zero demand or zero business activity outside the captured Development dataset.','safety':{'development_d1_operation':'SELECT only','production_business_rows_read':False,'production_mutation':False,'inventory_mutation':False,'accounting_posting':False,'provider_execution':False,'payment_execution':False,'automatic_price_change':False,'automatic_reorder':False,'automatic_project_start':False}}
 Path(args.output).write_text(json.dumps(evidence,indent=2,sort_keys=True)+'\n',encoding='utf-8');print(json.dumps(evidence,indent=2,sort_keys=True));return 0
if __name__=='__main__':raise SystemExit(main())
