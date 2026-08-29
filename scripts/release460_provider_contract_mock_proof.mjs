// Release 460 — provider-contract and intended-account mock proof. No real provider network calls or credentials.
import assert from 'node:assert/strict';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getOAuthContract,
  listOAuthContracts,
  providerIdentityExpectation,
  providerIdentityStatus,
  refreshOAuthToken,
  revokeOAuthToken,
  verifyOAuthIdentity
} from '../functions/api/_lib/oauthProviders.js';

const ENV = {
  ETSY_API_KEYSTRING: 'mock-etsy-id', ETSY_SHARED_SECRET: 'mock-etsy-secret', ETSY_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/etsy/callback', ETSY_EXPECTED_USER_ID: '1001', ETSY_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove Etsy',
  PINTEREST_APP_ID: 'mock-pinterest-id', PINTEREST_APP_SECRET: 'mock-pinterest-secret', PINTEREST_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/pinterest/callback', PINTEREST_EXPECTED_USERNAME: 'DevilNDovePins', PINTEREST_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove Pinterest',
  META_APP_ID: 'mock-meta-id', META_APP_SECRET: 'mock-meta-secret', META_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/meta/callback', META_EXPECTED_PAGE_ID: '3001', META_EXPECTED_INSTAGRAM_BUSINESS_ID: '3002', META_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove Meta',
  X_CLIENT_ID: 'mock-x-id', X_CLIENT_SECRET: 'mock-x-secret', X_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/x/callback', X_EXPECTED_USER_ID: '4001', X_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove X',
  TIKTOK_CLIENT_KEY: 'mock-tiktok-id', TIKTOK_CLIENT_SECRET: 'mock-tiktok-secret', TIKTOK_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/tiktok/callback', TIKTOK_EXPECTED_OPEN_ID: '5001', TIKTOK_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove TikTok',
  YOUTUBE_CLIENT_ID: 'mock-youtube-id', YOUTUBE_CLIENT_SECRET: 'mock-youtube-secret', YOUTUBE_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/youtube/callback', YOUTUBE_EXPECTED_CHANNEL_ID: '6001', YOUTUBE_EXPECTED_ACCOUNT_LABEL: 'Devil n Dove YouTube'
};

const EXPECTED = { etsy: '1001', pinterest: 'DevilNDovePins', meta: '3001', x: '4001', tiktok: '5001', youtube: '6001' };
const LABELS = { etsy: 'Devil n Dove Etsy', pinterest: 'Devil n Dove Pinterest', meta: 'Devil n Dove Meta', x: 'Devil n Dove X', tiktok: 'Devil n Dove TikTok', youtube: 'Devil n Dove YouTube' };
function response(status, payload = {}) {
  return { ok: status >= 200 && status < 300, status, async json() { return payload; } };
}
function identityPayload(key) {
  if (key === 'etsy') return { user_id: 1001, first_name: 'Devil' };
  if (key === 'pinterest') return { username: 'devilndovepins', account_type: 'BUSINESS' };
  if (key === 'meta') return { data: [{ id: '3001', name: 'Devil n Dove', instagram_business_account: { id: '3002' } }] };
  if (key === 'x') return { data: { id: '4001', name: 'Devil n Dove', username: 'devilndove' } };
  if (key === 'tiktok') return { data: { user: { open_id: '5001', union_id: 'mock-union', display_name: 'Devil n Dove' } }, error: { code: 'ok' } };
  if (key === 'youtube') return { items: [{ id: '6001', snippet: { title: 'Devil n Dove' } }] };
  return {};
}

const contracts = listOAuthContracts();
assert.deepEqual(contracts.map((x) => x.key), ['etsy','pinterest','meta','x','tiktok','youtube']);
for (const contract of contracts) {
  const serialized = JSON.stringify(contract);
  assert.equal(serialized.includes('mock-'), false, 'diagnostic contract leaked a mock credential');
  assert.equal(serialized.includes(EXPECTED[contract.key]), false, 'diagnostic contract leaked an intended subject value');
  assert.ok(contract.intended_account_reference, `${contract.key} missing intended-account reference`);
  assert.ok(contract.intended_account_label_reference, `${contract.key} missing account-label reference`);
  assert.equal(contract.identity_lookup, 'provider_api_after_token_exchange');
}
assert.ok(getOAuthContract('pinterest').scopes.includes('user_accounts:read'));
assert.ok(getOAuthContract('youtube').scopes.includes('https://www.googleapis.com/auth/youtube.readonly'));

