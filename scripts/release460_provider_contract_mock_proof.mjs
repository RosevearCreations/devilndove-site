// Release 460 — provider-contract mock proof. No real provider network calls or credentials.
import assert from 'node:assert/strict';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getOAuthContract,
  listOAuthContracts,
  refreshOAuthToken,
  revokeOAuthToken
} from '../functions/api/_lib/oauthProviders.js';

const ENV = {
  ETSY_API_KEYSTRING: 'mock-etsy-id', ETSY_SHARED_SECRET: 'mock-etsy-secret', ETSY_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/etsy/callback',
  PINTEREST_APP_ID: 'mock-pinterest-id', PINTEREST_APP_SECRET: 'mock-pinterest-secret', PINTEREST_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/pinterest/callback',
  META_APP_ID: 'mock-meta-id', META_APP_SECRET: 'mock-meta-secret', META_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/meta/callback',
  X_CLIENT_ID: 'mock-x-id', X_CLIENT_SECRET: 'mock-x-secret', X_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/x/callback',
  TIKTOK_CLIENT_KEY: 'mock-tiktok-id', TIKTOK_CLIENT_SECRET: 'mock-tiktok-secret', TIKTOK_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/tiktok/callback',
  YOUTUBE_CLIENT_ID: 'mock-youtube-id', YOUTUBE_CLIENT_SECRET: 'mock-youtube-secret', YOUTUBE_REDIRECT_URI: 'https://devilndove-site-dev.pages.dev/api/social/oauth/youtube/callback'
};

function response(status, payload = {}) {
  return { ok: status >= 200 && status < 300, status, async json() { return payload; } };
}

const contracts = listOAuthContracts();
assert.deepEqual(contracts.map((x) => x.key), ['etsy','pinterest','meta','x','tiktok','youtube']);
for (const contract of contracts) {
  const serialized = JSON.stringify(contract);
  assert.equal(serialized.includes('mock-'), false, 'diagnostic contract leaked a mock credential');
  assert.equal(serialized.includes('client_secret_value'), false);
}

for (const key of ['etsy','pinterest','meta','x','tiktok','youtube']) {
  const contract = getOAuthContract(key);
  assert.ok(contract, `missing ${key} contract`);
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
  assert.match(revokeRequest.options.body.toString(), /(token=mock-access|token=mock-access)/);
}

for (const key of ['etsy','pinterest','meta']) {
  const contract = getOAuthContract(key);
  let contacted = false;
  const result = await revokeOAuthToken(contract, ENV, 'mock-access', async () => { contacted = true; return response(500, {}); });
  assert.equal(result.supported, false);
  assert.equal(contacted, false, `${key} unsupported revoke unexpectedly contacted a provider`);
}

console.log('RELEASE 460 PROVIDER CONTRACT MOCK PROOF: PASS');
