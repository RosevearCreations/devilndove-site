// Build 758 deterministic release/certificate readback — fixtures are NOT production or human evidence.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validPublicMarker758,evaluateBuild758} from '../public/js/admin-production-audit-verdict-758.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/js/admin-production-audit-readback-758.mjs');
const html=read('admin/storefront-acceptance/index.html');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const marker={branch:'main',source_sha:'b'.repeat(40),workflow_run_id:'45521706656'};
const doc={ok:true,build:756,private_d1_only:true,production_marker:{ok:true,source_sha:marker.source_sha},
 source_verified:true,original_source_fresh:true,automatic_renewal:false,no_purge:true,
 source_renewal_sha256:'d'.repeat(64),status:{current_main_sha:marker.source_sha,
 previous_sha:'a'.repeat(40),verified_original_source:true,
 certificate_renewed:true,status:'CURRENT_RELEASE_CERTIFICATE_RENEWED'}};
assert.equal(validPublicMarker758(marker),true);
assert.equal(evaluateBuild758(marker,doc).outcome,'PRIVATE_D1_CONTINUITY_RECORDED');
const hold=(m,d)=>assert.equal(evaluateBuild758(m,d).outcome,'HOLD');
hold({...marker,branch:'development'},doc);
hold({...marker,source_sha:'b'.repeat(39)},doc);
hold(marker,{...doc,production_marker:{ok:true,source_sha:'c'.repeat(40)}});
hold(marker,{...doc,status:{...doc.status,current_main_sha:'c'.repeat(40)}});
hold(marker,{...doc,status:{...doc.status,certificate_renewed:false}});
hold(marker,{...doc,status:{...doc.status,status:'AWAITING_SECOND_RENEWAL_ADMIN'}});
hold(marker,{...doc,status:{...doc.status,verified_original_source:false}});
hold(marker,{...doc,source_verified:false});
hold(marker,{...doc,original_source_fresh:false});
hold(marker,{...doc,automatic_renewal:true});
hold(marker,{...doc,source_renewal_sha256:'d'.repeat(63)});
hold(marker,{...doc,status:{...doc.status,previous_sha:marker.source_sha}});
hold(marker,{...doc,private_d1_only:false});
for(const id of ['a758Verify','a758Read','a758Status','a758Sha','a758Digest','a758Prior'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-production-audit-readback-758.mjs?v=758'));
assert.ok(ui.includes("addEventListener('click'"));
assert.ok(ui.includes("method:'GET'")&&ui.includes("credentials:'same-origin'")&&ui.includes("cache:'no-store'"));
assert.ok(ui.includes("redirect:'error'")&&ui.includes('12000'));
for(const prohibited of ["method:'POST'","method:'DELETE'",'localStorage','sessionStorage','innerHTML','setInterval(','URL.createObjectURL','document.cookie'])
 assert.ok(!ui.includes(prohibited),'Prohibited unattended behavior: '+prohibited);
assert.ok(api.includes("searchParams.has('continuity756')"));
assert.ok(api.includes('source_renewal_sha256:checked.digest'));
assert.ok(api.includes('certificate_renewed:renewed'));
console.log('BUILD758 PASS: click-only live marker, private GET-only SHA/digest readback, distinct-Admin HOLD, drift and release boundaries; fixtures never count as human proof.');
