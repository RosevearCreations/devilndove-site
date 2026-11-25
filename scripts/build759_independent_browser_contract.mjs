// Build 759: real click-only browser source contract, isolated fixture never a human acceptance.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-customer-care-sla-751.js');
const index=client.indexOf('/* Build 759:');
assert.ok(index>0);
const code=client.slice(index);
for(const id of ['a759Workflow','a759Check','a759Status','a759Current','a759Previous','a759Hash'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752-753-754-755-756-758-759'));
assert.ok(html.includes('https://merchants.google.com/'));
for(const forbidden of ["method:'POST'","method:'DELETE'","localStorage","sessionStorage","innerHTML","setInterval(","document.cookie"])
 assert.ok(!code.includes(forbidden),'unsafe field-certification action: '+forbidden);
const sha='b'.repeat(40),prior='a'.repeat(40),digest='d'.repeat(64);
const marker={branch:'main',source_sha:sha,workflow_run_id:'45523981570'};
const privateDoc={ok:true,build:756,private_d1_only:true,
 production_marker:{ok:true,source_sha:sha},source_verified:true,original_source_fresh:true,
 automatic_renewal:false,no_purge:true,source_renewal_sha256:digest,
 status:{current_main_sha:sha,previous_sha:prior,prior_valid:true,source_current:true,
 verified_original_source:true,new_first_renewal_id:'first',new_independent_renewal_id:'second',
 certificate_renewed:true,status:'CURRENT_RELEASE_CERTIFICATE_RENEWED'}};
async function run({privateData=privateDoc,lastMarker=marker,firstMarker=marker,unauthorized=false}={}){
 const ids=['a759Check','a759Status','a759Current','a759Previous','a759Hash','a756Task','a756Code'];
 const els=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',disabled:false,
  addEventListener(event,fn){this[event]=fn;}}]));
 els.a756Task.value='16b147a8-d11f-47e9-8fb5-c0fbc3949de0';
 els.a756Code.value='RETENTION_REVIEW_ESCALATION';
 const calls=[];
 const context={document:{getElementById:id=>els[id]||null},location:{origin:'https://devilndove.com'},
 URL,URLSearchParams,AbortController,setTimeout,clearTimeout,
 fetch:async(url,opts)=>{
  calls.push({url,opts});
  const privateRequest=url.startsWith('/api/admin/');
  return {ok:!(unauthorized&&privateRequest),status:403,
   json:async()=>privateRequest?privateData:calls.length===1?firstMarker:lastMarker};
 }};
 vm.runInNewContext(code,context);
 assert.equal(calls.length,0,'no automatic private source read or signoff');
 await els.a759Check.click();
 for(const c of calls){
  assert.equal(c.opts.method,'GET');assert.equal(c.opts.credentials,'same-origin');
  assert.equal(c.opts.cache,'no-store');assert.equal(c.opts.redirect,'error');
 }
 return {els,calls};
}
let s=await run();
assert.equal(s.calls.length,3);
assert.match(s.els.a759Status.textContent,/PRIVATE TWO-ADMIN SOURCE CONTINUITY VERIFIED/);
assert.equal(s.els.a759Hash.value,digest);
for(const p of [
 {privateData:{...privateDoc,status:{...privateDoc.status,new_independent_renewal_id:null}}},
 {privateData:{...privateDoc,status:{...privateDoc.status,certificate_renewed:false}}},
 {privateData:{...privateDoc,status:{...privateDoc.status,prior_valid:false}}},
 {privateData:{...privateDoc,source_verified:false}},
 {privateData:{...privateDoc,source_renewal_sha256:'d'.repeat(63)}},
 {lastMarker:{...marker,source_sha:'c'.repeat(40)}},
 {unauthorized:true}
 ]){
 s=await run(p);
 assert.match(s.els.a759Status.textContent,/HOLD/);
 assert.equal(s.els.a759Hash.value,'','reject unverified private receipt');
}
console.log('BUILD759 PASS: original private two-Admin evidence, stable live source, stale source/second actor/auth failure all fail closed; no human acceptance fabricated.');
