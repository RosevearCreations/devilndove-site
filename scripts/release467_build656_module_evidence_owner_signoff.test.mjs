import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {REQUIREMENTS,POLICY,normalizeReview,decodeOwnerRecord,summarizeOwnerReviews}
  from '../functions/api/_lib/moduleAcceptance656.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/module-acceptance-656.js';
import {MODULE_KEYS,moduleKeyForPath} from '../functions/api/_lib/appModuleRoutes.js';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const ENDPOINT='https://devilndove.com/api/admin/module-acceptance-656';
function fakeDb(){
  const docs=new Map(),audit=[];let writes=0,conflict=false;
  return {docs,audit,get writes(){return writes},set conflict(v){conflict=v},
    prepare(sql){return {bind(...args){return {
      async first(){if(!sql.startsWith('SELECT setting_value,is_public FROM app_settings'))throw Error('Unexpected read');
        const content=docs.get(args[0]);return content?{setting_value:content,is_public:0}:null;},
      async run(){
        if(sql.startsWith('INSERT INTO admin_action_audit')){audit.push(args);return {meta:{changes:1}};}
        writes++;
        if(conflict)return {meta:{changes:0}};
        if(sql.startsWith('INSERT INTO app_settings')){
          if(docs.has(args[0]))return {meta:{changes:0}};
          docs.set(args[0],args[1]);return {meta:{changes:1}};
        }
        if(sql.startsWith('UPDATE app_settings')){
          if(docs.get(args[2])!==args[3])return {meta:{changes:0}};
          docs.set(args[2],args[0]);return {meta:{changes:1}};
        }
        throw Error('Unexpected write SQL: '+sql.slice(0,60));
      }
    };}};}
  };
}
function context(db,{actor=7,role='admin',allowed=true,active=1,method='GET',body=null,origin=true,query=''}={}){
 const headers=body===null?{}:{'Content-Type':'application/json',...(origin?{'Origin':'https://devilndove.com'}:{})};
 return {env:{DB:db},data:{ddModuleAccess:{allowed,user:{user_id:actor,role,is_active:active}}},
   request:new Request(ENDPOINT+query,{method,headers,...(body===null?{}:{body:JSON.stringify(body)})})};
}
const review=(id='customer.mobile.browse')=>({action:'record_review',requirement_id:id,
 decision:'accepted',observed_at:new Date().toISOString(),device_description:'Android tablet, Firefox 159',
 evidence_reference:'urn:rosevear:evidence:owner-mobile-check-001',
 review_note:'I personally inspected the actual page in the signed-in user experience.',
 personally_observed:true,owner_confirmation:true,expected_version:0,request_key:crypto.randomUUID()});

test('Build 656 proposes stable cross-role/device and business IDs but never certifies a module denominator',()=>{
 assert.equal(REQUIREMENTS.length,38);assert.equal(new Set(REQUIREMENTS.map(x=>x.id)).size,38);
 for(const role of ['customer','worker','admin'])for(const device of ['mobile','desktop','tablet'])
   assert.equal(REQUIREMENTS.filter(x=>x.role===role&&x.device===device).length,2);
 assert.equal(POLICY.moduleCompletionPercent,null);
 assert.equal(POLICY.approvedModuleDenominators,false);
 assert.equal(POLICY.publishToMasterShell,false);
 const summary=summarizeOwnerReviews({receipts:[]});
 assert.equal(summary.owner_accepted,0);assert.equal(summary.master_completion_percent,null);
});

test('Build 656 requires actual accepted device observation, controlled evidence ref and explicit owner confirmation',()=>{
 for(const change of [
   b=>b.personally_observed=false,b=>b.evidence_reference='https://evil.example/customer/123',
   b=>b.device_description='',b=>b.owner_confirmation=false,
   b=>b.observed_at='2099-01-01T00:00:00.000Z',b=>b.requirement_id='another-tenant.mobile.browse',
   b=>b.customer_data='extra']){
    const body=review();change(body);assert.throws(()=>normalizeReview(body));
  }
 const hold={...review(),decision:'hold',personally_observed:false,evidence_reference:'',observed_at:''};
 assert.equal(normalizeReview(hold).decision,'hold');
 assert.throws(()=>normalizeReview({...hold,observed_at:'invalid-date'}));
});

test('Build 656 requires private source row and rejects forged or externally verified receipts',()=>{
 const invalid={setting_value:JSON.stringify({schema:656,version:1,receipts:[]}),is_public:1};
 assert.throws(()=>decodeOwnerRecord(invalid));
 const forged={setting_value:JSON.stringify({schema:656,version:1,receipts:[{
   receipt_id:crypto.randomUUID(),request_key:crypto.randomUUID(),requirement_id:REQUIREMENTS[0].id,
   decision:'accepted',actor_user_id:1,independently_verified:true}]}),is_public:0};
 assert.throws(()=>decodeOwnerRecord(forged));
});

test('Build 656 requires verified active Admin module access and same-origin POST',async()=>{
 const db=fakeDb(),body=review();
 for(const variant of [{allowed:false},{role:'customer'},{active:0}]){
   assert.equal((await onRequestGet(context(db,variant))).status,401);
   assert.equal((await onRequestPost(context(db,{...variant,method:'POST',body}))).status,401);
 }
 assert.equal((await onRequestPost(context(db,{method:'POST',body,origin:false}))).status,403);
 assert.equal(db.writes,0);
});

