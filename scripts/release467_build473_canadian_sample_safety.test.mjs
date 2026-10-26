/* Synthetic structure checks only. No physical sample, test, regulatory or Product approval. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CANADIAN_SAMPLE_SOURCES_473,sampleQuestions473,sampleReference473,evaluateSample473} from '../public/js/maker-sample-acceptance-policy-473.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const basis={productId:97,verifiedProductId:97,category:'candles',sampleId:'sample-97-photo',lotReference:'lot-candle-123',physicalPresent:true};
const observed=c=>Object.fromEntries(sampleQuestions473(c).map(q=>[q.key,{status:'observed',reference:`actual-qa-${q.key}`} ]));

test('all applicable categories require original sample, label and hazard inspection',()=>{
 for(const c of ['jewellery_adult','jewellery_child','candles','cosmetics_soap','resin_fabrication','toy_plush']){
  const keys=sampleQuestions473(c).map(x=>x.key);for(const k of ['actual_item','printed_label','damage'])assert.ok(keys.includes(k),`${c}/${k}`);
  const result=evaluateSample473({...basis,category:c,checks:observed(c)});
  assert.equal(result.state,'HOLD_PHYSICAL_CANADIAN_SAMPLE_ACCEPTANCE');
  for(const flag of ['complianceApproved','labelApproved','productReleased','publicationAllowed','shippingAuthorized','providerWritesAllowed','serverReceiptCreated'])assert.equal(result[flag],false,`${c}/${flag}`);
  assert.ok(result.holds.some(x=>x.includes('Qualified product-specific review')));
 }
});
test('specific physical category checks require independent interpretation and original current sources',()=>{
 const contains=(c,k)=>sampleQuestions473(c).some(x=>x.key===k);
 for(const [c,k] of [['jewellery_child','lead_cadmium'],['jewellery_child','small_parts'],['candles','burn_test'],['cosmetics_soap','notification'],['cosmetics_soap','ingredient_label'],['resin_fabrication','raw_kit'],['toy_plush','seams_parts'],['toy_plush','flammability'],['toy_plush','filling_label']])assert.ok(contains(c,k));
 const approvedLooking=evaluateSample473({...basis,category:'toy_plush',checks:observed('toy_plush')});
 assert.ok(approvedLooking.holds.some(x=>/Independent or qualified/.test(x)));
 for(const source of Object.values(CANADIAN_SAMPLE_SOURCES_473))assert.match(source.url,/^https:\/\/(www\.canada\.ca|competition-bureau\.canada\.ca|recalls-rappels\.canada\.ca)\//);
});
test('no sample or unverified Product stays HOLD, despite typed inspection results',()=>{
 const checks=observed('candles');
 assert.ok(evaluateSample473({...basis,verifiedProductId:88,checks}).holds.some(x=>/exact saved original Product/.test(x)));
 assert.ok(evaluateSample473({...basis,sampleId:'',checks}).holds.some(x=>/actual individual sample ID/.test(x)));
 assert.ok(evaluateSample473({...basis,physicalPresent:false,checks}).holds.some(x=>/physical sample in hand/.test(x)));
 assert.ok(evaluateSample473({...basis,category:'other',checks}).holds.some(x=>/classification/.test(x)));
 const stale=evaluateSample473({...basis,checks:{actual_item:{status:'observed',reference:'bad'}}});
 assert.equal(stale.counts.observed,0);assert.ok(stale.counts.unreviewed>0);
 const unsafe=evaluateSample473({...basis,checks:{damage:{status:'defect',reference:'actual-test-44'}}});
 assert.equal(unsafe.counts.defect,1);assert.match(unsafe.holds.join(' '),/STOP: Defect/);
 const pending=evaluateSample473({...basis,checks:{burn_test:{status:'expert_pending',reference:'real-lab-456'}}});
 assert.equal(pending.counts.pending,1);assert.match(pending.holds.join(' '),/Specialist evidence pending/);
});
test('evidence identifiers reject URLs, credentials, HTML, long notes and control chars',()=>{
 assert.equal(sampleReference473('lot-AB12-test'),'lot-AB12-test');
 for(const s of ['https://example.com/media','api@example.com','abc','<script>x</script>','secret?token=x','a'.repeat(121),'foo\nbar'])assert.equal(sampleReference473(s),'');
});
test('Build 473 attaches to existing authenticated Product GET, not a new D1/provider read or write',()=>{
 const html=read('admin/maker-product-safety/index.html'),script=read('public/js/admin-maker-sample-acceptance-473.js'),original=read('public/js/admin-maker-product-safety-462.js');
 for(const id of ['ps473Sample','ps473SampleId','ps473Lot','ps473Present','ps473SourceStatus','ps473Questions','ps473Summary','ps473Export'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/aria-live="polite"/);assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:600px\)/);
 assert.match(html,/admin-maker-sample-acceptance-473\.js\?v=473/);
 assert.match(script,/dd:maker-safety-product-verified/);assert.match(original,/dd:maker-safety-product-verified/);
 assert.match(script,/DEVIL_N_DOVE_BUILD_473_UNAPPROVED_PHYSICAL_SAMPLE_HOLD/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|\binnerHTML\b|method:\s*['"](POST|PUT|DELETE)['"]/);
 assert.match(script,/URL\.createObjectURL/);
});
