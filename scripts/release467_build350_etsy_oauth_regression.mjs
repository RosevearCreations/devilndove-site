import assert from 'node:assert/strict';
import fs from 'node:fs';
import { etsyDevelopmentAuthorizationOpen } from '../functions/api/_lib/oauthSecurity.js';
import { getOAuthContract, providerConfiguration, verifyOAuthIdentity, discoverEtsyShop } from '../functions/api/_lib/oauthProviders.js';

const env={DND_ENVIRONMENT:'development',ETSY_API_KEYSTRING:'mock-key',ETSY_SHARED_SECRET:'mock-secret',ETSY_REDIRECT_URI:'https://dev.devilndove-site.pages.dev/api/social/oauth/etsy/callback'};
const contract=getOAuthContract('etsy');
assert.deepEqual(contract.scopes,['shops_r','listings_r','listings_w']);
assert.equal(providerConfiguration(contract,env).configured,true);
assert.equal(etsyDevelopmentAuthorizationOpen(env,'https://dev.devilndove-site.pages.dev/api/admin/oauth-start?provider=etsy'),true);
assert.equal(etsyDevelopmentAuthorizationOpen({...env,DND_ENVIRONMENT:'production'},'https://devilndove.com/api/admin/oauth-start?provider=etsy'),false);
const fetchMock=async(url)=>{
  const u=String(url);
  if(u.endsWith('/users/me')) return new Response(JSON.stringify({user_id:12345678}),{status:200,headers:{'content-type':'application/json'}});
  if(u.endsWith('/users/12345678/shops')) return new Response(JSON.stringify({shop_id:87654321,user_id:12345678,shop_name:'Mock Devil n Dove',currency_code:'CAD',listing_active_count:0,is_vacation:false}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error('unexpected mock URL '+u);
};
const identity=await verifyOAuthIdentity(contract,env,'12345678.mock-access-token',fetchMock);
assert.equal(identity.remoteSubject,'12345678');
const shop=await discoverEtsyShop(contract,env,'12345678.mock-access-token',identity.remoteSubject,fetchMock);
assert.equal(shop.shop_id,'87654321');
assert.equal(shop.user_id,'12345678');
assert.equal(shop.shop_name,'Mock Devil n Dove');
for(const path of ['functions/api/social/oauth/_callback.js','functions/api/admin/etsy-oauth-acceptance.js']){
  const src=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.equal(/createDraftListing|\/shops\/\$\{[^}]+\}\/listings[^\n]*method:\s*['"]POST/i.test(src),false,'OAuth acceptance must not create Etsy listings');
}
console.log('BUILD350_ETSY_OAUTH_HARDENING=GREEN');
console.log('ETSY_SHOP_ID_AUTO_DISCOVERY=GREEN');
console.log('ETSY_LISTING_WRITES=LOCKED');
