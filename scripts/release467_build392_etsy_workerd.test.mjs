import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  getOAuthContract,buildAuthorizationUrl,exchangeAuthorizationCode,
  verifyOAuthIdentity,discoverEtsyShop,refreshOAuthToken,revokeOAuthToken
} from '../functions/api/_lib/oauthProviders.js';

const etsy=getOAuthContract('etsy');
const env={ETSY_API_KEYSTRING:'dummy-key',ETSY_SHARED_SECRET:'dummy-secret',
 ETSY_REDIRECT_URI:'https://devilndove.com/api/social/oauth/etsy/callback',ETSY_EXPECTED_USER_ID:'111'};
const token='111.dummy-access-token';
const workersFetch=(reply)=>async(url,opts)=>{
 assert.equal(opts.redirect,'manual','Cloudflare workerd rejects redirect:error');
 assert.ok(String(url).startsWith('https://'),'only HTTPS provider endpoints');
 return reply(url,opts);
};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
test('Etsy exact registered callback and PKCE contract unchanged',()=>{
 const url=new URL(buildAuthorizationUrl(etsy,env,{state:'dummy-state',challenge:'dummy-challenge'}));
 assert.equal(url.searchParams.get('redirect_uri'),env.ETSY_REDIRECT_URI);
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.equal(url.searchParams.get('state'),'dummy-state');
});
test('Cloudflare-compatible Etsy token exchange uses manual mode and exact callback',async()=>{
 let calls=0;
 const fetchImpl=workersFetch((url,opts)=>{
  calls++;
  assert.equal(url,'https://api.etsy.com/v3/public/oauth/token');
  const body=new URLSearchParams(opts.body);
  assert.equal(body.get('redirect_uri'),env.ETSY_REDIRECT_URI);
  assert.equal(body.get('grant_type'),'authorization_code');
  assert.equal(body.get('code_verifier'),'dummy-verifier');
  assert.equal(body.get('client_id'),'dummy-key');
  return response({access_token:token,token_type:'Bearer',expires_in:3600});
 });
 const result=await exchangeAuthorizationCode(etsy,env,{code:'dummy-authorization-code',verifier:'dummy-verifier'},fetchImpl);
 assert.equal(result.access_token,token);assert.equal(calls,1);
});
test('Etsy code exchange never follows a 302 or reveals token in a redirect',async()=>{
 let calls=0;
 await assert.rejects(()=>exchangeAuthorizationCode(etsy,env,{code:'dummy',verifier:'dummy'},workersFetch(()=>{
  calls++;return new Response('',{status:302,headers:{location:'https://not-etsy.example/collect'}});
 })),/oauth_provider_redirect_blocked/);
 assert.equal(calls,1,'no redirect follow and no token retry');
});
test('Etsy token refresh cannot follow provider redirects',async()=>{
 await assert.rejects(()=>refreshOAuthToken(etsy,env,'dummy-refresh',workersFetch(()=>new Response(null,{status:307,headers:{location:'https://bad.example/'}}))),/oauth_provider_redirect_blocked/);
});
test('Etsy identity lookup is manual-only and response redirect is blocked',async()=>{
 const fetchImpl=workersFetch((url,opts)=>{
  assert.equal(opts.method,'GET');assert.ok(String(url).endsWith('/users/me'));
  return response({user_id:111});
 });
 const result=await verifyOAuthIdentity(etsy,env,'opaque-token',fetchImpl);
 assert.equal(result.remoteSubject,'111');
 await assert.rejects(()=>verifyOAuthIdentity(etsy,env,'opaque-token',workersFetch(()=>new Response(null,{status:302,headers:{location:'https://bad.example/'}}))),/oauth_provider_redirect_blocked/);
});
test('Etsy shop lookup manual-only and 3xx blocked',async()=>{
 const good=workersFetch((url,opts)=>{
  assert.ok(String(url).endsWith('/users/111/shops'));assert.equal(opts.redirect,'manual');
  return response({shop_id:987,user_id:111,shop_name:'Dummy Shop'});
 });
 const result=await discoverEtsyShop(etsy,env,token,'111',good);
 assert.equal(result.shop_id,'987');
 await assert.rejects(()=>discoverEtsyShop(etsy,env,token,'111',workersFetch(()=>new Response(null,{status:301,headers:{location:'https://bad.example/'}}))),/oauth_provider_redirect_blocked/);
});
test('Revoke path also rejects provider redirect with no secrets forwarded',async()=>{
 const sample={key:'dummy',clientIdEnv:'ETSY_API_KEYSTRING',clientSecretEnv:'ETSY_SHARED_SECRET',redirectEnv:'ETSY_REDIRECT_URI',
  revokeEndpoint:'https://api.etsy.com/test/revoke',tokenAuth:'body_secret'};
 await assert.rejects(()=>revokeOAuthToken(sample,env,'private-test',workersFetch(()=>new Response(null,{status:302,headers:{location:'https://bad.example/'}}))),/oauth_provider_redirect_blocked/);
});
test('No OAuth runtime request uses unsupported redirect:error',()=>{
 const source=fs.readFileSync(new URL('../functions/api/_lib/oauthProviders.js',import.meta.url),'utf8');
 assert.ok(!/redirect\s*:\s*['"]error['"]/.test(source));
 assert.equal((source.match(/blockOAuthRedirect\(response,'/g)||[]).length,4);
});
