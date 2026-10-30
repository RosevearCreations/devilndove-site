import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {etsyConnectionRecovery528,verifyEtsyOptionsAfterExplicitClick528} from '../public/js/etsy-owner-diagnostics-503.mjs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('Build 528 allows one user-initiated token refresh only for the Etsy access-expiry gate',()=>{
  const expired=etsyConnectionRecovery528({code:'etsy_connection_not_ready',blockers:['oauth_access_expired_or_near_expiry']});
  assert.equal(expired.refresh_allowed,true);
  assert.equal(expired.reconnect_required,false);
  assert.match(expired.reason,/expired|expire/i);
  assert.equal(etsyConnectionRecovery528({code:'etsy_connection_not_ready',blockers:['etsy_not_connected','oauth_access_expired_or_near_expiry']}).refresh_allowed,true);
  for(const blockers of [
    ['etsy_not_connected'],['verified_shop_missing'],['etsy_api_credentials_missing','oauth_access_expired_or_near_expiry'],
    ['listings_w_missing','oauth_access_expired_or_near_expiry'],['shop_owner_mismatch','oauth_access_expired_or_near_expiry']]){
    const advice=etsyConnectionRecovery528({code:'etsy_connection_not_ready',blockers});
    assert.equal(advice.refresh_allowed,false,blockers.join(','));
    assert.equal(advice.reconnect_required,true);
  }
  assert.equal(etsyConnectionRecovery528({code:'etsy_draft_preflight_unavailable'}).refresh_allowed,false);
});

test('Build 528 never repeats a draft write and retries the setup read only after one verified OAuth refresh',async()=>{
  const expired=Object.assign(Error('expired'),{code:'etsy_connection_not_ready',blockers:['oauth_access_expired_or_near_expiry']});
  const steps=[];let notices=0;
  const data=await verifyEtsyOptionsAfterExplicitClick528(async(path,body)=>{
    steps.push({path,action:body.action});
    if(steps.length===1)throw expired;
    if(body.action==='refresh')return {refreshed:true};
    return {ok:true,live_connection_verified:true,options:{taxonomy:[{id:1,name:'Soap'}]}};
  },88,()=>notices++);
  assert.equal(data.live_connection_verified,true);
  assert.deepEqual(steps.map(step=>step.action),['test_connection','refresh','test_connection']);
  assert.equal(notices,1);
  for(const code of ['etsy_connection_not_ready','etsy_draft_preflight_unavailable']){
    const calls=[];
    await assert.rejects(verifyEtsyOptionsAfterExplicitClick528(async(path,body)=>{
      calls.push(body.action);
      throw Object.assign(Error('blocked'),{code,blockers:['verified_shop_missing']});
    },88),/blocked/);
    assert.deepEqual(calls,['test_connection']);
  }
  let requests=0;
  await assert.rejects(verifyEtsyOptionsAfterExplicitClick528(async(path,body)=>{
    requests++;
    if(requests===1)throw expired;
    if(body.action==='refresh')return {refreshed:false};
    throw Error('Unreachable third call');
  },88),/not confirmed/);
  assert.equal(requests,2);
});

test('Build 528 loads options by explicit owner action and never performs a hidden connection POST on tab opening',()=>{
  const code=read('public/js/admin-product-etsy-package-v500.mjs');
  assert.match(code,/verifyEtsyOptionsAfterExplicitClick528\(api,id/);
  assert.match(code,/No hidden OAuth/);
  const opened=code.match(/document\.addEventListener\('dd:editor-tab-opened'[\s\S]*?\n  \}\);/);
  assert.ok(opened,'Etsy tab listener should exist');
  assert.doesNotMatch(opened[0],/await loadOptions\(/);
  assert.match(code,/failure\.blockers=Array\.isArray/);
  const helper=read('public/js/etsy-owner-diagnostics-503.mjs');
  assert.match(helper,/if\(!etsyConnectionRecovery528\(error\)\.refresh_allowed\)throw error/);
  assert.doesNotMatch(code,/setInterval\(|setTimeout\(.*loadOptions|retryCreateDraft/);
});

test('Build 528 shows an actionable reconnection link and responsive fields without making up shop choices',()=>{
  const html=read('admin/product-editor/index.html'),css=read('css/admin-product-editor-528.css');
  assert.match(html,/Devil n Dove • Build (?:52[89]|53[012])/);
  assert.match(html,/admin-product-editor-528\.css\?v=528/);
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=528/);
  assert.match(html,/id="dd528Reconnect"[^>]*href="\/admin\/it-integrations\/#etsy-oauth-acceptance"[^>]*hidden/);
  for(const id of ['dd500Category','dd500Shipping','dd500Processing'])assert.match(html,new RegExp(`id="${id}" disabled`));
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/box-sizing:border-box/);
  assert.match(css,/#dd528Reconnect\[hidden\]/);
});

test('Build 528 leaves the Etsy 409 decision structured and blocks provider activity before readiness',()=>{
  const server=read('functions/api/admin/product-etsy-draft.js');
  assert.match(server,/connectionIssues\.length\)return respond\(\{ok:false,code:'etsy_connection_not_ready',blockers:connectionIssues/);
  assert.match(server,/error:'Etsy connection is not usable yet/);
  assert.match(server,/if\(action==='test_connection'\)/);
  assert.match(server,/remote_request_type:'GET_ONLY'/);
  const photo=read('functions/api/admin/product-etsy-images.js');
  assert.match(photo,/confirmedEtsyImageReadback497/);
});
