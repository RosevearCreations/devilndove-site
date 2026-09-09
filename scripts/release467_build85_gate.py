#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 85."""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def req(ok, message):
    if not ok:
        FAIL.append(message)


def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2600:]}")


acceptance = read('functions/api/_lib/socialOAuthAcceptance.js')
security = read('functions/api/_lib/oauthSecurity.js')
start = read('functions/api/admin/oauth-start.js')
callback = read('functions/api/social/oauth/_callback.js')
endpoint = read('functions/api/admin/social-oauth-acceptance.js')
client = read('public/js/admin-social-oauth-acceptance-v85.js')
page = read('admin/social-publishing/index.html')
css = read('css/admin-social-oauth-acceptance-v85.css')
queue = read('functions/api/admin/social-post-queue.js')
product_queue = read('functions/api/_lib/productSocialAutomation.js')
connections = read('functions/api/admin/oauth-connections.js')
provider_plan = read('functions/api/admin/provider-publication-plan.js')
release460_doc = read('docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md')
doc = read('docs/operations/RELEASE_467_BUILD_85_SOCIALS_OAUTH_ACCEPTANCE.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

# Pure Build 85 acceptance projection.
for token in (
    "SOCIAL_OAUTH_ACCEPTANCE_PROVIDERS = Object.freeze(['pinterest', 'meta', 'x', 'tiktok', 'youtube'])",
    "meta: Object.freeze(['facebook', 'instagram'])",
    "status = 'closed_no_provider_selected'",
    "status = 'production_closed'",
    "status = 'hold_external'",
    "status = 'configuration_required'",
    "status = 'oauth_authorization_required'",
    "status = 'draft_human_review_required'",
    "status = 'ready_for_controlled_publication_acceptance'",
    "approval === 'approved'",
    "post === 'ready'",
    "privacy === 'approved'",
    "privacy === 'no_private_media'",
    'read_only_projection: true',
    'd1_mutation: false',
    'r2_mutation: false',
    'provider_execution: false',
    'provider_publication: false',
    'automatic_publication: false',
    'production_oauth_authorization: false',
    'human_approval_required: true',
):
    req(token in acceptance, f'Build 85 pure acceptance contract missing token: {token}')
for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\(', r'\bXMLHttpRequest\b'):
    req(not re.search(forbidden, acceptance), f'Build 85 pure acceptance gained forbidden behavior: {forbidden}')

# Historical Release 460 switch remains unchanged; Build 85 adds a second selected-provider gate.
for token in (
    'export function oauthRemoteAuthorizationOpen',
    "mode === 'development-explicit' && isDevelopmentOAuthHost(host, env)",
    'export function oauthAcceptanceProvider',
    'SOCIAL_OAUTH_ACCEPTANCE_PROVIDER',
    'export function oauthSelectedProviderAuthorizationOpen',
    'selected === requested && oauthRemoteAuthorizationOpen(env, requestUrl)',
):
    req(token in security, f'Build 85 OAuth security boundary missing token: {token}')

# OAuth start must fail before state/PKCE creation unless both Development gates agree.
for token in (
    'oauthAcceptanceProvider', 'oauthSelectedProviderAuthorizationOpen',
    'oauth_provider_not_selected_for_acceptance',
    'SOCIAL_OAUTH_ACCEPTANCE_PROVIDER=<one of pinterest|meta|x|tiktok|youtube>',
    'selected_provider_acceptance:true',
):
    req(token in start, f'Build 85 OAuth start missing token: {token}')
try:
    req(start.index('if (!remoteOpen)') < start.index('const proof = await createStateAndPkce()'), 'OAuth start selected-provider guard must run before state/PKCE creation')
    req(start.index('if (!remoteOpen)') < start.index('INSERT INTO oauth_authorization_transactions'), 'OAuth start selected-provider guard must run before transaction persistence')
except ValueError:
    req(False, 'OAuth start guard/order markers missing')

# Callback must reject a non-selected provider before state claim/exchange.
for token in (
    'oauthAcceptanceProvider', 'oauthRemoteAuthorizationOpen', 'oauthSelectedProviderAuthorizationOpen',
    'selectedRemoteOpen', 'provider that is not selected',
    'verifyOAuthIdentity(contract,env,token.access_token)',
    'encryptOAuthSecret(env,token.access_token',
    'Provider publication remains closed',
):
    req(token in callback, f'Build 85 OAuth callback missing token: {token}')
try:
    guard = callback.index('if(!selectedRemoteOpen)')
    req(guard < callback.index('const stateHash=await sha256Base64Url(state)'), 'OAuth callback selected-provider guard must run before state lookup/claim')
    req(guard < callback.index('exchangeAuthorizationCode(contract,env'), 'OAuth callback selected-provider guard must run before token exchange')
    req(callback.index('verifyOAuthIdentity(contract,env,token.access_token)') < callback.index('encryptOAuthSecret(env,token.access_token'), 'Intended-account verification must occur before access-token persistence')
except ValueError:
    req(False, 'OAuth callback guard/order markers missing')

# Read-only acceptance endpoint: existing evidence only, no provider/network/DML authority.
for token in (
    'getAdminUserFromRequest', 'social_post_queue', 'oauth_provider_connections',
    'deriveSocialOAuthAcceptance', 'provider_publication_allowed: false',
    'provider_execution_allowed: false', 'automatic_publication_allowed: false',
    'provider_contacted: false', 'secret_values_emitted: false',
    'provider_subject_values_emitted: false', 'production_authorization_open: false',
    'connected_expiry_unknown', 'start_authorization_available', 'publication_boundary', 'accepted: false',
):
    req(token in endpoint, f'Build 85 read-only acceptance endpoint missing token: {token}')
req('fetch(' not in endpoint, 'Build 85 acceptance endpoint must not contact a provider')
req('decryptOAuthSecret' not in endpoint, 'Build 85 acceptance endpoint must not read/decrypt token material')
req('onRequestPost' not in endpoint, 'Build 85 acceptance evidence endpoint must expose no POST handler')
for forbidden in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in endpoint.upper(), f'Build 85 acceptance endpoint contains forbidden DML/DDL: {forbidden}')

# Browser panel is evidence/review-first and has no publication lane.
for token in (
    "'/api/admin/social-oauth-acceptance'", 'socialOAuthAcceptanceMount',
    'Controlled Social OAuth Acceptance', 'Begin ${esc(provider)} OAuth acceptance',
    'Provider publication remains closed', 'Open human review queue',
    'Production OAuth is closed',
):
    req(token in client, f'Build 85 browser panel missing token: {token}')
req("method: 'POST'" not in client and 'method:"POST"' not in client, 'Build 85 browser acceptance panel must not create a POST lane')
req('publish_platforms' not in client and 'Publish' not in client, 'Build 85 browser acceptance panel must expose no provider Publish action')
req('setInterval(' not in client, 'Build 85 browser acceptance panel must not poll')

req('id="socialOAuthAcceptanceMount"' in page, 'Build 85 Social Publishing mount missing')
req('/css/admin-social-oauth-acceptance-v85.css' in page, 'Build 85 CSS not loaded')
req('/public/js/admin-social-oauth-acceptance-v85.js' in page, 'Build 85 browser layer not loaded')
req('Build 85 provider prerequisites' in page, 'Build 85 Social Publishing authority label missing')
req('still provides no provider Publish action' in page, 'Build 85 page must state provider Publish remains unavailable')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Social Publishing page must retain exactly one H1')

for token in (
    '.social-connections-panel #testMetaConnections{display:none!important}',
    '.social-oauth-v85-summary', '.social-oauth-v85-checks',
    '@media(max-width:900px)', '@media(max-width:560px)',
):
    req(token in css, f'Build 85 responsive/current-authority CSS missing token: {token}')

# Existing human queue and secure connection authorities are preserved and remote lifecycle is selected-provider scoped.
for token in ('approval_status', 'post_status', 'privacy_status', 'approved_for_public_post', 'publish_platforms'):
    req(token in queue, f'Existing social queue authority unexpectedly lost token: {token}')
for token in ('approval_status', 'post_status', 'privacy_status', 'approved_for_public_post', "'needs_review', 'draft'", "'review_first'"):
    req(token in product_queue, f'Product-to-social review-first authority unexpectedly lost token: {token}')
for token in (
    'provider_subject_emitted:false', "token_material_present:'redacted'", 'intended_account_verification',
    'refreshOAuthToken', 'revokeOAuthToken', 'oauthSelectedProviderAuthorizationOpen(env,request.url,contract.key)',
    'oauth_provider_not_selected_for_acceptance', 'closed_by_selected_provider_boundary',
):
    req(token in connections, f'Existing/Build 85 secure OAuth connection authority missing token: {token}')
try:
    refresh_guard = connections.index("if(!oauthSelectedProviderAuthorizationOpen(env,request.url,contract.key))")
    req(refresh_guard < connections.index('decryptOAuthSecret(env,row.refresh_token_ciphertext'), 'OAuth refresh must fail before refresh-token decryption for a non-selected provider')
except ValueError:
    req(False, 'OAuth refresh selected-provider guard/order markers missing')
for token in ('provider_execution: false', 'provider_publication: false', 'network_calls_allowed: false', 'production_mutation: false'):
    req(token in provider_plan, f'Existing non-executing publication planner unexpectedly lost token: {token}')

for token in (
    'AES-GCM', 'state is random and persisted only as a SHA-256 hash', 'intended provider account',
    'Provider publication and provider execution are closed', 'legacy provider emitters',
):
    req(token.lower() in release460_doc.lower(), f'Release 460 OAuth authority doc missing preserved token: {token}')

for token in (
    'eb71a3af25cfc17eb9c94917236343babbff64a9',
    'SOCIAL_OAUTH_ACCEPTANCE_PROVIDER', 'OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit',
    'intended provider identity', 'explicit human draft approval', 'ready for a later controlled publication acceptance',
    'Production OAuth authorization', 'provider publication', 'schema-neutral',
    '0001_release464_migration_authority.sql', '0004_release465_storefront_quality.sql',
    'Build 86 — I.T. Operations & Self-Diagnostics',
):
    req(token.lower() in doc.lower(), f'Build 85 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 85 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 85 must remain schema-neutral')
req("run_current_contract('scripts/release467_build85_gate.py', 'Release 467 Build 85')" in provenance, 'Current System Gate does not chain Build 85')

for path in (
    'functions/api/_lib/socialOAuthAcceptance.js',
    'functions/api/_lib/oauthSecurity.js',
    'functions/api/admin/oauth-start.js',
    'functions/api/social/oauth/_callback.js',
    'functions/api/admin/oauth-connections.js',
    'functions/api/admin/social-oauth-acceptance.js',
    'public/js/admin-social-oauth-acceptance-v85.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')
run(['node', 'scripts/release467_build85_social_oauth_acceptance_runtime_test.mjs'], 'Build 85 runtime proof')
run(['node', 'scripts/release460_oauth_crypto_proof.mjs'], 'carried Release 460 OAuth crypto proof')
run(['node', 'scripts/release460_provider_contract_mock_proof.mjs'], 'carried Release 460 provider-contract mock proof')
run(['node', 'scripts/release460_publish_contract_mock_proof.mjs'], 'carried Release 460 non-executing publication mock proof')
run(['python3', 'scripts/release467_build84_gate.py'], 'carried Build 84 boundary')

if FAIL:
    print('RELEASE 467 BUILD 85 SOCIALS & OAUTH ACCEPTANCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 85 SOCIALS & OAUTH ACCEPTANCE: PASS')
print('Selected provider: ONE / DEVELOPMENT ONLY')
print('Intended-account verification: REQUIRED BEFORE TOKEN PERSISTENCE')
print('Human draft approval: REQUIRED')
print('Provider / automatic publication: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
