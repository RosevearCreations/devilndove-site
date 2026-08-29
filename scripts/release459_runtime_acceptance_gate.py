#!/usr/bin/env python3
"""Release 459 source gate: authenticated Development acceptance + provider setup authority."""
from __future__ import annotations
import json,re,sqlite3,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path,*args):
 p=subprocess.run([sys.executable,str(ROOT/path),*args],capture_output=True,text=True);req(p.returncode==0,f'gate failed: {path} {" ".join(args)}\n{p.stdout}\n{p.stderr}')
MIG='migrations/dev/20260829_release459_it_provider_setup_authority.sql';GUIDE_API='functions/api/admin/it-provider-setup-guide.js';GUIDE_JS='public/js/admin-it-provider-setup-guide.js';GUIDE_CSS='css/it-provider-setup-guide.css';IT_HTML='admin/it-integrations/index.html';RUNTIME_HTML='admin/runtime-acceptance/index.html';RUNTIME_JS='public/js/admin-runtime-acceptance.js';RUNTIME_CSS='css/runtime-acceptance.css'
for p in (MIG,GUIDE_API,GUIDE_JS,GUIDE_CSS,IT_HTML,RUNTIME_HTML,RUNTIME_JS,RUNTIME_CSS,'scripts/development_runtime_acceptance.py','docs/operations/RELEASE_459_RUNTIME_PROVIDER_AUTHORITY.md'):req((ROOT/p).exists(),f'Release 459 asset missing: {p}')
mig,guide_api,guide_js,guide_css,it_html,runtime_html,runtime_js,runtime_css=map(read,(MIG,GUIDE_API,GUIDE_JS,GUIDE_CSS,IT_HTML,RUNTIME_HTML,RUNTIME_JS,RUNTIME_CSS))
for marker in ('X_CLIENT_ID','X_CLIENT_SECRET','X_REDIRECT_URI','YOUTUBE_CLIENT_ID','YOUTUBE_CLIENT_SECRET','YOUTUBE_REDIRECT_URI','PINTEREST_REDIRECT_URI','META_REDIRECT_URI','TIKTOK_REDIRECT_URI','ETSY_API_KEYSTRING','ETSY_SHARED_SECRET'):
 req(marker in mig,f'Release 459 migration missing reference {marker}')
req("('x','X','social'" in mig,'Release 459 migration must add X provider authority')
req('provider_execution_allowed' not in mig and 'publication_allowed=1' not in mig,'Release 459 migration must not enable provider execution/publication')
req('devilndove-site' not in mig.replace('devilndove-site-dev',''),'Release 459 migration must not name separate live Production')
req(not re.search(r'\b(DROP|ALTER)\s+TABLE\b',mig,re.I),'Release 459 provider metadata migration must not drop/alter tables')
# Compose real Release 449/450/453/459 schema locally and verify the new metadata.
try:
 with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
  db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON');db.execute('CREATE TABLE users(user_id INTEGER PRIMARY KEY)')
  for path in ('migrations/dev/20260829_release449_corporate_commerce.sql','migrations/dev/20260829_release450_marketplace_seo_readiness.sql','migrations/dev/20260829_release453_it_provider_readiness.sql',MIG):db.executescript(read(path))
  req(db.execute('SELECT COUNT(*) FROM provider_setup_authorities').fetchone()[0]==8,'Release 459 composed provider authority must contain 8 providers')
  refs=dict(db.execute("SELECT provider_key,required_config_keys_json FROM provider_setup_authorities WHERE provider_key IN ('etsy','pinterest','meta','x','tiktok','youtube')"))
  req('ETSY_API_KEYSTRING' in refs.get('etsy','') and 'ETSY_SHARED_SECRET' in refs.get('etsy',''),'Etsy reference convergence failed')
  req('PINTEREST_REDIRECT_URI' in refs.get('pinterest',''),'Pinterest redirect reference convergence failed')
  req('META_REDIRECT_URI' in refs.get('meta',''),'Meta redirect reference convergence failed')
  req('X_CLIENT_ID' in refs.get('x','') and 'X_REDIRECT_URI' in refs.get('x',''),'X reference convergence failed')
  req('TIKTOK_REDIRECT_URI' in refs.get('tiktok',''),'TikTok redirect reference convergence failed')
  req('YOUTUBE_CLIENT_ID' in refs.get('youtube','') and 'GOOGLE_CLIENT_ID' not in refs.get('youtube',''),'YouTube must use current YOUTUBE_* runtime references')
  req(db.execute("SELECT COUNT(*) FROM it_provider_readiness_checks WHERE provider_key='x' AND environment='development'").fetchone()[0]>=4,'X readiness checklist missing')
  yref=db.execute("SELECT config_reference FROM it_provider_readiness_checks WHERE provider_key='youtube' AND check_key='oauth-credentials' AND environment='development'").fetchone()[0]
  req('YOUTUBE_CLIENT_ID' in str(yref) and 'GOOGLE_CLIENT_ID' not in str(yref),'YouTube readiness reference mismatch remains')
  req(db.execute('PRAGMA foreign_key_check').fetchall()==[],'Release 449/450/453/459 composed foreign keys are not clean')
  secret_cols=db.execute("SELECT COUNT(*) FROM pragma_table_info('provider_setup_authorities') WHERE lower(name) IN ('secret','secret_value','api_key','access_token','refresh_token','client_secret','password','private_key')").fetchone()[0]
  req(secret_cols==0,'provider_setup_authorities must not gain secret-value columns')