test('Build 656 authenticated GET starts private and shows NO source-certified percentage',async()=>{
 const db=fakeDb(),response=await onRequestGet(context(db));
 const data=await response.json();
 assert.equal(response.status,200);assert.equal(data.version,0);assert.equal(data.owner_user_id,7);
 assert.equal(data.summary.total_checkpoints,38);
 assert.equal(data.summary.master_completion_percent,null);
 assert.equal(data.policy.independentVerification,false);
 assert.equal(data.policy.publishToMasterShell,false);
 assert.equal(db.writes,0);
});

test('Build 656 records one private owner-attested receipt with CAS and original source readback only',async()=>{
 const db=fakeDb(),body=review(),result=await onRequestPost(context(db,{method:'POST',body}));
 const saved=await result.json();assert.equal(result.status,200);
 assert.equal(saved.saved,true);assert.equal(saved.receipt.independently_verified,false);
 assert.equal(saved.receipt.signed_original_source,false);
 assert.equal(saved.receipt.master_reporting_performed,false);
 assert.equal(saved.version,1);assert.equal(db.writes,1);assert.equal(db.audit.length,1);
 const state=await (await onRequestGet(context(db))).json();
 assert.equal(state.receipts[0].requirement_id,body.requirement_id);
 assert.equal(state.summary.owner_accepted,1);assert.equal(state.summary.master_completion_percent,null);
 assert.equal(state.summary.modules.find(x=>x.module==='customer-experience').owner_attested_review_coverage_pct,Math.round(100/6));
 assert.ok(db.docs.has('site.admin.module_acceptance.v656.7'));
});

test('Build 656 repeats identical request safely, rejects conflicting key and stale source version',async()=>{
 const db=fakeDb(),body=review();
 assert.equal((await onRequestPost(context(db,{method:'POST',body}))).status,200);
 const again=await (await onRequestPost(context(db,{method:'POST',body}))).json();
 assert.equal(again.replayed,true);assert.equal(db.writes,1);
 const conflict={...body,review_note:'This content differs from the exact original owner observation.'};
 assert.equal((await onRequestPost(context(db,{method:'POST',body:conflict}))).status,409);
 const stale={...review(),expected_version:0};
 assert.equal((await onRequestPost(context(db,{method:'POST',body:stale}))).status,409);
 assert.equal(db.writes,1);
});

test('Build 656 isolates two real Admin identities and returns only the original actor receipt',async()=>{
 const db=fakeDb(),body=review();
 await onRequestPost(context(db,{method:'POST',body,actor:7}));
 const other=await (await onRequestGet(context(db,{actor:8}))).json();
 assert.equal(other.receipts.length,0);
 const ownLookup=await (await onRequestGet(context(db,{actor:7,query:'?request_key='+body.request_key}))).json();
 assert.equal(ownLookup.found,true);
 const crossLookup=await (await onRequestGet(context(db,{actor:8,query:'?request_key='+body.request_key}))).json();
 assert.equal(crossLookup.found,false);
});

test('Build 656 refuses CAS-conflicted write and never silently retries',async()=>{
 const db=fakeDb();db.conflict=true;
 const result=await onRequestPost(context(db,{method:'POST',body:review()}));
 assert.equal(result.status,409);assert.equal((await result.json()).code,'STALE_OWNER_EVIDENCE');
 assert.equal(db.writes,1);assert.equal(db.audit.length,0);
});

test('Build 656 owner page is accessible, explicit-read, and never treats local signoff as Master success',()=>{
 const page=readFileSync(resolve(root,'admin/module-acceptance/index.html'),'utf8');
 const client=readFileSync(resolve(root,'public/js/admin-module-acceptance-656.js'),'utf8');
 const api=readFileSync(resolve(root,'functions/api/admin/module-acceptance-656.js'),'utf8');
 assert.match(page,/<h1>Evidence-based module reviews/);
 assert.match(page,/id="dd656Load"/);assert.match(page,/id="dd656CheckReceipt"/);
 assert.match(page,/role="status" aria-live="polite"/);
 assert.match(page,/id="dd656Confirm" required/);
 assert.match(client,/addEventListener\('click'/);assert.match(client,/addEventListener\('submit'/);
 assert.doesNotMatch(client,/setInterval\(|setTimeout\(/);
 assert.doesNotMatch(api,/fetch\(|\.send\(|UPDATE products|DELETE FROM/);
 assert.match(api,/is_public=0/);
 assert.match(api,/WHERE setting_key=\? AND is_public=0 AND setting_value=\?/);
});

test('Build 656 owner UI and API require the same restricted I.T. application module',()=>{
 assert.equal(moduleKeyForPath('/admin/module-acceptance/'),MODULE_KEYS.IT_PLATFORM);
 assert.equal(moduleKeyForPath('/api/admin/module-acceptance-656'),MODULE_KEYS.IT_PLATFORM);
 assert.equal(moduleKeyForPath('/api/admin/module-acceptance-656/arbitrary'),MODULE_KEYS.IT_PLATFORM);
 assert.equal(moduleKeyForPath('/shop'),MODULE_KEYS.STOREFRONT);
});
