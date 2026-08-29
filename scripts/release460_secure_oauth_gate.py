from pathlib import Path
import json, sqlite3, tempfile

ROOT=Path(__file__).resolve().parents[1]
def read(path): return (ROOT/path).read_text(encoding='utf-8')
def need(text,*parts):
    for part in parts:
        assert part in text, f'missing required Release 460 invariant: {part}'

security=read('functions/api/_lib/oauthSecurity.js')
providers=read('functions/api/_lib/oauthProviders.js')
start=read('functions/api/admin/oauth-start.js')
callback=read('functions/api/social/oauth/_callback.js')
connections=read('functions/api/admin/oauth-connections.js')
migration=read('migrations/dev/20260829_release460_secure_oauth_lifecycle.sql')
authority=read('functions/api/_lib/releaseAuthority.js')
release=json.loads(read('development-release.json'))

need(security,'AES-GCM','OAUTH_TOKEN_ENCRYPTION_KEY_V1','sha256Base64Url','development-explicit','devilndove-site-dev.pages.dev','[REDACTED]')
need(providers,'etsy','pinterest','meta','x','tiktok','youtube','https://api.x.com/2/oauth2/revoke','https://open.tiktokapis.com/v2/oauth/revoke/','https://oauth2.googleapis.com/revoke')
need(start,'getAdminUserFromRequest','oauth_live_authorization_closed','stateHash','pkce_verifier_ciphertext',"datetime('now','+10 minutes')")
need(callback,'consumed_at IS NULL','expires_at>CURRENT_TIMESTAMP','pkce_verifier_ciphertext=NULL','encryptOAuthSecret','oauthRemoteAuthorizationOpen')
need(connections,'secret_values_emitted:false','provider_publication_allowed:false','local_token_material_destroyed:true','refreshOAuthToken','revokeOAuthToken')
need(migration,'state_hash TEXT NOT NULL UNIQUE','access_token_ciphertext','refresh_token_ciphertext','release460_forbidden_plaintext_columns','PRAGMA foreign_key_check')
for forbidden in (' state TEXT',' code TEXT',' code_verifier TEXT',' access_token TEXT',' refresh_token TEXT'):
    assert forbidden not in migration, f'plaintext OAuth persistence forbidden: {forbidden.strip()}'

# Execute the actual Release 460 migration against a minimal Release 459-compatible authority.
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
    db=sqlite3.connect(tmp.name)
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('CREATE TABLE users(user_id INTEGER PRIMARY KEY)')
    db.execute('''CREATE TABLE it_provider_readiness_checks(
      provider_key TEXT NOT NULL, environment TEXT NOT NULL, check_key TEXT NOT NULL,
      correction_mechanics TEXT, source_release INTEGER, updated_at TEXT,
      PRIMARY KEY(provider_key,environment,check_key))''')
    for provider in ('etsy','pinterest','meta','x','tiktok','youtube'):
        db.execute("INSERT INTO it_provider_readiness_checks(provider_key,environment,check_key,correction_mechanics,source_release) VALUES(?, 'development','connection-acceptance','Release 459',459)",(provider,))
    db.executescript(migration)
    assert db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('oauth_authorization_transactions','oauth_provider_connections','oauth_security_events')").fetchone()[0]==3
    forbidden=db.execute("""SELECT COUNT(*) FROM (
      SELECT name FROM pragma_table_info('oauth_authorization_transactions')
      UNION ALL SELECT name FROM pragma_table_info('oauth_provider_connections'))
      WHERE lower(name) IN ('state','code','code_verifier','access_token','refresh_token','id_token','client_secret','shared_secret','password')""").fetchone()[0]
    assert forbidden==0, 'Release 460 schema contains forbidden plaintext OAuth columns'
    assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
    db.execute("INSERT INTO oauth_authorization_transactions(transaction_id,provider_key,state_hash,redirect_uri,expires_at) VALUES('a','x','same-hash','https://example.invalid/callback',datetime('now','+10 minutes'))")
    try:
        db.execute("INSERT INTO oauth_authorization_transactions(transaction_id,provider_key,state_hash,redirect_uri,expires_at) VALUES('b','x','same-hash','https://example.invalid/callback',datetime('now','+10 minutes'))")
        raise AssertionError('state_hash replay uniqueness constraint did not fire')
    except sqlite3.IntegrityError:
        pass

assert 'CURRENT_RELEASE = 460' in authority
assert release.get('release')==460
policy=release.get('release_policy',{})
evidence=release.get('current_release_evidence',{})
assert policy.get('production_promotion')=='closed'
assert policy.get('provider_publication')=='closed'
assert policy.get('provider_execution')=='closed'
assert policy.get('provider_live_authorization')=='closed'
assert policy.get('oauth_remote_operator_switch')=='unset'
assert evidence.get('production_mutation') is False
assert evidence.get('provider_execution_enabled') is False
assert evidence.get('provider_live_authorization_enabled') is False
assert evidence.get('oauth_remote_operator_switch_set') is False
assert evidence.get('secret_values_stored_in_plaintext') is False
assert release.get('current_release_migrations')==['migrations/dev/20260829_release460_secure_oauth_lifecycle.sql']
assert (ROOT/'functions/api/social/oauth/etsy/callback.js').exists()
print('RELEASE 460 SECURE OAUTH SOURCE + LOCAL D1 GATE: PASS')
