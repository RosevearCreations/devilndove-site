#!/usr/bin/env python3
"""Source gate for the existing Development runtime harness currentized to Release 461."""
from pathlib import Path
import subprocess,sys,re
ROOT=Path(__file__).resolve().parents[1]
HARNESS=ROOT/'scripts/development_runtime_acceptance.py';WORKFLOW=ROOT/'.github/workflows/release461-development-runtime-acceptance.yml'
assert HARNESS.is_file() and WORKFLOW.is_file()
h=HARNESS.read_text(encoding='utf-8');w=WORKFLOW.read_text(encoding='utf-8')
subprocess.run([sys.executable,'-m','py_compile',str(HARNESS)],cwd=ROOT,check=True)
subprocess.run([sys.executable,str(HARNESS),'--self-check'],cwd=ROOT,check=True)
for token in ("CURRENT_RELEASE=461","SESSION_ENV='DND_DEV_SESSION_COOKIE'","/api/admin/site-item-inventory","/api/admin/product-media-score","/api/admin/caip-production-pipeline","/api/admin/caip-content-handoff?creative_project_id=","quantity_authority')=='site_inventory_base_balances'","runtime_ddl') is False","r2_delete_active') is False","production_mutation':'FORBIDDEN'"):
 assert token in h,f'missing runtime acceptance invariant: {token}'
assert "method='GET'" in h and "method='POST'" not in h and "method='PUT'" not in h and "method='DELETE'" not in h
for token in ('workflow_dispatch:','release461-runtime-acceptance-request.json','git diff --name-only HEAD^ HEAD','DND_DEV_SESSION_COOKIE: ${{ secrets.DND_DEV_SESSION_COOKIE }}','CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}','EXPECTED_DEV_D1_DATABASE_ID: dbc1615b-dcbe-4951-973b-b47c99c73bfa','https://devilndove-site-dev.pages.dev','python scripts/release461_aggregate_source_gate.py','--anonymous-check','--evidence-json','SELECT COALESCE(NULLIF(s.session_token','s.expires_at>datetime(\'now\')','::add-mask::${TOKEN}','D1 session lookup: READ ONLY / existing session only','Separate live Production mutation: NONE','D1 mutation: NONE','R2 mutation: NONE','Provider execution/publication: CLOSED'):
 assert token in w,f'missing runtime workflow safety token: {token}'
assert '--file' not in w,'runtime acceptance must never apply a D1 file'
for pattern in (r'\bINSERT\s+INTO\b',r'\bUPDATE\s+\w+\s+SET\b',r'\bDELETE\s+FROM\b',r'\bALTER\s+TABLE\b',r'\bDROP\s+(?:TABLE|INDEX)\b',r'\bCREATE\s+(?:TABLE|INDEX|TRIGGER)\b'):
 assert not re.search(pattern,w,re.I),f'D1 mutation SQL forbidden in runtime workflow: {pattern}'
for forbidden in ('wrangler r2','devilndove-site.pages.dev/api','devilndove.com/api'):
 assert forbidden not in w,f'forbidden runtime acceptance capability: {forbidden}'
print('RELEASE 461 DEVELOPMENT RUNTIME ACCEPTANCE SOURCE GATE: PASS')
print('Runtime method: GET ONLY')
print('Session fallback: EXISTING DEVELOPMENT ADMIN SESSION / READ-ONLY D1 LOOKUP')
print('D1/R2/provider/Production mutation: NONE')