for (const key of ['etsy','pinterest','meta','x','tiktok','youtube']) {
  const contract = getOAuthContract(key);
  assert.ok(contract, `missing ${key} contract`);
  const expectation = providerIdentityExpectation(contract, ENV);
  assert.equal(expectation.configured, true);
  assert.equal(expectation.lookup_configuration_ready, true);
  assert.equal(expectation.account_label, LABELS[key]);
  assert.equal(JSON.stringify(expectation).includes(EXPECTED[key]), false, `${key} expectation leaked subject value`);

  const authorization = new URL(buildAuthorizationUrl(contract, ENV, { state: 'mock-state', challenge: 'mock-challenge' }));
  assert.equal(authorization.searchParams.get('state'), 'mock-state');
  if (contract.pkce === 'required' || contract.pkce === 'supported') {
    assert.equal(authorization.searchParams.get('code_challenge'), 'mock-challenge');
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
  } else {
    assert.equal(authorization.searchParams.has('code_challenge'), false);
  }

  let exchangeRequest = null;
  const token = await exchangeAuthorizationCode(contract, ENV, { code: 'mock-code', verifier: 'mock-verifier' }, async (url, options) => {
    exchangeRequest = { url, options };
    return response(200, { access_token: `${key}-access`, refresh_token: `${key}-refresh`, token_type: 'Bearer', expires_in: 3600 });
  });
  assert.equal(token.access_token, `${key}-access`);
  assert.equal(exchangeRequest.url, contract.tokenEndpoint);
  assert.equal(exchangeRequest.options.method, 'POST');
  assert.equal(exchangeRequest.options.redirect, 'error');
  const exchangeBody = exchangeRequest.options.body.toString();
  assert.match(exchangeBody, /grant_type=authorization_code/);
  assert.match(exchangeBody, /code=mock-code/);
  if (contract.pkce === 'required' || contract.pkce === 'supported') assert.match(exchangeBody, /code_verifier=mock-verifier/);

  let identityRequest = null;
  const identity = await verifyOAuthIdentity(contract, ENV, token.access_token, async (url, options) => {
    identityRequest = { url, options };
    return response(200, identityPayload(key));
  });
  assert.equal(identity.verified, true);
  assert.equal(identity.remoteSubject.toLowerCase(), EXPECTED[key].toLowerCase());
  assert.equal(identity.accountLabel, LABELS[key]);
  assert.equal(identityRequest.options.method, 'GET');
  assert.equal(identityRequest.options.redirect, 'error');
  assert.equal(identityRequest.options.headers.Authorization, `Bearer ${key}-access`);
  if (key === 'etsy') assert.equal(identityRequest.options.headers['x-api-key'], 'mock-etsy-id:mock-etsy-secret');
  if (key === 'pinterest') assert.equal(identityRequest.url, 'https://api.pinterest.com/v5/user_account');
  if (key === 'meta') assert.match(identityRequest.url, /graph\.facebook\.com\/me\/accounts/);
  if (key === 'x') assert.equal(identityRequest.url, 'https://api.x.com/2/users/me');
  if (key === 'tiktok') assert.match(identityRequest.url, /open\.tiktokapis\.com\/v2\/user\/info/);
  if (key === 'youtube') assert.match(identityRequest.url, /youtube\/v3\/channels\?part=snippet&mine=true/);

  const status = providerIdentityStatus(contract, ENV, identity.remoteSubject, 'connected');
  assert.equal(status.status, 'verified');
  assert.equal(JSON.stringify(status).includes(EXPECTED[key]), false, `${key} identity status leaked subject value`);

  let refreshRequest = null;
  const refreshed = await refreshOAuthToken(contract, ENV, 'mock-refresh', async (url, options) => {
    refreshRequest = { url, options };
    return response(200, { access_token: `${key}-new-access`, token_type: 'Bearer', expires_in: 1800 });
  });
  assert.equal(refreshed.access_token, `${key}-new-access`);
  assert.equal(refreshRequest.url, contract.tokenEndpoint);
  assert.match(refreshRequest.options.body.toString(), /grant_type=refresh_token/);
  assert.match(refreshRequest.options.body.toString(), /refresh_token=mock-refresh/);

  await assert.rejects(
    exchangeAuthorizationCode(contract, ENV, { code: 'bad-code', verifier: 'mock-verifier' }, async () => response(400, { error: 'invalid_grant', error_description: 'sensitive provider detail' })),
    (error) => error?.message === 'oauth_provider_token_exchange_failed' && error?.oauthProviderCode === 'invalid_grant' && !String(error?.message).includes('sensitive provider detail')
  );
}

