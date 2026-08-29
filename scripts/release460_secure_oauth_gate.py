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
publish_contracts=read('functions/api/_lib/socialPublishContracts.js')
publish_endpoint=read('functions/api/admin/provider-publication-plan.js')
admin_middleware=read('functions/api/admin/_middleware.js')
social_queue=read('functions/api/admin/social-post-queue.js')
social_product_automation=read('functions/api/admin/social-product-automation.js')
meta_data_deletion=read('functions/api/social/meta/data-deletion.js')
mock_proof=read('scripts/release460_provider_contract_mock_proof.mjs')
publish_mock_proof=read('scripts/release460_publish_contract_mock_proof.mjs')
migration=read('migrations/dev/20260829_release460_secure_oauth_lifecycle.sql')
authority=read('functions/api/_lib/releaseAuthority.js')
release=json.loads(read('development-release.json'))

need(security,'AES-GCM','OAUTH_TOKEN_ENCRYPTION_KEY_V1','sha256Base64Url','development-explicit','devilndove-site-dev.pages.dev','[REDACTED]')
need(providers,
     'etsy','pinterest','meta','x','tiktok','youtube',
     'verifyOAuthIdentity','providerIdentityExpectation','providerIdentityStatus',
     'ETSY_EXPECTED_USER_ID','PINTEREST_EXPECTED_USERNAME','META_EXPECTED_PAGE_ID','META_EXPECTED_INSTAGRAM_BUSINESS_ID','X_EXPECTED_USER_ID','TIKTOK_EXPECTED_OPEN_ID','YOUTUBE_EXPECTED_CHANNEL_ID',
     'https://api.etsy.com/v3/application/users/me','https://api.pinterest.com/v5/user_account','https://graph.facebook.com/me/accounts?fields=id,name,instagram_business_account','https://api.x.com/2/users/me','https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name','https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
     'user_accounts:read','https://www.googleapis.com/auth/youtube.readonly',
     'https://api.x.com/2/oauth2/revoke','https://open.tiktokapis.com/v2/oauth/revoke/','https://oauth2.googleapis.com/revoke')
need(start,'getAdminUserFromRequest','oauth_live_authorization_closed','providerIdentityExpectation','oauth_intended_account_not_configured','identity_lookup_configuration_ready','stateHash','pkce_verifier_ciphertext',"datetime('now','+10 minutes')")
need(callback,'consumed_at IS NULL','expires_at>CURRENT_TIMESTAMP','pkce_verifier_ciphertext=NULL','verifyOAuthIdentity','intended_account_verified','encryptOAuthSecret','oauthRemoteAuthorizationOpen')
need(connections,'secret_values_emitted:false','provider_subject_values_emitted:false','provider_publication_allowed:false','intended_account_verification','expected_subject_configured','providerIdentityStatus','verifyOAuthIdentity','local_token_material_destroyed:true','refreshOAuthToken','revokeOAuthToken')
need(mock_proof,'INTENDED ACCOUNT MOCK PROOF','oauth_intended_account_not_configured','oauth_intended_account_mismatch','META_EXPECTED_INSTAGRAM_BUSINESS_ID','provider-sensitive-identity-detail')

# Release 460 publication planning is a pure validation/idempotency layer, not provider execution.
need(publish_contracts,
     "const PROVIDER_KEYS = ['etsy', 'pinterest', 'meta', 'x', 'tiktok', 'youtube']",
     'release460_internal_preview_v1','sha256Base64Url','duplicate_blocked','new_or_revised',
     'provider_execution: false','provider_publication: false','network_calls_allowed: false','token_material_required: false',
     'provider_subject_values_emitted: false','secret_values_emitted: false')
assert 'fetch(' not in publish_contracts, 'publication validation contract must not contain provider network execution'
assert 'decryptOAuthSecret' not in publish_contracts, 'publication validation contract must not read/decrypt OAuth tokens'
need(publish_endpoint,
     'getAdminUserFromRequest','isDevelopmentOAuthHost','buildProviderPublicationPlan','listProviderPublicationContracts',
     'provider_publication_validation_development_only','provider_publication_validation_only',
     'provider_execution: false','provider_publication: false','network_calls_allowed: false','production_mutation: false')
