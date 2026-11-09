import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {STAGES,QA,PURPOSES,POLICY,normalizeWorkshopReview,assertSourceEvent,decodeJournal}
  from '../functions/api/_lib/workshopLifecycle657.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/workshop-production-657.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const endpoint='https://devilndove.com/api/admin/workshop-production-657';
const proj={creative_work_project_id:17,project_key:'CP-ACTUAL17',project_title:'Private silver casting experiment',
 project_type:'maker_project',project_status:'in_progress',privacy_status:'internal',rights_status:'needs_review',
 product_id:null,summary:'We are experimenting with a small cast.',started_at:'2026-11-08',completed_at:null,
 updated_at:'2026-11-09 10:00:00'};
const events=[{creative_work_event_id:71,event_type:'result',event_title:'Actual silver pour result',
 event_notes:'Real recorded casting inspection',occurred_at:'2026-11-09 12:00:00',entry_status:'active'},
 {creative_work_event_id:70,event_type:'lesson',event_title:'Learning from the wax',event_notes:'Actual lesson observed',
 occurred_at:'2026-11-09 11:00:00',entry_status:'active'},
 {creative_work_event_id:69,event_type:'mistake',event_title:'Broken casting seam',event_notes:'Real failed cast',
 occurred_at:'2026-11-09 10:30:00',entry_status:'active'}];
const outputs=[{creative_work_output_id:11,output_key:'cast',output_label:'Sample cast',output_status:'planned',
 approval_status:'needs_review',updated_at:'2026-11-09 10:00:00'}];
function db(){const docs=new Map(),audit=[];let writes=0,conflict=false;
 const state={project:{...proj},events:events.map(e=>({...e})),outputs:outputs.map(o=>({...o})),docs,audit,
   get writes(){return writes},set conflict(v){conflict=v},prepare(sql){return{bind(...args){return{
     async first(){
       if(sql.includes('FROM creative_work_projects')&&sql.includes('LIMIT 1'))
         return Number(args[0])===state.project.creative_work_project_id&&state.project.project_status!=='archived'?{...state.project}:null;
       if(sql.includes('COUNT(*) AS event_count'))return {event_count:state.events.filter(e=>e.entry_status==='active').length};
       if(sql.includes('FROM app_settings')){const data=docs.get(args[0]);return data?{setting_value:data,is_public:0}:null;}
       throw Error('Unmocked source first: '+sql.slice(0,80));
     },
     async all(){
       if(sql.includes('FROM creative_work_projects')&&sql.includes('LIMIT 80'))
         return {results:state.project.project_status==='archived'?[]:[{...state.project}]};
       if(sql.includes('FROM creative_work_events'))return {results:state.events.filter(e=>e.entry_status==='active').slice(0,40)};
       if(sql.includes('FROM creative_work_outputs'))return {results:state.outputs.slice(0,40)};
       throw Error('Unmocked source all: '+sql.slice(0,80));
     },
     async run(){
       if(sql.includes('INSERT INTO admin_action_audit')){audit.push(args);return {meta:{changes:1}};}
       writes++;if(conflict)return {meta:{changes:0}};
       if(sql.includes('INSERT INTO app_settings')){if(docs.has(args[0]))return {meta:{changes:0}};
         docs.set(args[0],args[1]);return {meta:{changes:1}};}
       if(sql.includes('UPDATE app_settings')){if(docs.get(args[2])!==args[3])return {meta:{changes:0}};
         docs.set(args[2],args[0]);return {meta:{changes:1}};}
       throw Error('Unexpected real source write: '+sql.slice(0,80));
     }
   };},async all(){return this.bind().all();}};}};
 return state;
}
function ctx(source,{actor=7,role='admin',allowed=true,active=1,method='GET',body=null,origin=true,query=''}={}){
 const headers=body===null?{}:{'Content-Type':'application/json',...(origin?{'Origin':'https://devilndove.com'}:{})};
 return {env:{DB:source},data:{ddModuleAccess:{allowed,user:{user_id:actor,role,is_active:active}}},
  request:new Request(endpoint+query,{method,headers,...(body===null?{}:{body:JSON.stringify(body)})})};
}
const review=(revision,extra={})=>({action:'record_review',project_id:17,expected_source_revision:revision,
 stage:'qa_review',progress_percent:85,purpose:'private_experiment',qa_decision:'passed',source_event_id:71,
 observed_at:new Date().toISOString(),review_note:'I personally inspected the actual result of the private casting test.',
 personally_observed:true,owner_confirmation:true,expected_version:0,request_key:crypto.randomUUID(),...extra});
async function current(source){return (await (await onRequestGet(ctx(source,{query:'?project_id=17'}))).json());}

