import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sweetOrangeListing538,SWEET_ORANGE_TAGS_538} from '../public/js/etsy-sweet-orange-copy-538.mjs';
import {resolvePhotoDraft538,reconcileEtsyPhotoInventory487} from '../functions/api/admin/product-etsy-images.js';
import {assessExistingDraftPhotoGap492} from '../functions/api/_lib/etsyPhotoGap492.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listing='4601705477',productId=54;
function fakeDb(rows){
 const db={withSession(mode){assert.equal(mode,'first-primary');return db;},prepare(sql){
   let params=[];
   return {bind(...args){params=args;return this;},async all(){
     assert.match(sql,/external_reference=\?/);
     assert.equal(params[0],listing);
     return {results:rows.filter(row=>row.external_reference===params[0]).slice(0,3)};
    },async first(){
     assert.match(sql,/channel_key='etsy'.*product_id=\?.*external_reference=\?/);
     assert.deepEqual(params,[productId,listing]);
     return rows.find(row=>String(row.product_id)===String(params[0])&&row.external_reference===params[1])||null;
    }};
  }};return db;
}

test('Build 538 recovers only one exact D1 primary same-Product draft claim; guesses, foreign and duplicate claims fail closed',async()=>{
 const row={id:88,product_id:productId,external_reference:listing,payload_json:'{}',status:'draft'};
 assert.deepEqual(await resolvePhotoDraft538(fakeDb([row]),productId,listing),row);
 assert.equal(await resolvePhotoDraft538(fakeDb([]),productId,listing),null);
 assert.equal(await resolvePhotoDraft538(fakeDb([{...row,product_id:53}]),productId,listing),null);
 assert.equal(await resolvePhotoDraft538(fakeDb([row,{...row,id:89}]),productId,listing),null);
 assert.equal(await resolvePhotoDraft538(fakeDb([row]),productId,'not-an-id'),null);
});

test('Build 538 zero remote photos require distinct owner consent; unknown existing images or earlier receipts cannot be silently re-uploaded',()=>{
 const originals=[341,342,343].map(product_image_id=>({product_image_id,alt_text:'Sweet Orange soap',transferable:true}));
 const empty=reconcileEtsyPhotoInventory487([],[]);
 assert.equal(empty.ready,true);
 const gap=assessExistingDraftPhotoGap492([],[],originals,new Set(),productId);
 assert.equal(gap.provider_write_allowed,false); // read-only diagnostic never authorizes a write itself
 assert.equal(gap.state,'ready_for_separate_owner_approval');
 assert.equal(reconcileEtsyPhotoInventory487([{listing_image_id:'12345'}],[]).ready,false);
 assert.notEqual(assessExistingDraftPhotoGap492([{listing_image_id:'12345'}],[],originals,new Set(),productId).provider_write_allowed,true);
 assert.notEqual(assessExistingDraftPhotoGap492([],[],originals,new Set(['54:341']),productId).provider_write_allowed,true);
});

test('Build 538 Sweet Orange product facts remain truthful and tag-ready; neither ingredients nor net weight are fabricated',()=>{
 assert.equal(SWEET_ORANGE_TAGS_538.length,13);
 assert.equal(new Set(SWEET_ORANGE_TAGS_538).size,13);
 assert.ok(SWEET_ORANGE_TAGS_538.every(tag=>tag.length<=20));
 const unknown=sweetOrangeListing538();
 assert.equal(unknown.ready,false);
 assert.match(unknown.description,/\[Enter the actual label ingredient list/);
 assert.match(unknown.description,/\[Confirm the actual net soap weight/);
 assert.doesNotMatch(unknown.description,/180 g/);
 const confirmed=sweetOrangeListing538({ingredients:'Sodium Olivate, Aqua, Citrus Aurantium Dulcis Peel Oil',netWeightGrams:'105'});
 assert.equal(confirmed.ready,true);
 assert.match(confirmed.description,/Net weight of soap \(without packaging\): 105 g/);
 assert.match(confirmed.description,/Sodium Olivate, Aqua, Citrus/);
 assert.match(confirmed.description,/Canada-only Etsy delivery/);
 assert.doesNotMatch(confirmed.description,/cures|treats|anti-fungal|anti-bacterial/i);
});

test('Build 538 front-end offers one-screen explicit owner workflow, no automatic Etsy POST, and exact target media routing',()=>{
 const html=read('admin/product-editor/index.html'),pilot=read('public/js/admin-product-etsy-pilot-538.mjs');
 const api=read('functions/api/admin/product-etsy-images.js');
 const flow=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const element of ['dd538Pilot','dd538Ingredients','dd538NetWeight','dd538FactsConfirm','dd538Fill','dd538SharedTags','dd538Photos','dd538NativeTags','dd538Final','dd538PilotStatus'])
  assert.match(html,new RegExp(`id="${element}"`));
 assert.match(html,/Devil n Dove • Build (?:538|539|540|541|542|543|544|545|546|547|548|549|550|551|552|553|554|555)/);
 assert.match(html,/admin-product-etsy-pilot-538\.mjs\?v=538/);
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=538/);
 assert.match(read('public/js/admin-product-destination-flow-523.mjs'),/admin-product-etsy-package-v500\.mjs\?v=538/);
 assert.match(pilot,/dd535GoPhotoSync/);
 assert.match(pilot,/mode:'shared'/);
 assert.match(pilot,/confirm_local_tags_only:true/);
 assert.match(pilot,/fill\.addEventListener\('click'/);
 assert.doesNotMatch(pilot,/addEventListener\('load'.*POST|addEventListener\('DOMContentLoaded'.*POST/);
 assert.match(api,/export async function resolvePhotoDraft538/);
 assert.match(api,/const candidate=url\.searchParams\.get\('candidate_listing_id'\)/);
 assert.match(api,/if\(b\.listing_id!==undefined&&String\(s\.draft\?\.external_reference\|\|''\)!==String\(b\.listing_id\)\)/);
 assert.match(flow,/product-etsy-images\?product_id=\$\{id\}&reconcile=1&candidate_listing_id=\$\{encodeURIComponent\(listingId\)\}/);
 assert.match(flow,/action:'transfer_one',product_id:id,listing_id:listingId/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:538|539|540|541|542|543|544|545|546|547|548|549|550|551|552|553|554|555|556)/);
 assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build538_one_soap_etsy_completion\.test\.mjs/);
});