assert 'fetch(' not in publish_endpoint, 'publication validation endpoint must not contact providers'
assert 'decryptOAuthSecret' not in publish_endpoint, 'publication validation endpoint must not read/decrypt OAuth tokens'
need(publish_mock_proof,
     'PROVIDER PUBLICATION VALIDATION + IDEMPOTENCY MOCK PROOF','fetchCalls','duplicate_blocked',
     'provider-secret-must-never-appear','provider-subject-must-never-appear','public_https_image_required','public_https_video_required')

# Release 460 closes legacy provider execution at the HTTP middleware before owner handlers.
# The smaller product-automation owner is additionally hard-closed so direct invocation cannot probe Meta.
need(social_queue,'publish_platforms','publishToFacebook','publishToInstagram','publishToX','publishToPinterest')
need(social_product_automation,
     'test_meta_connections','provider_execution_closed','provider_contacted: false','social_meta_connection_probe_blocked','/api/admin/provider-publication-plan')
assert 'fetch(' not in social_product_automation, 'legacy social product automation owner must not contact providers in Release 460'
assert 'graph.facebook.com' not in social_product_automation, 'legacy Meta Graph client must be removed from social product automation owner'
need(admin_middleware,
     'guardClosedProviderExecution','CLOSED_PROVIDER_DIAGNOSTIC_PATHS','/api/admin/social-post-queue','publish_platforms','/api/admin/social-product-automation','test_meta_connections',
     'provider_execution_closed','legacy_handler_executed: false','currentizeClosedProviderDiagnostics','closedProviderReadiness','/api/admin/provider-publication-plan',
     'provider_execution: false','provider_publication: false','provider_contacted: false')
provider_guard=admin_middleware.index('const providerBlocked = await guardClosedProviderExecution(context)')
next_handler=admin_middleware.index('const response = await context.next()')
assert provider_guard < next_handler, 'provider execution guard must run before retained admin route handler'
provider_currentize=admin_middleware.index('const providerCurrent = await currentizeClosedProviderDiagnostics(response, pathname)')
assert next_handler < provider_currentize, 'legacy social diagnostics must be currentized after retained owner reads'
need(meta_data_deletion,'automated_signed_request_processing: false','No unverified deletion was performed.')
assert 'fetch(' not in meta_data_deletion, 'Meta data-deletion readiness endpoint must remain local/fail-closed'

need(migration,'state_hash TEXT NOT NULL UNIQUE','remote_subject_id','access_token_ciphertext','refresh_token_ciphertext','release460_forbidden_plaintext_columns','PRAGMA foreign_key_check')
for forbidden in (' state TEXT',' code TEXT',' code_verifier TEXT',' access_token TEXT',' refresh_token TEXT'):
    assert forbidden not in migration, f'plaintext OAuth persistence forbidden: {forbidden.strip()}'

# Identity must be verified before any newly exchanged token is encrypted/persisted.
identity_call=callback.index('verifyOAuthIdentity(contract,env,token.access_token)')
first_access_encrypt=callback.index('encryptOAuthSecret(env,token.access_token')
assert identity_call < first_access_encrypt, 'callback encrypts/persists token material before intended-account verification'
refresh_identity_call=connections.index('verifyOAuthIdentity(contract,env,token.access_token)')
refresh_access_encrypt=connections.index('encryptOAuthSecret(env,token.access_token')
assert refresh_identity_call < refresh_access_encrypt, 'refresh persists token material before intended-account verification'

# Diagnostics may inspect persisted subject presence/status but must not emit the provider subject value.
need(connections,'provider_subject_present:Boolean(row.remote_subject_id)','provider_subject_emitted:false')
assert 'provider_subject_values_emitted:false' in connections
assert 'remote_subject_id:row.remote_subject_id' not in connections
assert 'remote_subject_id: row.remote_subject_id' not in connections

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
print('RELEASE 460 SECURE OAUTH + IDENTITY + NON-EXECUTING PUBLICATION SOURCE + LOCAL D1 GATE: PASS')
