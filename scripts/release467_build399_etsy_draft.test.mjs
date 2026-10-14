import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {positive,safeSettings,connectionBlockers,localDraftReview,collectTaxonomy,remoteDraftForm} from '../functions/api/_lib/etsyDraftTrial399.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const file=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const now=Date.parse('2026-10-14T12:00:00Z'),later=new Date(now+3600e3).toISOString();
const conn={connection_status:'connected',remote_subject_id:'101',access_token_ciphertext:'encrypted',scopes_json:'["shops_r","listings_w","listings_r"]',access_expires_at:later};
const shop={owner_user_id:101,shop_id:57459161,acceptance_status:'connected_verified',currency_code:'CAD'};
const env={ETSY_API_KEYSTRING:'public-test',ETSY_SHARED_SECRET:'test-secret'};
const product={product_id:54,name:'Bar Soap Sweet Orange',price_cents:900,currency:'CAD',inventory_quantity:3};
const payload={title:'Bar Soap Sweet Orange',description:'Citrus bar soap',price_cents:900,currency:'CAD',quantity:3,local_draft_only:true};
const draft={id:'abb92443-4c25-498b-a34f-28aad5300f22',channel_key:'etsy',product_id:'54',payload_json:JSON.stringify(payload),status:'draft',updated_at:'2026-10-14 12:00:00',external_reference:null};
const settings={action:'create_unpublished_etsy_draft',product_id:54,draft_id:draft.id,
 request_key:'c650d018-b1e2-42d7-aa1f-cd56ebee3d20',taxonomy_id:123,shipping_profile_id:456,
 readiness_state_id:789,who_made:'i_did',when_made:'2020_2026',is_supply:false,
 fingerprint:'local|54|900|3|57459161|expiry|date|none',
 confirmed_unpublished_draft_only:true,confirmed_no_auto_retry:true};
test('scope and expiration are hard prerequisites; no automatic token refresh',()=>{
 assert.deepEqual(connectionBlockers(conn,shop,env,now),[]);
 assert.ok(connectionBlockers({...conn,scopes_json:'["shops_r"]'},shop,env,now).includes('listings_w_missing'));
 assert.ok(connectionBlockers({...conn,access_expires_at:new Date(now).toISOString()},shop,env,now).includes('oauth_access_expired_or_near_expiry'));
 assert.ok(connectionBlockers({...conn,remote_subject_id:'other'},shop,env,now).includes('shop_owner_mismatch'));
 assert.ok(connectionBlockers(conn,{...shop,currency_code:'USD'},env,now).includes('etsy_shop_currency_not_confirmed_CAD'));
});
test('review uses saved local draft and original canonical Product price',()=>{
 const r=localDraftReview(product,draft,shop,conn);
 assert.deepEqual(r.blockers,[]);
 assert.equal(r.details.price_cents,900);assert.equal(r.details.quantity,3);
 assert.ok(r.fingerprint.includes(String(shop.shop_id)));
 assert.ok(localDraftReview({...product,price_cents:0},draft,shop,conn).blockers.includes('valid_positive_cad_price_required'));
 assert.ok(localDraftReview({...product,inventory_quantity:1},draft,shop,conn).blockers.includes('inventory_changed_or_unavailable'));
 assert.ok(localDraftReview(product,{...draft,external_reference:'9981'},shop,conn).blockers.includes('already_linked_to_remote_etsy'));
});
test('physical listing settings require explicit one-draft / no-retry confirmation and Etsy fields',()=>{
 assert.equal(safeSettings(settings)?.readiness_state_id,789);
 for(const patch of [{confirmed_unpublished_draft_only:false},{confirmed_no_auto_retry:false},
 {shipping_profile_id:0},{taxonomy_id:0},{readiness_state_id:0},{who_made:'invalid'},
 {when_made:'soon'},{request_key:'bad'},{is_supply:'false'}]){
  assert.equal(safeSettings({...settings,...patch}),null,JSON.stringify(patch));
 }
});
test('remote draft request is exact physical form, no active state and no publishing',()=>{
 const x=remoteDraftForm(settings,localDraftReview(product,draft,shop,conn));
 assert.equal(x.get('price'),'9.00');assert.equal(x.get('quantity'),'3');
 for(const k of ['who_made','when_made','taxonomy_id','shipping_profile_id','readiness_state_id','is_supply','type'])
 assert.ok(x.has(k),k);
 assert.equal(x.get('type'),'physical');assert.equal(x.has('state'),false);
 assert.equal(x.has('request_key'),false);assert.equal(x.has('access_token'),false);
});
test('Soap taxonomy options originate from Etsy node hierarchy',()=>{
 const tree=[{id:1,name:'Bath & Beauty',children:[{id:777,name:'Bar Soap',children:[]},{id:778,name:'Accessories'}]}];
 assert.deepEqual(collectTaxonomy(tree),[{id:777,name:'Bar Soap',level:0}]);
 assert.deepEqual(collectTaxonomy([]),[]);
});
test('route is centrally guarded and GET only uses local D1 evidence',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-remote-draft-trial'),MODULE_KEYS.STOREFRONT);
 const src=file('functions/api/admin/etsy-remote-draft-trial.js');
 const get=src.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/fetch\(|decryptOAuthSecret|\.run\(|INSERT INTO/);
 assert.match(src,/verifiedAdminFromModule/);assert.match(src,/providerOptions/);
});
test('durable claim is before exactly one remote Etsy POST and no auto retry',()=>{
 const src=file('functions/api/admin/etsy-remote-draft-trial.js');
 assert.match(src,/INSERT INTO admin_action_audit/);
 assert.match(src,/WHERE NOT EXISTS \(SELECT 1 FROM admin_action_audit/);
 assert.match(src,/draft_trial_claim_unconfirmed/);
 assert.match(src,/claimed\?\.meta\?\.changes/);
 const claim=src.indexOf('const claimed=await');
 const post=src.indexOf("method:'POST',",claim);
 assert.ok(claim>0&&post>claim,'No remote POST may happen before audit claim');
 assert.match(src,/response\.status>=300&&response\.status<400/);
 assert.match(src,/remote\?\.state/);
 assert.match(src,/String\(remote\.listing_id\)/);
 assert.match(src,/etsy_draft_attempt_outcome_unknown/);
 assert.match(src,/external_reference IS NULL/); // do not overwrite existing remote binding
 assert.doesNotMatch(src,/method:'PATCH'|method:'DELETE'|state.*active|publishListing\(/i);
});
test('UI requires operator confirmation and never sends provider requests directly',()=>{
 const html=file('admin/it-integrations/index.html'),ui=file('public/js/admin-etsy-remote-draft-v399.js');
 assert.match(html,/id="etsy399ConfirmDraft"/);assert.match(html,/id="etsy399ConfirmRetry"/);
 assert.match(ui,/confirmed_unpublished_draft_only:true/);
 assert.match(ui,/confirmed_no_auto_retry:true/);
 assert.match(ui,/globalThis\.crypto\?\.randomUUID/);
 assert.match(ui,/ids\.create\.disabled=true/);
 assert.match(ui,/load_remote_options/);
 assert.doesNotMatch(ui,/fetch\('https:\/\/api\.etsy\.com/);
});
