import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessExistingPhotoMatches519} from '../public/js/etsy-photo-matching-519.mjs';
import {probeQl253PublicOrigin519} from './ql253_public_origin_probe_519.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const originals=[344,345,346],draft='4603838854';
const example=()=>({productId:53,listingId:draft,receipt:{product_id:53,listing_id:draft,
  originals:originals.map(product_image_id=>({product_image_id})),
  etsy_photos:originals.map((_,i)=>({etsy_image_id:String(940+i)})),
  matched:originals.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(940+i)})),
  unresolved_upload_attempts:0}});

test('three distinct existing-Etsy photo pairs permit final READ only, never owner acceptance',()=>{
 const v=assessExistingPhotoMatches519(example());
 assert.equal(v.readyForFinalRead,true);assert.equal(v.matchedCount,3);
 assert.equal(v.acceptedByOwner,false);assert.equal(v.pending.length,0);
});
test('a partial match can be reviewed without claiming all photos or allowing blind upload',()=>{
 const v=example();v.receipt.matched.pop();v.receipt.unresolved_upload_attempts=1;
 const result=assessExistingPhotoMatches519(v);
 assert.equal(result.matchedCount,2);assert.deepEqual(result.pending,[346]);
 assert.equal(result.readyForFinalRead,false);assert.equal(result.safeToMatch,true);
 assert.match(result.issues.join(' '),/Never upload/);
});
test('duplicate, changed draft, missing originals or untracked mapping blocks further mapping',()=>{
 for(const change of [
   x=>{x.receipt.matched[1].etsy_image_id='940';},
   x=>{x.listingId='4603838855';},
   x=>{x.receipt.originals.pop();},
   x=>{x.receipt.matched[0].etsy_image_id='999';}
 ]){const x=example();change(x);const v=assessExistingPhotoMatches519(x);
   assert.equal(v.readyForFinalRead,false);assert.equal(v.safeToMatch,false);}
});
test('visible Etsy workflow requires deliberate photo comparison then a separate final GET check',()=>{
 const ui=read('public/js/admin-product-etsy-package-v500.mjs'),html=read('admin/product-editor/index.html');
 for(const id of ['dd519PhotoEvidence','dd519Compare','dd519PhotoProgress','dd519PhotoMatchMount'])
   assert.match(html,new RegExp(`id="${id}"`));
 assert.match(ui,/assessExistingPhotoMatches519/);
 assert.match(ui,/dd519Compare'\)\.addEventListener\('click'/);
 assert.match(ui,/dd519PhotoProgress'\)\.textContent/);
 assert.match(ui,/!state\.photoReviewVerdict519\?\.safeToMatch/);
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=519/);
 assert.match(html,/etsy-simple-515\.css\?v=519/);
 assert.match(ui,/async function verifyOwner517/);
 assert.match(ui,/action:'match_existing_photo'/);
 assert.doesNotMatch(ui,/publishListing\(|activateListing\(/);
});
test('QL-253 public immutable proof 404 stays disconnected despite exact green source A',async()=>{
 const a='a'.repeat(40),m='b'.repeat(40),calls=[];
 const fetchFn=async url=>{calls.push(url);return url.includes('/actions/runs/')?
   {status:200,json:async()=>({head_sha:a,status:'completed',conclusion:'success'})}:{status:404};};
 const v=await probeQl253PublicOrigin519({sourceShaA:a,mainSha:m,runId:'40794862120',fetchFn});
 assert.equal(v.source_ci_exact_head_green,true);
 assert.equal(v.immutable_public_proof_http_status,404);
 assert.equal(v.proof_commit_sha_B,'NOT_AVAILABLE');
 assert.equal(v.connection_state,'DISCONNECTED');assert.equal(v.actual_gateway_test,'NOT_RUN');
 assert.equal(calls.length,2);
 assert.ok(calls.every(url=>url.startsWith('https://api.github.com/')||url.startsWith('https://raw.githubusercontent.com/')));
});
test('QL-253 published bytes still require distinct B, ancestry and independent attestation',async()=>{
 const a='a'.repeat(40),b='b'.repeat(40),main='c'.repeat(40);
 const fetchFn=async url=>url.includes('/actions/runs/')?
   {status:200,json:async()=>({head_sha:a,status:'completed',conclusion:'success'})}:
   url.includes('/compare/')?{status:200,json:async()=>({status:'ahead',ahead_by:2})}:
   {status:200,text:async()=>JSON.stringify({payload:{source_revision:a}})};
 const v=await probeQl253PublicOrigin519({sourceShaA:a,mainSha:main,proofCommitShaB:b,runId:'40794862120',fetchFn});
 assert.equal(v.proof_ancestry_verified,true);
 assert.equal(v.proof_source_sha_matches_A,true);
 assert.match(v.exact_proof_bytes_sha256,/^[0-9a-f]{64}$/);
 assert.equal(v.owner_test_decision,'NOT_GIVEN');assert.equal(v.independent_signer_pin_verified,false);
 assert.equal(v.connection_state,'DISCONNECTED');
 assert.ok(v.issues.some(x=>/custody/.test(x)));
});
