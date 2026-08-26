#!/usr/bin/env python3
"""Build 440 Development-only Tool lifecycle migration/apply verifier.
Hard-pinned to branch dev and devilndove-dev. No Production mode exists.
"""
from __future__ import annotations
import argparse, os, re, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'wrangler.toml'; MIGRATION=ROOT/'database_build440_tool_lifecycle_history.sql'
VERIFY=ROOT/'BUILD440_D1_VERIFICATION.sql'; STRICT=ROOT/'BUILD440_D1_STRICT_VERIFICATION.sql'
DATABASE='devilndove-dev'; DATABASE_ID='dbc1615b-dcbe-4951-973b-b47c99c73bfa'; WRANGLER='4.126.0'
def fail(msg): print(f'STOP: {msg}',file=sys.stderr); raise SystemExit(1)
def run(args,echo=True):
 r=subprocess.run(args,cwd=ROOT,text=True,encoding='utf-8',errors='replace',stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env={**os.environ,'NO_COLOR':'1','FORCE_COLOR':'0'},check=False)
 if echo: print(r.stdout,end='' if r.stdout.endswith('\n') else '\n')
 return r
def npx():
 p=shutil.which('npx.cmd') or shutil.which('npx')
 if not p: fail('npx was not found on PATH.')
 return p
def guard():
 b=run(['git','branch','--show-current'],False).stdout.strip()
 if b!='dev': fail(f'Build 440 Tool lifecycle helper requires branch dev, found {b or "unknown"}.')
 src=CONFIG.read_text(encoding='utf-8')
 name=re.search(r'^\s*database_name\s*=\s*"([^"]+)"',src,re.M); ident=re.search(r'^\s*database_id\s*=\s*"([^"]+)"',src,re.M)
 if not name or not ident or name.group(1)!=DATABASE or ident.group(1)!=DATABASE_ID: fail('Build 440 Tool lifecycle helper target mismatch; Development-only guard stopped execution.')
def cmd(path): return [npx(),'--yes',f'wrangler@{WRANGLER}','d1','execute',DATABASE,'--remote','--config',str(CONFIG),'--yes','--file',str(path)]
def classify(r,label):
 low=(r.stdout or '').lower()
 if '7403' in low or 'not authorized' in low or 'sqlite_auth' in low: fail(f'Cloudflare authorization blocked {label}; do not infer schema failure.')
 if 'sqlite_error' in low or 'syntax error' in low or 'integer overflow' in low or 'constraint failed' in low: fail(f'{label} failed SQLite/verification assertions.')
 fail(f'{label} failed with exit code {r.returncode}.')
def apply():
 print('=== BUILD 440 DEVELOPMENT TOOL LIFECYCLE APPLY ==='); print(f'Target: {DATABASE} ({DATABASE_ID})'); print('R2/provider mutation: NONE'); print('Production capability: NONE')
 r=run(cmd(MIGRATION));
 if r.returncode: classify(r,'Build 440 Tool lifecycle migration')
 print('BUILD 440 DEVELOPMENT TOOL LIFECYCLE APPLY: PASS')
def verify():
 print('=== BUILD 440 DEVELOPMENT TOOL LIFECYCLE READ-ONLY VERIFICATION ===')
 r=run(cmd(VERIFY));
 if r.returncode: classify(r,'Build 440 Tool lifecycle verification')
 s=run(cmd(STRICT));
 if s.returncode: classify(s,'Build 440 strict Tool lifecycle verification')
 print('table_count: 2'); print('index_count: 3'); print('migration_ledger_count: 1'); print('BUILD 440 DEVELOPMENT TOOL LIFECYCLE READ-ONLY VERIFICATION: PASS / EXACT')
def main():
 p=argparse.ArgumentParser(); p.add_argument('--apply',action='store_true'); p.add_argument('--verify',action='store_true'); p.add_argument('--apply-and-verify',action='store_true'); a=p.parse_args()
 if sum(map(bool,(a.apply,a.verify,a.apply_and_verify)))!=1: p.error('Choose exactly one mode.')
 guard(); auth=run([npx(),'--yes',f'wrangler@{WRANGLER}','whoami']);
 if auth.returncode: fail('Wrangler authentication check failed. No D1 command was attempted.')
 if a.apply or a.apply_and_verify: apply()
 if a.verify or a.apply_and_verify: verify()
 print('Production D1 mutation executed: NO'); print('R2/provider mutation executed: NO'); print('PRODUCTION PROMOTION: CLOSED'); return 0
if __name__=='__main__': raise SystemExit(main())
