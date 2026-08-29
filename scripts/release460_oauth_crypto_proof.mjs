import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

async function importSource(path){
  const source=await fs.readFile(path,'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const security=await importSource('functions/api/_lib/oauthSecurity.js');
const raw=crypto.getRandomValues(new Uint8Array(32));
const env={OAUTH_TOKEN_ENCRYPTION_KEY_V1:Buffer.from(raw).toString('base64url'),OAUTH_PROVIDER_AUTHORIZATION_MODE:'development-explicit'};

const proof=await security.createStateAndPkce();
assert.ok(proof.state.length>=43);
assert.ok(proof.verifier.length>=43&&proof.verifier.length<=128);
assert.equal(proof.challengeMethod,'S256');
assert.notEqual(proof.state,proof.stateHash);
assert.equal(proof.challenge,await security.sha256Base64Url(proof.verifier));

const secret='provider-token-release460-proof';
const cipher=await security.encryptOAuthSecret(env,secret,'oauth-token|x|access');
assert.ok(cipher.startsWith('v1.'));
assert.ok(!cipher.includes(secret));
assert.equal(await security.decryptOAuthSecret(env,cipher,'oauth-token|x|access'),secret);
await assert.rejects(()=>security.decryptOAuthSecret(env,cipher,'oauth-token|x|refresh'),/authentication_failed/);

const redacted=security.redactSensitive({access_token:'a',nested:{client_secret:'b',safe:'visible'},state:'c'});
assert.equal(redacted.access_token,'[REDACTED]');
assert.equal(redacted.nested.client_secret,'[REDACTED]');
assert.equal(redacted.nested.safe,'visible');
assert.equal(redacted.state,'[REDACTED]');
assert.equal(security.oauthRemoteAuthorizationOpen(env,'https://devilndove-site-dev.pages.dev/api/admin/oauth-start'),true);
assert.equal(security.oauthRemoteAuthorizationOpen(env,'https://devilndove-site.pages.dev/api/admin/oauth-start'),false);
assert.equal(security.oauthRemoteAuthorizationOpen({...env,OAUTH_PROVIDER_AUTHORIZATION_MODE:''},'https://devilndove-site-dev.pages.dev/'),false);
assert.equal(security.safeReturnPath('https://evil.example/'),'/admin/it-integrations/');

console.log('RELEASE 460 OAUTH CRYPTO PROOF: PASS');