// Intended account is mandatory before provider identity lookup can run.
{
  const env = { ...ENV }; delete env.X_EXPECTED_USER_ID;
  let contacted = false;
  await assert.rejects(
    verifyOAuthIdentity(getOAuthContract('x'), env, 'x-access', async () => { contacted = true; return response(200, identityPayload('x')); }),
    (error) => error?.message === 'oauth_intended_account_not_configured'
  );
  assert.equal(contacted, false);
}

// A provider returning the wrong account must fail closed without leaking either subject in the error.
{
  const env = { ...ENV, X_EXPECTED_USER_ID: 'expected-secret-subject' };
  await assert.rejects(
    verifyOAuthIdentity(getOAuthContract('x'), env, 'x-access', async () => response(200, { data: { id: 'actual-secret-subject' } })),
    (error) => error?.message === 'oauth_intended_account_mismatch' && !String(error?.message).includes('expected-secret-subject') && !String(error?.message).includes('actual-secret-subject')
  );
}

// Meta must match both the intended Page and, when configured, its linked Instagram business account.
{
  const env = { ...ENV, META_EXPECTED_INSTAGRAM_BUSINESS_ID: 'wrong-instagram-subject' };
  await assert.rejects(
    verifyOAuthIdentity(getOAuthContract('meta'), env, 'meta-access', async () => response(200, identityPayload('meta'))),
    (error) => error?.message === 'oauth_intended_account_mismatch' && !String(error?.message).includes('wrong-instagram-subject')
  );
}

// Provider lookup errors are reduced to a local diagnostic and never relay provider payload details.
await assert.rejects(
  verifyOAuthIdentity(getOAuthContract('youtube'), ENV, 'youtube-access', async () => response(503, { error: { message: 'provider-sensitive-identity-detail' } })),
  (error) => error?.message === 'oauth_provider_identity_failed' && error?.oauthStatus === 503 && !String(error?.message).includes('provider-sensitive-identity-detail')
);

for (const key of ['x','tiktok','youtube']) {
  const contract = getOAuthContract(key);
  let revokeRequest = null;
  const result = await revokeOAuthToken(contract, ENV, 'mock-access', async (url, options) => {
    revokeRequest = { url, options };
    return response(200, {});
  });
  assert.equal(result.supported, true);
  assert.equal(result.ok, true);
  assert.equal(revokeRequest.url, contract.revokeEndpoint);
  assert.equal(revokeRequest.options.method, 'POST');
  assert.equal(revokeRequest.options.redirect, 'error');
  assert.match(revokeRequest.options.body.toString(), /token=mock-access/);
}

for (const key of ['etsy','pinterest','meta']) {
  const contract = getOAuthContract(key);
  let contacted = false;
  const result = await revokeOAuthToken(contract, ENV, 'mock-access', async () => { contacted = true; return response(500, {}); });
  assert.equal(result.supported, false);
  assert.equal(contacted, false, `${key} unsupported revoke unexpectedly contacted a provider`);
}

console.log('RELEASE 460 PROVIDER CONTRACT + INTENDED ACCOUNT MOCK PROOF: PASS');
