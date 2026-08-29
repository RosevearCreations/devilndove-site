#!/usr/bin/env python3
"""Release 453 source/local gate for durable I.T. provider readiness authority."""
from __future__ import annotations
import json,re,sqlite3,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def req(ok,msg):
 if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
MIG='migrations/dev/20260829_release453_it_provider_readiness.sql'
API='functions/api/admin/it-provider-readiness.js'
JS='public/js/admin-it-provider-readiness.js'
PAGE='admin/it-integrations/index.html'
IT='admin/it-platform/index.html'
CSS='css/admin-it-provider-readiness.css'
for p in (MIG,API,JS,PAGE,IT,CSS): req((ROOT/p).exists(),f'missing Release 453 authority: {p}')
if FAIL:
 print('\n'.join(FAIL));raise SystemExit(1)
mig,api,js,page,it,css=map(read,(MIG,API,JS,PAGE,IT,CSS))
req('CREATE TABLE IF NOT EXISTS it_provider_readiness_checks' in mig,'readiness-check table missing')
req('CREATE TABLE IF NOT EXISTS it_provider_readiness_events' in mig,'immutable readiness-event table missing')
req('REFERENCES provider_setup_authorities(provider_key)' in mig,'Release 453 must extend Release 449 provider identity')
req("source_release INTEGER NOT NULL DEFAULT 453" in mig,'source release authority missing')
req('ON CONFLICT(provider_key,environment,check_key) DO UPDATE SET' in mig,'seed convergence must preserve operator state while refreshing mechanics')
req(mig.count("'development'")>=32,'Release 453 must seed the Development provider checklist')
for provider in ('stripe','paypal','etsy','pinterest','meta','tiktok','youtube'): req(f"('{provider}','development'" in mig,f'missing seeded checks for {provider}')
for forbidden in ('pk_live_','sk_live_','PAYPAL_CLIENT_SECRET=','ETSY_SHARED_SECRET=','META_APP_SECRET=','TIKTOK_CLIENT_SECRET=','GOOGLE_CLIENT_SECRET='):
 req(forbidden not in mig,f'secret-like value must not exist in migration: {forbidden}')
req('devilndove-site' not in mig.lower(),'Production Pages identifier must not appear in Development migration')

# Execute the exact migration against a minimal Release 449-compatible fixture.
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON')
 db.executescript("""CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE provider_setup_authorities(provider_key TEXT PRIMARY KEY,display_name TEXT NOT NULL,provider_type TEXT NOT NULL,setup_authority TEXT NOT NULL,setup_url TEXT,required_config_keys_json TEXT NOT NULL DEFAULT '[]',setup_status TEXT NOT NULL DEFAULT 'unconfigured',enabled INTEGER NOT NULL DEFAULT 0,last_verified_at TEXT,last_error TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);""")
 rows=[('stripe','Stripe','payment'),('paypal','PayPal','payment'),('etsy','Etsy','marketplace'),('pinterest','Pinterest','social'),('meta','Meta / Instagram','social'),('tiktok','TikTok','social'),('youtube','YouTube','video')]
 db.executemany("INSERT INTO provider_setup_authorities(provider_key,display_name,provider_type,setup_authority) VALUES(?,?,?,'I.T.')",rows)
 db.executescript(mig)
 count=db.execute('SELECT COUNT(*) FROM it_provider_readiness_checks').fetchone()[0]
 providers=db.execute('SELECT COUNT(DISTINCT provider_key) FROM it_provider_readiness_checks').fetchone()[0]
 events=db.execute('SELECT COUNT(*) FROM it_provider_readiness_events').fetchone()[0]
 deferred=db.execute("SELECT COUNT(*) FROM it_provider_readiness_checks WHERE check_state='deferred'").fetchone()[0]
 req(count==32,f'expected 32 seeded readiness checks, got {count}')
 req(providers==7,f'expected 7 provider identities, got {providers}')
 req(events==0,'migration must not fabricate readiness events')
 req(deferred==32,'provider acceptance must remain deferred by default')
 req(db.execute('PRAGMA foreign_key_check').fetchall()==[],'Release 453 migration introduced foreign-key violations')
 # Replay locally to prove idempotent convergence does not duplicate checks.
 db.executescript(mig)
 req(db.execute('SELECT COUNT(*) FROM it_provider_readiness_checks').fetchone()[0]==32,'migration convergence replay duplicated checks')

req('getAdminUserFromRequest' in api,'readiness API must be Admin-authenticated')
req('db.batch([update,event])' in api,'state update and immutable event evidence must be batched')
req('auditAdminAction' in api and 'captureRuntimeIncident' in api,'I.T. readiness mutations require audit/incident evidence')
req('provider_execution:false' in api and 'publication_allowed:false' in api,'provider execution/publication must remain fail-closed')
req(not re.search(r'\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER)\b',api,re.I),'request-time DDL is forbidden')
req('fetch(' not in api,'I.T. readiness API must not call external providers')
req('secret_value_refused' in api,'API must refuse secret-like values')
req("'/api/admin/it-provider-readiness'" in js,'workspace must use canonical readiness API')
req('Save readiness evidence' in js and 'No provider call is performed.' in js,'workspace must explain safe evidence-only mutation')
req('fetch(' in js,'browser workspace may call only its own authenticated API')
req(page.lower().count('<h1')==1,'I.T. integration page must expose exactly one H1')
req('noindex,nofollow' in page,'I.T. integration page must remain private to search engines')
req('/public/js/admin-it-provider-readiness.js?v=453' in page,'Release 453 readiness runtime not loaded')
req('Provider acceptance checklist' in page,'Release 453 checklist UI missing')
req(it.lower().count('<h1')==1 and 'Release 453' in it,'I.T. landing page must identify Release 453 with one H1')
req('/admin/it-integrations/' in it,'I.T. landing page must link provider readiness cockpit')
req('@media(max-width:640px)' in css and '@media(max-width:900px)' in css,'readiness workspace must be responsive')

release=json.loads(read('development-release.json'))
# During the pre-mutation source phase schema may still be 450; after remote proof it must be promoted to 453.
req(release.get('release') in (452,453),'unexpected release identity during Release 453 source preparation')
wrangler=read('wrangler.toml')
req('database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,'exact Development D1 authority drifted')
req('account_id =' not in wrangler,'wrangler.toml must never pin account_id')
print('RELEASE 453 I.T. PROVIDER READINESS SOURCE GATE')
print('Provider readiness checks: 32 across 7 providers')
print('Immutable state-change evidence: PRESENT')
print('Secret values: FORBIDDEN')
print('Provider execution/publication: DISABLED')
print('Request-time DDL: NONE')
print('Development D1 target: EXACT / SOURCE-PREFLIGHT ONLY')
print('Production mutation capability: NONE')
if FAIL:
 for i,msg in enumerate(FAIL,1): print(f'{i:03d}. FAIL — {msg}')
 raise SystemExit(1)
print('RELEASE 453 I.T. PROVIDER READINESS SOURCE GATE: PASS')
