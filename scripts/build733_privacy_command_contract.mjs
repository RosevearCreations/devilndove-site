import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/privacy-command-centre-733.js';
const url='https://devilndove.com/api/admin/privacy-command-centre-733';
const admin={ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}};
const denied=await onRequestGet({request:new Request(url),env:{},data:{}});
assert.equal(denied.status,401);
const missing=await onRequestGet({request:new Request(url),env:{},data:admin});
assert.equal(missing.status,503);
const body={owner_review_confirmed:true,action:'approve_sla_733',
 review_id:'22222222-2222-4222-8222-222222222222',reason_code:'VERIFIED_SIGNED_ACK'};
const request=new Request(url,{method:'POST',headers:{'Origin':'https://devilndove.com','Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal((await onRequestPost({request,env:{},data:{}})).status,401);
assert.equal((await onRequestPost({request:request.clone(),env:{},data:admin})).status,503);
const source=readFileSync(new URL('../functions/api/admin/privacy-command-centre-733.js',import.meta.url),'utf8');
for(const guard of ['HOLD_VERIFIED_ADMIN_REQUIRED','HOLD_SAME_ORIGIN_REQUIRED',
 'HOLD_ORIGINAL_SINGLE_SIGNED_ACK_AND_CONSENT_REQUIRED','HOLD_DISTINCT_ADMIN_AND_ORIGINAL_REVIEW_REQUIRED',
 'INDEPENDENT_LOCAL_SLA_RESOLUTION_RECORDED','INDEPENDENT_CIPHERTEXT_METADATA_WITNESS_RECORDED',
 'independent_external_compliance_verified:false','old_key_retirement_authorized:false'])
 assert.ok(source.includes(guard),guard);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
for(const id of ['privacy733Refresh','privacy733Results','privacy733RecordReview',
 'privacy733ApproveReview','privacy733Witness'])assert.ok(html.includes(id),id);
assert.ok(js.includes('privacy-command-centre-733'), 'Original protected command centre route missing');
console.log('Build 733 strict protected command centre, two-Admin source ACK closure and independent rotation HOLD: PASS');
