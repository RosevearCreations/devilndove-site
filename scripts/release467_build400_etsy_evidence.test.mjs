
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {toCents,verifyRemote} from '../functions/api/_lib/etsyListingEvidence400.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const claim={admin_action_audit_id:23},shop={shop_id:57459161},product={product_id:54};
const draft={channel_key:'etsy',product_id:'54',external_reference:null,payload_json:JSON.stringify({title:'Bar Soap Sweet Orange',price_cents:900,quantity:3})};
const listing={listing_id:12345,shop_id:57459161,state:'draft',title:'Bar Soap Sweet Orange',listing_type:'physical',quantity:3,price:{amount:900,divisor:100,currency_code:'CAD'}};
test('Money precision and CAD',()=>{assert.equal(toCents(listing.price),900);assert.equal(toCents({...listing.price,currency_code:'USD'}),null);});
test('Only exact owner draft, claimed, unpublished, same title, price, qty is verified',()=>{
 assert.equal(verifyRemote(listing,shop,product,draft,claim).verified,true);
 for(const [item,code] of [
 [{...listing,state:'active'},'not_unpublished_draft'],
 [{...listing,shop_id:1},'shop_mismatch'],
 [{...listing,title:'Other'},'title_mismatch'],
 [{...listing,quantity:1},'quantity_mismatch'],
 [{...listing,price:{amount:800,divisor:100,currency_code:'CAD'}},'cad_price_mismatch']
 ])assert.ok(verifyRemote(item,shop,product,draft,claim).blockers.includes(code));
 assert.ok(verifyRemote(listing,shop,product,draft,null).blockers.includes('unclaimed_local_draft'));
});
test('Read-only GET, role gate, no remote POST / publish / auto retry',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-remote-draft-evidence'),MODULE_KEYS.STOREFRONT);
 const src=read('functions/api/admin/etsy-remote-draft-evidence.js');
 assert.match(src,/verifiedAdminFromModule/);
 assert.match(src,/method:'GET'/);
 assert.match(src,/confirmed_manual_link/);
 assert.match(src,/NOT EXISTS \(SELECT 1 FROM marketplace_syndication_drafts/);
 assert.doesNotMatch(src,/method:'PATCH'|method:'DELETE'|method:'PUT'|publishListing\(/);
 const onlyGet=src.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(onlyGet,/fetch\(|decryptOAuthSecret|INSERT INTO|UPDATE /);
 const ui=read('public/js/admin-etsy-draft-evidence-v400.js');
 assert.match(ui,/addEventListener\('click'/);assert.match(ui,/confirmed_manual_link:true/);
 assert.match(read('admin/it-integrations/index.html'),/id="etsy400Confirm"/);
});