test('657 defines private maker outcomes while withholding any automatic stock, sale or source completion',()=>{
 assert.ok(STAGES.includes('finished_private')&&STAGES.includes('rework')&&STAGES.includes('salvage'));
 assert.ok(QA.includes('failed')&&QA.includes('not_applicable'));
 assert.ok(PURPOSES.includes('personal_learning'));assert.equal(POLICY.projectStatusMutation,false);
 assert.equal(POLICY.productMutation,false);assert.equal(POLICY.inventoryMutation,false);
 assert.equal(POLICY.publishToMasterShell,false);assert.equal(POLICY.verifiedProductionCompletion,false);
});
test('657 rejects invented QA completion, future dates, weak review, 100% without supported finish and injected fields',()=>{
 const good=review('a'.repeat(64));
 for(const patch of [{expected_source_revision:'invented'},{source_event_id:0},{progress_percent:100},
   {stage:'completed',progress_percent:100,qa_decision:'not_reviewed'},
   {purpose:'sale_candidate',qa_decision:'not_applicable'},
   {personally_observed:false},{owner_confirmation:false},{project_id:-1},
   {review_note:'not observed'},{observed_at:'2099-01-01T00:00:00.000Z'},
   {buyer_email:'please leak'}])assert.throws(()=>normalizeWorkshopReview({...good,...patch}));
});
test('657 restricts observed QA types and rejects voided or cross-project missing source events',()=>{
 const pass=review('a'.repeat(64)),e=events.map(x=>({...x}));
 assert.equal(assertSourceEvent(pass,e).creative_work_event_id,71);
 assert.throws(()=>assertSourceEvent({...pass,source_event_id:69},e));
 assert.throws(()=>assertSourceEvent({...pass,source_event_id:71},e.map(x=>({...x,entry_status:'voided'}))));
 assert.throws(()=>assertSourceEvent({...pass,source_event_id:222},e));
 assert.equal(assertSourceEvent({...pass,qa_decision:'failed',source_event_id:69},e).event_type,'mistake');
});
test('657 source-private journal rejects externally certified or publicly exposed receipts',()=>{
 assert.throws(()=>decodeJournal({is_public:1,setting_value:JSON.stringify({schema:657,version:1,receipts:[]})}));
 const receipt={receipt_id:crypto.randomUUID(),request_key:crypto.randomUUID(),actor_user_id:7,
   stage:'making',qa_decision:'not_reviewed',independently_verified:true,product_or_stock_changed:false};
 assert.throws(()=>decodeJournal({is_public:0,setting_value:JSON.stringify({schema:657,version:1,receipts:[receipt]})}));
});
test('657 denies unverified/disabled Admin and cross-origin writes before D1 mutation',async()=>{
 const source=db(),body=review('a'.repeat(64));
 for(const denied of [{allowed:false},{role:'customer'},{active:0}]){
   assert.equal((await onRequestGet(ctx(source,denied))).status,401);
   assert.equal((await onRequestPost(ctx(source,{...denied,method:'POST',body}))).status,401);
 }
 assert.equal((await onRequestPost(ctx(source,{method:'POST',body,origin:false}))).status,403);
 assert.equal(source.writes,0);
});
test('657 explicitly reads only real, non-archived projects and their bounded canonical timeline and outputs',async()=>{
 const source=db(),list=await (await onRequestGet(ctx(source))).json();
 assert.equal(list.projects[0].creative_work_project_id,17);
 const details=await current(source);assert.equal(details.project.project_key,'CP-ACTUAL17');
 assert.equal(details.events.length,3);assert.equal(details.outputs.length,1);
 assert.equal(details.version,0);assert.equal(details.master_completion_percent,null);
 assert.equal(details.policy.autoSaleConversion,false);assert.equal(source.writes,0);
 source.project.project_status='archived';assert.equal((await onRequestGet(ctx(source,{query:'?project_id=17'}))).status,404);
});
test('657 real result produces one persisted, source-linked QA owner receipt; original source remains untouched',async()=>{
 const source=db(),originalStatus=source.project.project_status,revision=(await current(source)).source_revision;
 const body=review(revision),r=await onRequestPost(ctx(source,{method:'POST',body})),data=await r.json();
 assert.equal(r.status,200);assert.equal(data.saved,true);assert.equal(data.source_current,true);
 assert.equal(data.receipt.canonical_project_status,'in_progress');
 assert.equal(data.receipt.source_event_type,'result');assert.equal(data.receipt.independently_verified,false);
 assert.equal(data.receipt.product_or_stock_changed,false);assert.equal(source.project.project_status,originalStatus);
 assert.equal(source.writes,1);assert.equal(source.audit.length,1);
 assert.ok(source.docs.has('site.admin.workshop_production.v657.17'));
 const again=await current(source);assert.equal(again.version,1);
 assert.equal(again.current_owner_review.receipt_id,data.receipt.receipt_id);
});
test('657 private learning may finish at 100% without sale, Product or formal commercial QA',async()=>{
 const source=db(),revision=(await current(source)).source_revision;
 const body=review(revision,{stage:'finished_private',progress_percent:100,purpose:'personal_learning',
   qa_decision:'not_applicable',source_event_id:70});
 const response=await onRequestPost(ctx(source,{method:'POST',body}));
 assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.receipt.stage,'finished_private');assert.equal(data.receipt.source_event_type,'lesson');
 assert.equal(data.original_project_status_updated,false);assert.equal(source.project.product_id,null);
});
test('657 cannot claim a terminal workshop review while canonical project is still an unstarted idea',async()=>{
 const source=db();source.project.project_status='idea';
 const revision=(await current(source)).source_revision;
 const body=review(revision,{stage:'finished_private',progress_percent:100,
   purpose:'personal_learning',qa_decision:'not_applicable',source_event_id:70});
 const response=await onRequestPost(ctx(source,{method:'POST',body}));
 assert.equal(response.status,409);assert.equal((await response.json()).code,'CANONICAL_STAGE_HOLD');
 assert.equal(source.writes,0);
});
test('657 supports genuine failed/rework/salvage decisions without stock or automatic sale',async()=>{
 const source=db(),revision=(await current(source)).source_revision;
 assert.equal((await onRequestPost(ctx(source,{method:'POST',body:review(revision,{stage:'rework',
   qa_decision:'rework_required',source_event_id:69,progress_percent:40})}))).status,200);
 const next=await current(source);
 assert.equal((await onRequestPost(ctx(source,{method:'POST',body:review(next.source_revision,{stage:'salvage',
   qa_decision:'salvage_review',source_event_id:69,progress_percent:45,expected_version:next.version})}))).status,200);
 const history=(await current(source)).review_history;assert.equal(history.length,2);
 assert.equal(history[0].stage,'salvage');assert.equal(source.writes,2);
});
test('657 original-request idempotency, conflicting reuse, concurrent CAS, source drift all fail closed',async()=>{
 const source=db(),revision=(await current(source)).source_revision,body=review(revision);
 await onRequestPost(ctx(source,{method:'POST',body}));
 const repeat=await (await onRequestPost(ctx(source,{method:'POST',body}))).json();
 assert.equal(repeat.replayed,true);assert.equal(source.writes,1);
 assert.equal((await onRequestPost(ctx(source,{method:'POST',body:{...body,review_note:'This changed the original owner QA evidence statement significantly.'}}))).status,409);
 assert.equal((await onRequestPost(ctx(source,{method:'POST',body:review(revision)}))).status,409);
 source.project.updated_at='2026-11-09 13:05:01';
 assert.equal((await (await onRequestPost(ctx(source,{method:'POST',body:review(revision,{expected_version:1})}))).json()).code,'SOURCE_DRIFT');
});
test('657 shares one private per-project journal between authorized shop Admins, but no public exposure',async()=>{
 const source=db(),revision=(await current(source)).source_revision,body=review(revision);
 await onRequestPost(ctx(source,{actor:7,method:'POST',body}));
 const view=await (await onRequestGet(ctx(source,{actor:8,query:'?project_id=17'}))).json();
 assert.equal(view.review_history[0].actor_user_id,7);assert.equal(view.version,1);
 const receipt=await (await onRequestGet(ctx(source,{actor:8,query:'?project_id=17&request_key='+body.request_key}))).json();
 assert.equal(receipt.found,true);assert.equal(source.writes,1);
 source.project.project_status='archived';
 const original=await (await onRequestGet(ctx(source,{actor:8,query:'?project_id=17&request_key='+body.request_key}))).json();
 assert.equal(original.found,true,'Original uncertain review receipt remains recoverable even after project archive.');
});
test('657 rejects concurrent protected journal write without silently overwriting source',async()=>{
 const source=db(),revision=(await current(source)).source_revision;source.conflict=true;
 const r=await onRequestPost(ctx(source,{method:'POST',body:review(revision)}));
 assert.equal(r.status,409);assert.equal((await r.json()).code,'STALE_WORKSHOP_REVIEW');
 assert.equal(source.audit.length,0);
});
test('657 Creators page and API have guarded route ownership, accessible manual source inspection and bounded code',()=>{
 assert.equal(moduleKeyForPath('/admin/workshop-production/'),MODULE_KEYS.CREATORS);
 assert.equal(moduleKeyForPath('/api/admin/workshop-production-657'),MODULE_KEYS.CREATORS);
 const page=readFileSync(resolve(root,'admin/workshop-production/index.html'),'utf8');
 const client=readFileSync(resolve(root,'public/js/admin-workshop-production-657.js'),'utf8');
 const api=readFileSync(resolve(root,'functions/api/admin/workshop-production-657.js'),'utf8');
 assert.match(page,/<h1>Workshop production/);assert.match(page,/role="status" aria-live="polite"/);
 assert.match(page,/id="dd657Confirm" type="checkbox" required/);
 assert.match(page,/private-learning QA not applicable/i);
 assert.match(client,/addEventListener\('submit'/);
 assert.doesNotMatch(client,/setTimeout\(|setInterval\(/);
 assert.doesNotMatch(api,/UPDATE creative_work_projects|UPDATE creative_work_events|UPDATE products|UPDATE site_item_inventory/);
 assert.match(api,/WHERE setting_key=\?/);assert.match(api,/is_public=0 AND setting_value=\?/);
});
