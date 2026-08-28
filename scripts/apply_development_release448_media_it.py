#!/usr/bin/env python3
"""Release 448 Development-only media quality / Movie review / I.T. registry D1 runner."""
from __future__ import annotations
import argparse, json, sqlite3, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from build440_apply_development_d1 import DATABASE_ID,DATABASE_NAME,WINDOWS_SAFE_COMMAND_LINE_LIMIT,assert_development_config,build_wrangler_query_args,prepared_remote_statements,statement_fingerprint
RELEASE=448;MIGRATION='database_release448_media_it.sql';VERIFICATION='RELEASE448_MEDIA_IT_VERIFICATION.sql';EXPECTED_NAME='devilndove-dev';EXPECTED_ID='dbc1615b-dcbe-4951-973b-b47c99c73bfa';REQUIRED=('product_image_quality_assessments','movie_metadata_reviews','it_integration_registry')
def die(msg,code=2):print(f'STOP: {msg}',file=sys.stderr);raise SystemExit(code)
def guard():
 assert_development_config()
 if DATABASE_NAME!=EXPECTED_NAME or DATABASE_ID!=EXPECTED_ID:die('Exact Development D1 target changed.')
 if 'prod' in DATABASE_NAME.lower():die('Production target detected.')
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
  print(result.stdout);print(result.stderr,file=sys.stderr);die(f'D1 query failed: {label}',result.returncode)
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
 print('RELEASE 448 MEDIA/IT TRANSPORT PREFLIGHT: PASS')
def scalar(sql,field,label):
 result=query(sql,label)
 if len(result)!=1 or field not in result[0]:die(f'Expected one {field} row for {label}')
 return int(result[0][field])
def verify():
 names=','.join(f"'{x}'" for x in REQUIRED)
 if scalar(f"SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name IN ({names});",'c','required tables')!=len(REQUIRED):die('Required Release 448 media/I.T. tables are missing.')
 movies=scalar('SELECT COUNT(*) AS c FROM movies;','c','Movie count');reviews=scalar('SELECT COUNT(*) AS c FROM movie_metadata_reviews;','c','Movie review coverage')
 if movies!=reviews:die(f'Movie metadata review coverage mismatch: movies={movies}, reviews={reviews}')
 if scalar('SELECT COUNT(*) AS c FROM product_image_quality_assessments WHERE total_score<0 OR total_score>100;','c','image score range'):die('Invalid image quality score found.')
 if scalar("SELECT COUNT(*) AS c FROM it_integration_registry WHERE credential_reference IS NOT NULL AND (instr(lower(credential_reference),'secret=')>0 OR instr(lower(credential_reference),'token=')>0);",'c','secret-reference guard'):die('Suspicious credential reference found.')
 if query('PRAGMA foreign_key_check;','foreign keys'):die('Foreign-key violations detected.')
 print('PASS — Release 448 media quality, Movie review and I.T. registry schema verified')
def main():
 p=argparse.ArgumentParser();p.add_argument('--transport-preflight',action='store_true');p.add_argument('--verify-only',action='store_true');args=p.parse_args();guard();transport_preflight()
 if args.transport_preflight:return 0
 if query('SELECT 1 AS development_d1_auth_probe;','Development D1 auth probe')!=[{'development_d1_auth_probe':1}]:die('Development D1 auth probe failed.')
 if not args.verify_only:execute(MIGRATION)
 verify();execute(VERIFICATION,read_only=True);print('RELEASE 448 DEVELOPMENT MEDIA/I.T.: PASS');return 0
if __name__=='__main__':raise SystemExit(main())
