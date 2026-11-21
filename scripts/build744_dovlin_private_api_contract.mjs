/** Build 744 private admin API acceptance with fake in-memory D1 only.
 * No live token, customer account, real D1, images, email, Products or provider calls.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/dovlin-readiness-744.js';
import {DOVLIN_SOURCE_744,DOVLIN_SOURCE_744_BY_ID} from '../functions/api/_lib/dovlinSource744.mjs';

const original=JSON.parse(readFileSync(new URL('../dovlin/data/gallery_material_evidence.json',import.meta.url),'utf8'));
assert.equal(DOVLIN_SOURCE_744.length,68);
assert.equal(original.records.length,68);
for(const entry of original.records){
 const found=DOVLIN_SOURCE_744_BY_ID.get(entry.id);
 assert.ok(found,'source id missing: '+entry.id);
 assert.equal(found.name,entry.name);
 assert.equal(found.kind,entry.record_type);
 assert.equal(found.category,entry.category);
 assert.equal(found.art,entry.source_webp);
 assert.equal(found.sha,entry.source_git_blob_sha);
 assert.equal(found.original,entry.original_source_filename||null);
 assert.equal(found.provisional,!!entry.provisional_art_match);
}
assert.deepEqual(
 DOVLIN_SOURCE_744.filter(x=>x.provisional).map(x=>x.id).sort(),
 ['plush/burgundy-shadow','plush/ivory-dove','plush/silver-moon'].sort()
);

const store=new Map(),sqlLog=[];
const db={
 prepare(sql){
  const normalized=sql.replace(/\s+/g,' ').trim();
  return {bind(...params){
   return {
    async first(){
     sqlLog.push(['read_one',normalized]);
     assert.ok(normalized.startsWith('SELECT setting_value,is_public FROM app_settings'),'unexpected read query');
     const row=store.get(params[0]);
     return row?{setting_value:row.setting_value,is_public:row.is_public}:null;
    },
    async all(){
     sqlLog.push(['read_all',normalized]);
     assert.ok(normalized.includes('FROM app_settings WHERE setting_key LIKE ?'),'unexpected list query');
     const prefix=params[0].slice(0,-1);
     return {results:[...store.entries()].filter(([k])=>k.startsWith(prefix))
      .map(([setting_key,value])=>({setting_key,...value}))};
    },
    async run(){
     sqlLog.push(['write',normalized,params.length]);
     if(normalized.startsWith('INSERT INTO admin_action_audit'))return {meta:{changes:1}};
     if(normalized.startsWith('INSERT INTO app_settings')){
      const [key,packed]=params;
      if(store.has(key))return {meta:{changes:0}};
      store.set(key,{setting_value:packed,is_public:0});
      return {meta:{changes:1}};
     }
     if(normalized.startsWith('UPDATE app_settings')){
      const [packed,actor,key,oldPacked]=params;
      const old=store.get(key);
      if(!old||old.setting_value!==oldPacked||old.is_public!==0)return {meta:{changes:0}};
      assert.equal(actor,741);
      store.set(key,{setting_value:packed,is_public:0});
      return {meta:{changes:1}};
     }
     throw new Error('Unknown SQL statement '+normalized.slice(0,90));
    }
   };
  }};
 }
};
const url='https://devilndove.com/api/admin/dovlin-readiness-744';
const admin={ddModuleAccess:{allowed:true,user:{user_id:741,is_active:1,role:'admin',email:'admin@example.invalid'}}};
const member={ddModuleAccess:{allowed:true,user:{user_id:743,is_active:1,role:'member'}}};
const unknown={};
function ctx(method,body,data=admin,env={DB:db},origin='https://devilndove.com'){
 const request=new Request(url,{method,headers:method==='POST'?
  {'Origin':origin,'Content-Type':'application/json'}:{},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})});
 return {request,env,data};
}
async function read(response){return {status:response.status,data:await response.json()};}
const denied=await read(await onRequestGet(ctx('GET',null,member)));
assert.equal(denied.status,403);assert.equal(denied.data.code,'VERIFIED_ADMIN_REQUIRED');
assert.equal((await read(await onRequestGet(ctx('GET',null,unknown)))).status,403);
assert.equal((await read(await onRequestPost(ctx('POST',{},member)))).status,403);
const noDatabase=await read(await onRequestGet(ctx('GET',null,admin,{})));
assert.equal(noDatabase.status,503);
const crossOrigin=await read(await onRequestPost(ctx('POST',{},admin,{DB:db},'https://attacker.invalid')));
assert.equal(crossOrigin.status,403);
const first=await read(await onRequestGet(ctx('GET')));
assert.equal(first.status,200);
assert.equal(first.data.record_count,68);
assert.ok(first.data.records.every(r=>r.version===0&&r.readiness.stage==='NOT_REVIEWED'));
assert.equal(store.size,0,'read must not create database records');
assert.ok(first.data.records.every(r=>r.readiness.commercial_release===false));
const source=DOVLIN_SOURCE_744_BY_ID.get('plush/original-crimson');
const note='Original artwork review incomplete; measuring only after a physical sample exists.';
const defaultEvidence={
 art_decision:'hold',art_git_sha:source.sha,original_png_ref:'',
 art_comparison_ref:'',geometry_note:'',sample_observed:false,sample_ref:'',
 height_mm:null,width_mm:null,depth_mm:null,
 bom_revision:'',components:[],waste_percent:0,labour_minutes:0,labour_rate_cents:0,
 safety_state:'not_verified',safety_evidence_ref:'',age_basis:'',care_note:'',
 independent_review_ref:'',decision:'hold',note
};
const requestKey=crypto.randomUUID();
const payload={
 id:source.id,expected_version:0,expected_source_sha:source.sha,
 request_key:requestKey,evidence:defaultEvidence
};
const save=await read(await onRequestPost(ctx('POST',payload)));
assert.equal(save.status,200,JSON.stringify(save));
assert.equal(save.data.saved,true);
assert.equal(save.data.readiness.stage,'HOLD_NEEDS_EVIDENCE');
assert.equal(save.data.readiness.planning_cost_cents,null);
assert.equal(save.data.inventory_mutated,false);
assert.equal(save.data.accounting_posted,false);
assert.equal(store.size,1);
assert.equal([...store.values()][0].is_public,0);
assert.equal(save.data.version,1);
const replay=await read(await onRequestPost(ctx('POST',payload)));
assert.equal(replay.status,200);assert.equal(replay.data.replayed,true);
assert.equal(store.size,1);
const conflict=await read(await onRequestPost(ctx('POST',{...payload,evidence:{...defaultEvidence,note:note+' changed'}})));
assert.equal(conflict.status,409);assert.equal(conflict.data.code,'REQUEST_KEY_CONFLICT');
const stale=await read(await onRequestPost(ctx('POST',{...payload,request_key:crypto.randomUUID()})));
assert.equal(stale.status,409);assert.equal(stale.data.code,'STALE_REVIEW');

const fullEvidence={
 ...defaultEvidence,
 art_decision:'owner_compared',
 art_git_sha:source.sha,
 original_png_ref:'Owner-original-approved-crimson.png',
 art_comparison_ref:'private/test-comparison-file-id-2026',
 geometry_note:'Owner looked at the original approved lines, wings, horns and dove emblem; no geometry changed.',
 sample_observed:true,
 sample_ref:'physical-sample-test-id-only',
 height_mm:203.2,width_mm:155.5,depth_mm:82,
 bom_revision:'sample-01',
 components:[
  {component:'body',material:'prototype fabric',supplier:'sample supplier',lot:'sample lot',
   unit:'metre',quantity:0.5,unit_cost_cents:1900,evidence_ref:'sample receipt reference'},
  {component:'gold dove',material:'test emblem',supplier:'sample supplier',lot:'lot-002',
   unit:'each',quantity:1,unit_cost_cents:550,evidence_ref:'sample component record'}
 ],
 waste_percent:10,labour_minutes:100,labour_rate_cents:2400,
 safety_state:'documents_recorded',
 safety_evidence_ref:'independent document index',
 age_basis:'age 3+ sample paper review',
 care_note:'Sample prototype fibre and small-part documents reviewed, but this is not a safety certification.',
 decision:'submit_for_independent_review',
 note:'Fictional in-memory test evidence only; no original physical sample is being claimed in production.'
};
const complete=await read(await onRequestPost(ctx('POST',{...payload,
 expected_version:1,request_key:crypto.randomUUID(),evidence:fullEvidence})));
assert.equal(complete.status,200,JSON.stringify(complete));
assert.equal(complete.data.readiness.stage,'OWNER_PACKET_READY_FOR_INDEPENDENT_REVIEW');
assert.equal(complete.data.readiness.external_approval,false);
assert.equal(complete.data.readiness.commercial_release,false);
assert.equal(complete.data.readiness.independently_verified,false);
assert.equal(complete.data.readiness.inventory_created,false);
assert.equal(complete.data.readiness.material_subtotal_cents,1500);
assert.ok(Number.isFinite(complete.data.readiness.planning_cost_cents));
const review=await read(await onRequestGet(ctx('GET',null)));
const current=review.data.records.find(r=>r.id===source.id);
assert.equal(current.version,2);assert.equal(current.readiness.stage,'OWNER_PACKET_READY_FOR_INDEPENDENT_REVIEW');
const oneUrl=url+'?id='+encodeURIComponent(source.id);
const detail=await read(await onRequestGet({...ctx('GET'),request:new Request(oneUrl)}));
assert.equal(detail.status,200);
assert.equal(detail.data.record.history.length,2);
assert.equal(detail.data.record.current.evidence.components.length,2);
const proto=DOVLIN_SOURCE_744_BY_ID.get('plush/ivory-dove');
const noPreview=await read(await onRequestPost(ctx('POST',{
 id:proto.id,expected_version:0,expected_source_sha:proto.sha,request_key:crypto.randomUUID(),
 evidence:{...fullEvidence,art_git_sha:proto.sha}
})));
assert.equal(noPreview.status,400,'provisional source cannot submit for independent review');
assert.equal(store.size,1,'provisional attempt cannot create a review or product');
assert.ok(sqlLog.every(x=>!/(UPDATE|INSERT|DELETE).*\b(products|orders|inventory|transactions|journal_entries)\b/i.test(x[1])));
console.log('BUILD 744 PRIVATE ORIGINAL SOURCE / BOM API: PASS — 68 exact source identities; admin-only, no data on unauthorized access, private receipts, version lock, replay/conflict, 4 evidence domains, preliminary CAD planning, provisional art HOLD, external sale always denied; mock D1 only.');
