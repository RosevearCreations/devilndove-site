/* Build 462 synthetic-only audit. No Canadian sale or physical test is certified. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CANADA_SAFETY_SOURCES_462,SAFETY_CATEGORIES_462,safetyQuestions462,safetyEvidenceRef462,evaluateSafety462} from '../public/js/maker-product-safety-policy-462.mjs';
import {MAKER_LINKS,workbenchUrl} from '../public/js/maker-workbench-policy-457.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const product={product_id:51,name:'Synthetic candle specimen',product_category:'candle'};
const syntheticReceipt={ok:true,selected:{creative_work_project_id:29},history:[{maker_owner_trial_review_id:450,scenario_key:'resin_clay',checkpoint_key:'physical_safety',decision:'accepted',personally_observed:1,source_kind:'quality_attempt',source_id:91}]};
const allReviewed=category=>Object.fromEntries(safetyQuestions462(category).map(x=>[x.key,{reviewed:true,reference:'synthetic-qa-100'}]));

test('no category or complete artificial evidence ever certifies, releases, posts or approves a Canadian Product',()=>{
 for(const category of SAFETY_CATEGORIES_462.map(c=>c.key)){
  const data=evaluateSafety462({productId:51,product,projectId:29,scenario:'resin_clay',ownerTrial:syntheticReceipt,category,checks:allReviewed(category)});
  assert.equal(data.state,'HOLD_CANADIAN_SAFETY_OWNER_REVIEW');assert.equal(data.certified,false);
  assert.equal(data.publicationAllowed,false);assert.equal(data.labelApproved,false);assert.equal(data.providerWritesAllowed,false);
  assert.equal(data.productMutationAllowed,false);assert.ok(data.holds.some(s=>/qualified human/i.test(s)));
 }
});
test('current official category questions cover child jewellery, plush, candles, cosmetics and common labels',()=>{
 const keys=category=>safetyQuestions462(category).map(x=>x.key);
 assert.ok(keys('jewellery_child').includes('child_metals'));
 assert.ok(keys('toy_plush').includes('toy_flame'));
 assert.ok(keys('toy_plush').includes('toy_textile'));
 assert.ok(keys('candles').includes('candle_burn'));
 assert.ok(keys('cosmetics_soap').includes('cosmetic_notification'));
 for(const c of SAFETY_CATEGORIES_462){assert.ok(keys(c.key).includes('trace'));assert.ok(keys(c.key).includes('package'));}
 for(const q of safetyQuestions462('cosmetics_soap'))assert.ok(CANADA_SAFETY_SOURCES_462[q.source]?.url.startsWith('https://'));
 assert.ok(Object.values(CANADA_SAFETY_SOURCES_462).every(x=>/^(https:\/\/www\.canada\.ca\/|https:\/\/competition-bureau\.canada\.ca\/)/.test(x.url)));
});
test('missing or unrelated evidence and latest HOLD supersede any old owner receipt',()=>{
 const basis={productId:51,product,category:'candles',checks:allReviewed('candles'),projectId:29,scenario:'resin_clay',ownerTrial:syntheticReceipt};
 assert.equal(evaluateSafety462(basis).ownerReceiptId,450);
 assert.equal(evaluateSafety462({...basis,productId:52}).ownerReceiptId,450);
 assert.match(evaluateSafety462({...basis,productId:52}).holds.join(' '),/matching current original Product/);
 assert.equal(evaluateSafety462({...basis,projectId:88}).ownerReceiptId,null);
 assert.equal(evaluateSafety462({...basis,scenario:'jewellery_metal'}).ownerReceiptId,null);
 assert.equal(evaluateSafety462({...basis,ownerTrial:{...syntheticReceipt,history:[{...syntheticReceipt.history[0],decision:'hold',maker_owner_trial_review_id:451},...syntheticReceipt.history]}}).ownerReceiptId,null);
 assert.equal(evaluateSafety462({...basis,ownerTrial:{...syntheticReceipt,history:[{...syntheticReceipt.history[0],personally_observed:0}]}}).ownerReceiptId,null);
 assert.match(evaluateSafety462({...basis,checks:{}}).holds.join(' '),/questions have no personal review/);
 assert.match(evaluateSafety462({...basis,category:'unclassified'}).holds.join(' '),/classification/);
 assert.equal(safetyEvidenceRef462('<script>alert(1)</script>'),'');
 assert.equal(safetyEvidenceRef462('short'),'');
});
test('private accessible worksheet reads original Admin endpoints, links canonically and never writes',()=>{
 const html=read('admin/maker-product-safety/index.html'),script=read('public/js/admin-maker-product-safety-462.js');
 assert.match(html,/data-admin-module="creator"/);assert.match(html,/href="#psMain"/);assert.match(html,/aria-live="polite"/);
 for(const id of ['psProduct','psCategory','psProject','psScenario'])assert.match(html,new RegExp(`for="${id}"`));
 assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:600px\)/);assert.match(html,/prefers-reduced-motion/);
 assert.match(script,/\/api\/admin\/product-editor-detail/);assert.match(script,/\/api\/admin\/maker-owner-trials/);
 assert.match(script,/credentials:'same-origin'/);assert.match(script,/cache:'no-store'/);assert.match(script,/method:'GET'/);
 assert.doesNotMatch(script,/method:\s*['"]POST['"]|localStorage|sessionStorage|innerHTML|fetch\(['"]https:/);
 assert.match(script,/DEVIL_N_DOVE_UNAPPROVED_SAFETY_REVIEW_WORKSHEET/);
 const link=MAKER_LINKS.find(l=>l.key==='product-safety');assert.ok(link);
 assert.equal(workbenchUrl(link,29),'/admin/maker-product-safety/?project_id=29');
 assert.match(html,/cannot certify a product/i);
});
