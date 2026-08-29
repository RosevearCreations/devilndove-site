#!/usr/bin/env python3
"""Release 448 read-only promotion rehearsal.

This is intentionally a rehearsal, not a promotion command. It validates that the
machine authority can explain why Production is PASS/HOLD without mutating D1,
R2, providers, Git refs, Pages projects, or Production configuration.
"""
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'development-release.json'
EXPECTED_MIGRATIONS={
 'product-lineage','media-movie-it','storefront-merchandising','caip-content-handoff','tool-lifecycle','supply-sourcing'
}
EXPECTED_PROGRAM={
 'development-d1-activation','authenticated-real-data-calibration','supply-sourcing-replenishment-depth','external-private-acceptance','promotion-rehearsal'
}

def fail(message):
 print(f'FAIL — {message}',file=sys.stderr);raise SystemExit(1)

def load():
 if not AUTH.exists():fail('development-release.json is missing')
 try:return json.loads(AUTH.read_text(encoding='utf-8'))
 except Exception as error:fail(f'development-release.json is invalid JSON: {error}')

def evaluate(release):
 errors=[];holds=[];passes=[]
 if release.get('release')!=448:errors.append('Release 448 is not current')
 if release.get('environment')!='development' or release.get('branch')!='dev':errors.append('promotion rehearsal must originate from Development/dev authority')
 policy=release.get('release_policy') or {}
 if policy.get('production_promotion')!='closed':errors.append('Production promotion must remain closed during rehearsal')
 migrations=release.get('current_release_migrations') or []
 keys={row.get('key') for row in migrations}
 if keys!=EXPECTED_MIGRATIONS:errors.append(f'current Release 448 migration set drifted: {sorted(keys)}')
 for row in migrations:
  key=row.get('key') or 'unknown'
  if row.get('source_status')!='implemented_and_gated':errors.append(f'{key}: source is not implemented_and_gated')
  if row.get('production_allowed') is not False:errors.append(f'{key}: Production mutation is not explicitly forbidden')
  d1=row.get('development_d1_status')
  if d1=='applied_and_verified_development':passes.append(f'{key}: Development D1 applied and verified')
  else:holds.append(f'{key}: Development D1 not yet proven applied ({d1 or "unknown"})')
 baseline=release.get('database_baseline') or {}
 if baseline.get('apply_status')!='applied_and_verified_development':errors.append('Release 447 Development database baseline is not verified')
 program=release.get('completion_program') or {}
 steps={row.get('key'):row for row in program.get('steps') or []}
 if set(steps)!=EXPECTED_PROGRAM:errors.append(f'completion program drifted: {sorted(steps)}')
 d1_step=steps.get('development-d1-activation',{})
 if d1_step.get('status') not in {'applied_and_verified_development','complete'}:holds.append(f'Development D1 activation: {d1_step.get("status","unknown")}')
 calibration=steps.get('authenticated-real-data-calibration',{})
 if calibration.get('status') not in {'calibrated','complete','accepted'}:holds.append(f'Authenticated real-data calibration: {calibration.get("status","unknown")}')
 external=steps.get('external-private-acceptance',{})
 if external.get('status') not in {'accepted','complete'}:holds.append(f'External/private acceptance: {external.get("status","unknown")}')
 deferred=release.get('deferred_it_test_environment') or {}
 for task in deferred.get('tasks') or []:
  if task.get('status') not in {'passed','accepted','complete'}:holds.append(f'I.T. acceptance {task.get("key","unknown")}: {task.get("status","unknown")}')
 if policy.get('production_promotion')=='closed':passes.append('Production promotion remains closed')
 return errors,holds,passes

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source-check',action='store_true',help='Validate rehearsal authority while allowing an expected HOLD state.');parser.add_argument('--strict',action='store_true',help='Exit nonzero unless the rehearsal is promotion-ready.');args=parser.parse_args()
 release=load();errors,holds,passes=evaluate(release)
 if errors:
  for item in errors:print(f'ERROR — {item}')
  print('RELEASE 448 PROMOTION REHEARSAL: INVALID')
  return 1
 state='PASS' if not holds else 'HOLD'
 print(f'RELEASE 448 PROMOTION REHEARSAL: {state}')
 print('Mode: READ-ONLY — no Git/D1/R2/provider/Pages/Production mutation capability')
 for item in passes:print(f'PASS — {item}')
 for item in holds:print(f'HOLD — {item}')
 if args.source_check:
  print('SOURCE AUTHORITY CHECK: PASS')
  return 0
 if args.strict and holds:return 3
 return 0
if __name__=='__main__':raise SystemExit(main())
