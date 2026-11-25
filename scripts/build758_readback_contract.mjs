// Build 758: exercise the actual click-only UI against isolated fake GET responses.
// Neither this fixture nor a readback confers genuine independent human field certification.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=read('public/js/admin-customer-care-sla-751.js');
const html=read('admin/storefront-acceptance/index.html');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const index=client.indexOf('/* Build 758: two explicit GET-only');
assert.ok(index>0,'Build 758 client source must reuse existing module');
const source=client.slice(index);
for(const id of ['a758Verify','a758Read','a758Status','a758Sha','a758Digest','a758Prior'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752-753-754-755-756-758'));
for(const s of ["method:'GET'","credentials:'same-origin'","cache:'no-store'","redirect:'error'","12000","certificate_renewed","CURRENT_RELEASE_CERTIFICATE_RENEWED"])
 assert.ok(source.includes(s),'Required readback gate '+s);
for(const forbidden of ["method:'POST'","method:'DELETE'",'localStorage','sessionStorage','innerHTML','setInterval(','URL.createObjectURL','document.cookie'])
 assert.ok(!source.includes(forbidden),'No unattended behavior: '+forbidden);
assert.ok(api.includes("searchParams.has('continuity756')"));
assert.ok(api.includes('source_renewal_sha256:checked.digest'));
assert.ok(api.includes('certificate_renewed:renewed'));
const sha='b'.repeat(40),prior='a'.repeat(40),digest='d'.repeat(64);
const marker={branch:'main',source_sha:sha,workflow_run_id:'45521706656'};
const privateDoc={ok:true,build:756,private_d1_only:true,
 production_marker:{ok:true,source_sha:sha},source_verified:true,
 original_source_fresh:true,automatic_renewal:false,no_purge:true,
 source_renewal_sha256:digest,status:{current_main_sha:sha,
 previous_sha:prior,verified_original_source:true,
 certificate_renewed:true,status:'CURRENT_RELEASE_CERTIFICATE_RENEWED'}};
function session(returnMarker=marker,returnDoc=privateDoc){
 const ids=['a758Verify','a758Read','a758Status','a758Sha','a758Digest','a758Prior','a756Task','a756Code'];
 const elements=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',disabled:false,addEventListener(event,fn){this[event]=fn;}}]));
 elements.a756Task.value='16b147a8-d11f-47e9-8fb5-c0fbc3949de0';
 elements.a756Code.value='RETENTION_REVIEW_ESCALATION';
 const calls=[];
 const context={document:{getElementById:id=>elements[id]||null},
  location:{origin:'https://devilndove.com'},URL,URLSearchParams,AbortController,setTimeout,clearTimeout,
  fetch:async(url,opts)=>{
   calls.push({url,opts});
   const data=url.startsWith('/release-version.json')?returnMarker:returnDoc;
   return {ok:true,json:async()=>data};
  }};
 vm.runInNewContext(source,context);
 return {elements,calls,click:async id=>elements[id].click()};
}
{
 const s=session();
 assert.equal(s.calls.length,0,'never fetch on page load');
 await s.click('a758Verify');
 assert.equal(s.elements.a758Sha.value,sha);
 assert.equal(s.calls.length,1);
 await s.click('a758Read');
 assert.equal(s.calls.length,2);
 assert.equal(s.elements.a758Digest.value,digest);
 assert.match(s.elements.a758Status.textContent,/PRIVATE D1 CONTINUITY RECORDED/);
 for(const c of s.calls){
  assert.equal(c.opts.method,'GET');
  assert.equal(c.opts.credentials,'same-origin');
  assert.equal(c.opts.cache,'no-store');
  assert.equal(c.opts.redirect,'error');
 }
}
{
 const s=session({...marker,branch:'development'});
 await s.click('a758Verify');
 assert.match(s.elements.a758Status.textContent,/HOLD/);
 await s.click('a758Read');
 assert.equal(s.calls.length,1,'invalid public SHA must prevent private read');
}
for(const changed of [
 {...privateDoc,status:{...privateDoc.status,certificate_renewed:false}},
 {...privateDoc,status:{...privateDoc.status,current_main_sha:'c'.repeat(40)}},
 {...privateDoc,source_verified:false},
 {...privateDoc,original_source_fresh:false},
 {...privateDoc,source_renewal_sha256:'d'.repeat(63)},
 {...privateDoc,automatic_renewal:true}
]){
 const s=session(marker,changed);
 await s.click('a758Verify');await s.click('a758Read');
 assert.match(s.elements.a758Status.textContent,/HOLD/);
 assert.equal(s.elements.a758Digest.value,'');
}
console.log('BUILD758 PASS: original browser readback is click-only GET; production SHA, private D1 digest and two-Admin source gates reject drift; no real human sign-off fabricated.');
