#!/usr/bin/env python3
"""Read-only carried-forward promotion rehearsal.

Historical filename retained for provenance. The evaluator applies to the current
Development release and never mutates Git, D1, R2, providers, Pages or Production.
"""
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'development-release.json'

def fail(message): print(f'FAIL — {message}',file=sys.stderr);raise SystemExit(1)
def load():
 if not AUTH.exists():fail('development-release.json is missing')
 try:return json.loads(AUTH.read_text(encoding='utf-8'))
 except Exception as error:fail(f'development-release.json is invalid JSON: {error}')

def evaluate(release):
 errors=[];holds=[];passes=[]
 current=int(release.get('release') or 0)
 if current<448:errors.append('current release predates carried-forward promotion authority')
 if release.get('environment')!='development' or release.get('branch')!='dev':errors.append('promotion rehearsal must originate from Development/dev authority')
 policy=release.get('release_policy') or {}
 if policy.get('production_promotion')!='closed':errors.append('Production promotion must remain closed during rehearsal')
 baseline=release.get('database_baseline') or {}
 if baseline.get('apply_status')!='applied_and_verified_development':errors.append('Release 447 Development database baseline is not verified')
 previous=release.get('previous_release') or {}
 if previous.get('state')!='complete':holds.append(f'previous release {previous.get("release","unknown")} is not marked complete')
 for row in release.get('current_release_migrations') or []:
  key=row.get('key') or 'unknown'
  if row.get('production_allowed') is not False:errors.append(f'{key}: Production mutation is not explicitly forbidden')
  if row.get('source_status') not in {'implemented_and_gated','implemented','source_green'}:holds.append(f'{key}: source state {row.get("source_status","unknown")}')
  d1=row.get('development_d1_status')
  if d1 in {'applied_and_verified_development','not_required'}:passes.append(f'{key}: Development D1 state {d1}')
  else:holds.append(f'{key}: Development D1 not yet proven ({d1 or "unknown"})')
 for task in (release.get('deferred_it_test_environment') or {}).get('tasks') or []:
  if task.get('release_gating') is True and task.get('status') not in {'passed','accepted','complete'}:holds.append(f'I.T. acceptance {task.get("key","unknown")}: {task.get("status","unknown")}')
 if policy.get('production_promotion')=='closed':passes.append('Production promotion remains closed')
 return errors,holds,passes

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source-check',action='store_true');parser.add_argument('--strict',action='store_true');args=parser.parse_args()
 release=load();errors,holds,passes=evaluate(release)
 if errors:
  for item in errors:print(f'ERROR — {item}')
  print('PROMOTION REHEARSAL: INVALID');return 1
 state='PASS' if not holds else 'HOLD'
 print(f"RELEASE {release.get('release')} PROMOTION REHEARSAL: {state}")
 print('Mode: READ-ONLY — no Git/D1/R2/provider/Pages/Production mutation capability')
 for item in passes:print(f'PASS — {item}')
 for item in holds:print(f'HOLD — {item}')
 if args.source_check:print('SOURCE AUTHORITY CHECK: PASS');return 0
 if args.strict and holds:return 3
 return 0
if __name__=='__main__':raise SystemExit(main())
