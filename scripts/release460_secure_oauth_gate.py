from pathlib import Path
import json

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

need(security,"AES-GCM","OAUTH_TOKEN_ENCRYPTION_KEY_V1","sha256Base64Url","development-explicit","devilndove-site-dev.pages.dev","[REDACTED]")
need(providers,"etsy","pinterest","meta","x","tiktok","youtube","https://api.x.com/2/oauth2/revoke","https://open.tiktokapis.com/v2/oauth/revoke/","https://oauth2.googleapis.com/revoke")
need(start,"getAdminUserFromRequest","oauth_live_authorization_closed","stateHash","pkce_verifier_ciphertext","datetime('now','+10 minutes')")
need(callback,"consumed_at IS NULL","expires_at>CURRENT_TIMESTAMP","pkce_verifier_ciphertext=NULL","encryptOAuthSecret","oauthRemoteAuthorizationOpen")
need(connections,"secret_values_emitted:false","provider_publication_allowed:false","local_token_material_destroyed:true","refreshOAuthToken","revokeOAuthToken")
need(migration,"state_hash TEXT NOT NULL UNIQUE","access_token_ciphertext","refresh_token_ciphertext","release460_forbidden_plaintext_columns","PRAGMA foreign_key_check")
for forbidden in (' state TEXT',' code TEXT',' code_verifier TEXT',' access_token TEXT',' refresh_token TEXT'):
    assert forbidden not in migration, f'plaintext OAuth persistence forbidden: {forbidden.strip()}'
assert "CURRENT_RELEASE = 460" in authority
assert release.get('release')==460
assert release.get('policy',{}).get('production_promotion')=='closed'
assert release.get('policy',{}).get('provider_publication')=='closed'
assert release.get('policy',{}).get('provider_execution')=='closed'
assert release.get('evidence',{}).get('production_mutation') is False
assert release.get('evidence',{}).get('provider_execution_enabled') is False
assert (ROOT/'functions/api/social/oauth/etsy/callback.js').exists()
print('RELEASE 460 SECURE OAUTH SOURCE GATE: PASS')