except Exception as exc:FAIL.append(f'Release 459 local D1 composition failed: {exc}')
for marker in ('secret_values_emitted:false','provider_execution_allowed:false','provider_publication_allowed:false','oauth_token_exchange_global_state','X_CLIENT_ID','YOUTUBE_CLIENT_ID','ETSY_API_KEYSTRING','/api/social/oauth/x/callback','/api/social/oauth/youtube/callback'):
 req(marker in guide_api,f'Provider guide API missing safety/setup marker {marker}')
req('getAdminUserFromRequest' in guide_api and 'fetch(' not in guide_api,'Provider setup guide must be authenticated and must not contact providers')
req(not re.search(r'\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER)\b',guide_api,re.I),'Provider setup guide request-time DDL forbidden')
for marker in ('Copy name','/api/admin/it-provider-setup-guide','configuration_complete'):req(marker in guide_js,f'Provider setup renderer missing {marker}')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px'):req(marker in guide_css,f'Provider setup responsive CSS missing {marker}')
req(len(re.findall(r'<h1(?:\s|>)',it_html,re.I))==1 and 'noindex,nofollow' in it_html and 'data-admin-module="it-platform"' in it_html,'I.T. Integrations H1/private/module boundary drifted')
req('Release 459' in it_html and 'id="itSetupGuide"' in it_html and '/public/js/admin-it-provider-setup-guide.js?v=459' in it_html,'I.T. Integrations must expose Release 459 setup guide')
req(len(re.findall(r'<h1(?:\s|>)',runtime_html,re.I))==1 and 'noindex,nofollow' in runtime_html and 'data-admin-module="it-platform"' in runtime_html,'Runtime Acceptance H1/private/module boundary drifted')
for marker in ('Release 459','Run core acceptance','CAIP private-media range / seek proof','bytes=0-1023'):req(marker in runtime_html or marker in runtime_js,f'Runtime Acceptance missing {marker}')
for marker in ("method:'GET'","create_secure_review_link","Range:'bytes=0-1023'","ranged.status!==206",'source_media_copied:false','provider_execution:false','publication:false','autoplay:false'):req(marker in runtime_js,f'Runtime Acceptance safety marker missing {marker}')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px'):req(marker in runtime_css,f'Runtime Acceptance responsive CSS missing {marker}')
release=json.loads(read('development-release.json'));hist={x.get('release'):x for x in release.get('release_history',[])}
req(release.get('release')==459 and release.get('label')=='Authenticated Development Acceptance & Provider Setup Authority','current metadata must be Release 459')
req(release.get('current_release_migrations')==[MIG],'Release 459 metadata must identify exactly the Release 459 migration')
r458=hist.get(458,{});req(r458.get('state')=='complete_source_proven_no_new_d1_migration' and r458.get('focused_source_gate_run')==33265953249 and r458.get('system_gate_run')==33265953255 and r458.get('exact_head_sha')=='66b48f0445c74247972e14fbdaa0e215e3792fb7' and r458.get('pages_check_run')==99135984965,'Release 458 exact closure evidence must be carried forward')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed')
run('scripts/development_runtime_acceptance.py','--self-check');run('scripts/release458_caip_review_handoff_gate.py');run('scripts/release457_financials_operations_gate.py')
print('RELEASE 459 RUNTIME + PROVIDER AUTHORITY GATE')
print('Provider setup authorities: 8 / secret values stored: NO')
print('Core runtime acceptance: GET ONLY')
print('CAIP proof: explicit short-lived grant + bounded range/metadata/seek; source copy NO')
print('Provider execution/publication and separate live Production: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 459 RUNTIME + PROVIDER AUTHORITY GATE: PASS')
