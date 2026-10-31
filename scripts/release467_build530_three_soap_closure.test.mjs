import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRODUCT_SAVE_FIELDS_521} from '../public/js/product-save-outcome-521.mjs';
import {savedBrowserOutcome530,assessSoapClosure530} from '../public/js/etsy-three-soap-closure-530.mjs';
import {preparedEtsyTags497} from '../functions/api/_lib/etsyNativeTags497.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const now=Date.parse('2026-10-30T14:00:00Z');
const saved=Object.fromEntries(PRODUCT_SAVE_FIELDS_521.map(k=>[k,'']));
Object.assign(saved,{product_id:88,name:'Fresh soap',sku:'SOAP-88',price_cents:1295,inventory_quantity:5,currency:'CAD'});
const stored={product_id:88,submitted:{...saved},at:now-60000};
const readback={state:'VERIFIED_READ_ONLY',listing_id:'4601712345',pairs:[{product_image_id:100,etsy_image_id:'222'}]};
const content={ready:true,product_id:88,listing_id:'4601712345',verified_unpublished:true,verified_canada_only:true,
  tag_readback_530:{match:true,local_policy_ready:true,remote_policy_ready:true,saved_tags:['soap gift'],etsy_tags:['soap gift']},
  owner_receipt_530:{recorded_current:false},issues:[],photo_freshness_509:{ready:true}};

test('Build 530 keeps a failed Save unknown without one recent exact browser request snapshot',()=>{
 assert.equal(savedBrowserOutcome530({productId:88,saved,stored:null,now}).state,'NO_VALID_BROWSER_RECEIPT');
 assert.equal(savedBrowserOutcome530({productId:88,saved,stored:{...stored,product_id:89},now}).state,'NO_VALID_BROWSER_RECEIPT');
 assert.equal(savedBrowserOutcome530({productId:88,saved,stored:{...stored,at:now-8*86400000},now}).state,'NO_VALID_BROWSER_RECEIPT');
 assert.equal(savedBrowserOutcome530({productId:88,saved,stored:{...stored,at:now+400000},now}).state,'NO_VALID_BROWSER_RECEIPT');
 const matched=savedBrowserOutcome530({productId:88,saved,stored,now});
 assert.equal(matched.state,'CURRENT_SAVED_FIELDS_MATCH');
 assert.match(matched.message,/does not prove/i);
 const mismatch=savedBrowserOutcome530({productId:88,saved,stored:{...stored,submitted:{...stored.submitted,name:'Old soap'}},now});
 assert.equal(mismatch.state,'REVIEW_SAVED_FIELDS');
 assert.deepEqual(mismatch.differences,['name']);
});

test('Build 530 accepts content for owner confirmation only after exact live Etsy ID, tags, photos, Canadian draft',()=>{
 const pass=assessSoapClosure530({productId:88,readback,content,save:{state:'NO_VALID_BROWSER_RECEIPT'}});
 assert.equal(pass.state,'READY_FOR_EXPLICIT_OWNER_ACCEPTANCE');
 assert.equal(pass.publication_allowed,false);
 assert.equal(pass.automatic_write_allowed,false);
 assert.equal(assessSoapClosure530({productId:88,readback,content:{...content,owner_receipt_530:{recorded_current:true}}}).state,'OWNER_RECEIPT_CURRENT');
 for(const [label,change] of [
  ['unverified gallery',{readback:{...readback,state:'HOLD'}}],
  ['different Product',{content:{...content,product_id:89}}],
  ['different Etsy listing',{content:{...content,listing_id:'4601712346'}}],
  ['Etsy content mismatch',{content:{...content,ready:false}}],
  ['not Canada-only',{content:{...content,verified_canada_only:false}}],
  ['tags differ',{content:{...content,tag_readback_530:{...content.tag_readback_530,match:false}}}],
  ['invalid tags',{content:{...content,tag_readback_530:{...content.tag_readback_530,remote_policy_ready:false}}}],
  ['failed Save mismatch',{save:{state:'REVIEW_SAVED_FIELDS'}}],
 ])assert.equal(assessSoapClosure530({productId:88,readback,content,...change}).state,'HOLD',label);
 assert.equal(assessSoapClosure530({productId:53,readback,content:{...content,product_id:53,photo_freshness_509:{ready:false}}}).state,'HOLD');
});

test('Build 530 uses the conservative current Etsy limit and unchanged original Product tag authority',()=>{
 assert.equal(preparedEtsyTags497('handmade soap, gift for mom, Canadian made').ready,true);
 assert.equal(preparedEtsyTags497(Array.from({length:14},(_,i)=>`soap ${i}`).join(',')).ready,false);
 assert.equal(preparedEtsyTags497('x'.repeat(21)).ready,false);
});

test('Build 530 owner acceptance is a separate human action with server-side fresh proof and idempotent receipt check',()=>{
 const html=read('admin/product-editor/index.html');
 const frontend=read('public/js/admin-product-etsy-closure-530.mjs');
 const api=read('functions/api/admin/product-etsy-owner-signoff-504.js');
 const deploy=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(html,/Devil n Dove • Build 53[01234567]/);
 assert.match(html,/id="dd529Panel"/);
 assert.match(html,/admin-product-etsy-closure-530\.mjs\?v=(?:530|536)/);
 assert.doesNotMatch(html,/src="\/public\/js\/admin-product-etsy-readback-529\.mjs/);
 assert.match(frontend,/method:'GET',cache:'no-store'/);
 assert.match(frontend,/confirm\.addEventListener\('click',async/);
 assert.match(frontend,/owner_approval_recorded!==true/);
 assert.match(frontend,/method:'POST'/);
 assert.match(frontend,/action:'approve_verified_draft_530'/);
 assert.match(frontend,/expected_evidence_fingerprint_508:content\.evidence_fingerprint_508/);
 assert.match(frontend,/confirm_actual_etsy_content:true,confirm_canada_only:true,confirm_unpublished_only:true/);
 assert.doesNotMatch(frontend,/product-editor-save|product-etsy-draft|setInterval\(/);
 assert.match(api,/if\(result\.owner_receipt_530\?\.recorded_current===true\)/);
 assert.match(api,/evidence_fingerprint_508:evidenceFingerprint/);
 assert.match(api,/tag_readback_530:tagReadback/);
 assert.match(api,/code:'owner_evidence_changed_530'/);
 assert.match(api,/verified_canada_only:true/);
 assert.match(deploy,/"build":53[01234567]/);
});
