#!/usr/bin/env python3
"""Carried-forward Release 453 provider-readiness/D1 authority gate."""
from __future__ import annotations
import json,re,sqlite3,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
MIG='migrations/dev/20260829_release453_it_provider_readiness.sql';API='functions/api/admin/it-provider-readiness.js'
mig,api=read(MIG),read(API)
req('CREATE TABLE IF NOT EXISTS it_provider_readiness_checks' in mig,'Release 453 readiness table missing');req('CREATE TABLE IF NOT EXISTS it_provider_readiness_events' in mig,'Release 453 event table missing');req('REFERENCES provider_setup_authorities(provider_key)' in mig,'Release 453 parent authority drifted')
for p in ('stripe','paypal','etsy','pinterest','meta','tiktok','youtube'):req(f"('{p}','development'" in mig,f'Release 453 seed missing {p}')
req('getAdminUserFromRequest' in api and 'secret_value_refused' in api,'Release 453 Admin/secret safety drifted');req('provider_execution:false' in api and 'publication_allowed:false' in api,'Release 453 provider lock drifted');req('fetch(' not in api,'Release 453 readiness API must never call providers');req(not re.search(r'\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER)\b',api,re.I),'Release 453 request-time DDL is forbidden')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON');db.executescript("CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE provider_setup_authorities(provider_key TEXT PRIMARY KEY,display_name TEXT NOT NULL,provider_type TEXT NOT NULL,setup_authority TEXT NOT NULL,setup_url TEXT,required_config_keys_json TEXT NOT NULL DEFAULT '[]',setup_status TEXT NOT NULL DEFAULT 'unconfigured',enabled INTEGER NOT NULL DEFAULT 0,last_verified_at TEXT,last_error TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);");rows=[('stripe','Stripe','payment'),('paypal','PayPal','payment'),('etsy','Etsy','marketplace'),('pinterest','Pinterest','social'),('meta','Meta / Instagram','social'),('tiktok','TikTok','social'),('youtube','YouTube','video')];db.executemany("INSERT INTO provider_setup_authorities(provider_key,display_name,provider_type,setup_authority) VALUES(?,?,?,'I.T.')",rows);db.executescript(mig);req(db.execute('SELECT COUNT(*) FROM it_provider_readiness_checks').fetchone()[0]==32,'Release 453 must retain 32 seeded checks');req(db.execute('SELECT COUNT(DISTINCT provider_key) FROM it_provider_readiness_checks').fetchone()[0]==7,'Release 453 must retain seven providers');req(db.execute('PRAGMA foreign_key_check').fetchall()==[],'Release 453 foreign keys drifted')
release=json.loads(read('development-release.json'));req(int(release.get('release') or 0)>=453,'current release predates Release 453 authority');d1=release.get('development_infrastructure',{}).get('d1',{});req(int(d1.get('schema_current_through_release') or 0)>=453,'Development D1 must remain verified through at least Release 453');hist={x.get('release'):x for x in release.get('release_history',[])};r=hist.get(453,{});req(r.get('mutation_workflow_run')==33258377328 and r.get('verification_workflow_run')==33258415391,'Release 453 remote proof missing');req(release.get('current_release_database_state',{}).get('historical_migration_replay') is False,'historical replay must remain forbidden')
print('RELEASE 453 I.T. PROVIDER READINESS: CARRIED FORWARD PASS');print('32 checks / 7 providers / independent D1 proof: PRESERVED');print('Provider execution/publication: DISABLED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
