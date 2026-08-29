#!/usr/bin/env python3
"""Release 448 exact-Development Supply sourcing/replenishment D1 runner."""
from __future__ import annotations
import argparse,json,sqlite3,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from build440_apply_development_d1 import DATABASE_ID,DATABASE_NAME,WINDOWS_SAFE_COMMAND_LINE_LIMIT,assert_development_config,build_wrangler_query_args,prepared_remote_statements,statement_fingerprint
MIGRATION='database_release448_supply_sourcing.sql';VERIFICATION='RELEASE448_SUPPLY_SOURCING_VERIFICATION.sql';EXPECTED_NAME='devilndove-dev';EXPECTED_ID='dbc1615b-dcbe-4951-973b-b47c99c73bfa';REQUIRED=('inventory_supply_source_options','inventory_supply_replenishment_profiles','inventory_supply_substitution_reviews')
def die(msg,code=2):print(f'STOP: {msg}',file=sys.stderr);raise SystemExit(code)
def guard():
 assert_development_config()
 if DATABASE_NAME!=EXPECTED_NAME or DATABASE_ID!=EXPECTED_ID:die('Exact Development D1 target changed.')
 if 'prod' in DATABASE_NAME.lower() or 'production' in DATABASE_NAME.lower():die('Production target detected.')
def rows(payload):
 out=[]
 if isinstance(payload,list):
  for item in payload:out.extend(rows(item))
 elif isinstance(payload,dict):
  if isinstance(payload.get('results'),list):out.extend(r for r in payload['results'] if isinstance(r,dict))
  if isinstance(payload.get('result'),(dict,list)):out.extend(rows(payload['result']))
 return out
def query(sql,label):
 args=build_wrangler_query_args(sql)+['--json']
 if '\n' in sql or '\r' in sql or not sqlite3.complete_statement(sql):die(f'Unsafe/incomplete query: {label}')
 if len(subprocess.list2cmdline(args))>WINDOWS_SAFE_COMMAND_LINE_LIMIT:die(f'Query exceeds transport limit: {label}')
 result=subprocess.run(args,cwd=ROOT,check=False,capture_output=True,text=True)
 if result.returncode:
  if result.stdout:print(result.stdout)
  if result.stderr:print(result.stderr,file=sys.stderr)
  die(f'D1 query failed: {label}',result.returncode)
 try:return rows(json.loads((result.stdout or '').strip()))
 except Exception:print(result.stdout);die(f'Non-JSON Wrangler output: {label}')
def execute(filename,read_only=False):
 statements,skipped=prepared_remote_statements(filename);print(f'{filename}: {len(statements)} statements; {len(skipped)} deliberate skips')
 for i,sql in enumerate(statements,1):
  if read_only:
   keyword=sql.lstrip().split(None,1)[0].upper()
   if keyword not in {'SELECT','PRAGMA','WITH','EXPLAIN'}:die(f'Verification mutation detected: {keyword}')
   print(json.dumps(query(sql,f'{filename} {i}/{len(statements)}'),ensure_ascii=False))
  else:
   print(f'--- {filename} {i}/{len(statements)} sha256:{statement_fingerprint(sql)} ---',flush=True)
   result=subprocess.run(build_wrangler_query_args(sql),cwd=ROOT,check=False)
   if result.returncode:die('Migration stopped; no automatic retry attempted.',result.returncode)
def transport_preflight():
 for filename in (MIGRATION,VERIFICATION):
  statements,_=prepared_remote_statements(filename)
  if not statements:die(f'No executable statements in {filename}')
  for sql in statements:
   build_wrangler_query_args(sql)
   if '\n' in sql or '\r' in sql or not sqlite3.complete_statement(sql):die(f'Transport guard failed for {filename}')
 print('RELEASE 448 SUPPLY SOURCING TRANSPORT PREFLIGHT: PASS')
def scalar(sql,label):
 result=query(sql,label)
 if len(result)!=1 or 'c' not in result[0]:die(f'Expected one count row for {label}')
 return int(result[0]['c'])
def verify():
 names=','.join(f"'{x}'" for x in REQUIRED)
 if scalar(f"SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name IN ({names});",'required tables')!=len(REQUIRED):die('Required Supply sourcing tables are missing.')
 if scalar("SELECT COUNT(*) AS c FROM inventory_supply_source_options s JOIN site_item_inventory i ON i.site_item_inventory_id=s.site_item_inventory_id WHERE lower(trim(COALESCE(i.source_type,'')))<>'supply';",'non-supply source options'):die('Supply source option attached to non-Supply Inventory item.')
 if scalar("SELECT COUNT(*) AS c FROM inventory_supply_replenishment_profiles p JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id WHERE lower(trim(COALESCE(i.source_type,'')))<>'supply';",'non-supply profiles'):die('Replenishment profile attached to non-Supply Inventory item.')
 if scalar("SELECT COUNT(*) AS c FROM inventory_supply_substitution_reviews r JOIN site_item_inventory a ON a.site_item_inventory_id=r.site_item_inventory_id JOIN site_item_inventory b ON b.site_item_inventory_id=r.substitute_site_item_inventory_id WHERE lower(trim(COALESCE(a.source_type,'')))<>'supply' OR lower(trim(COALESCE(b.source_type,'')))<>'supply' OR r.site_item_inventory_id=r.substitute_site_item_inventory_id;",'invalid substitutions'):die('Invalid Supply substitution review found.')
 if scalar("SELECT COUNT(*) AS c FROM inventory_supply_replenishment_profiles p JOIN inventory_supply_source_options s ON s.inventory_supply_source_option_id=p.preferred_source_option_id WHERE s.site_item_inventory_id<>p.site_item_inventory_id;",'mismatched preferred source'):die('Preferred source belongs to another Supply.')
 if query('PRAGMA foreign_key_check;','foreign keys'):die('Foreign-key violations detected.')
 print('PASS — Release 448 Supply sourcing/replenishment schema verified')
def main():
 p=argparse.ArgumentParser();p.add_argument('--transport-preflight',action='store_true');p.add_argument('--verify-only',action='store_true');args=p.parse_args();guard();transport_preflight()
 if args.transport_preflight:return 0
 if query('SELECT 1 AS development_d1_auth_probe;','Development D1 auth probe')!=[{'development_d1_auth_probe':1}]:die('Development D1 auth probe failed.')
 if not args.verify_only:execute(MIGRATION)
 verify();execute(VERIFICATION,read_only=True);print('RELEASE 448 DEVELOPMENT SUPPLY SOURCING: PASS');return 0
if __name__=='__main__':raise SystemExit(main())
