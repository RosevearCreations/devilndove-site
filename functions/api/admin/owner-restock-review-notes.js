// Release 467 Build 643 — immutable owner review-note history in existing
// private D1 app_settings. Does not edit plans, Products, orders or suppliers.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const PREFIX='site.admin.owner_restock_plans.v641.',LIMIT=10,MAX_EVENTS=50;
const OUTCOMES=new Set(['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended']);
const ID=/^[0-9a-f-]{36}$/;
const reply=(body,status=200)=>jsonResponse({build:643,...body},status,{'Cache-Control':'no-store'});
const num=(v,min,max)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
  return !admin?{error:reply({ok:false,error:'Verified active administrator required.'},401)}:
    !db?{error:reply({ok:false,error:'Private review storage unavailable; no write attempted.',retry_automatically:false},503)}:{admin,db};}
async function ownerPlan(db,ownerId,planId){
  const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
    .bind(`${PREFIX}${ownerId}`).first();
  if(!row||Number(row.is_public)!==0)return null;
  const doc=JSON.parse(row.setting_value);
  if(doc?.schema!==641||!num(doc.version,1,1000000000)||!Array.isArray(doc.plans))throw Error('invalid_owner_plan_document');
  const plan=doc.plans.find(p=>p?.plan_id===planId);
  return plan?{plan,version:doc.version,source_value:row.setting_value}:null;
}
async function read(db,key){
  const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1').bind(key).first();
  if(!row)return {row,doc:{schema:643,version:0,events:[]}};
  if(Number(row.is_public)!==0)throw Error('review_history_not_private');
  const doc=JSON.parse(row.setting_value);
  if(doc?.schema!==643||!num(doc.version,1,1000000000)||!Array.isArray(doc.events)||
    doc.events.length>MAX_EVENTS)throw Error('invalid_review_history');
  return {row,doc};
}
const key=(userId,planId)=>`${PREFIX}${userId}.review.${planId}`;
export async function onRequestGet(context){const a=gate(context);if(a.error)return a.error;
  const params=new URL(context.request.url).searchParams,planId=params.get('plan_id'),before=params.get('before');
  if(!ID.test(planId||'')||(before!==null&&!ID.test(before)))return reply({ok:false,error:'Valid saved plan ID and server-issued history cursor required.'},400);
  try{
    const parent=await ownerPlan(a.db,a.admin.user_id,planId);
    if(!parent)return reply({ok:false,error:'Saved owner plan not found.'},404);
    const {doc}=await read(a.db,key(a.admin.user_id,planId));
    let offset=0;if(before!==null){offset=doc.events.findIndex(x=>x.event_id===before);
      if(offset<0)return reply({ok:false,error:'History cursor is stale. Reload the first page.'},400);
      offset++;}
    const events=doc.events.slice(offset,offset+LIMIT),hasMore=offset+LIMIT<doc.events.length;
    return reply({ok:true,owner_user_id:a.admin.user_id,plan_id:planId,plan_version:parent.version,
      timeline_version:doc.version,events,next_cursor:hasMore?events.at(-1)?.event_id:null,
      private:true,read_only:true,automatic:false,inventory_mutation:false});
  }catch{return reply({ok:false,error:'Owner plan review history could not be verified. No history returned.',retry_automatically:false},503);}
}
export async function onRequestPost(context){const a=gate(context);if(a.error)return a.error;
  if(!context.request.headers.get('content-type')?.toLowerCase().includes('application/json'))
    return reply({ok:false,error:'JSON content type required.'},415);
  let body;try{body=await context.request.json();}catch{return reply({ok:false,error:'Invalid JSON body.'},400);}
  if(!body||!ID.test(body.plan_id||'')||!num(body.expected_plan_version,1,1000000000)||
    !num(body.expected_timeline_version,0,1000000000)||!OUTCOMES.has(body.outcome)||
    typeof body.note!=='string'||body.note.trim().length<8||body.note.trim().length>300||body.note.length>300)
    return reply({ok:false,error:'Choose a verified owner plan, factual 8–300 character note and review outcome.'},400);
  try{
    const ownerId=a.admin.user_id,parent=await ownerPlan(a.db,ownerId,body.plan_id);
    if(!parent)return reply({ok:false,error:'Saved owner plan not found.'},404);
    if(parent.version!==body.expected_plan_version)return reply({ok:false,code:'stale_owner_plan',
      error:'The saved plan changed. Reload the plan before recording a review.',retry_automatically:false},409);
    const storageKey=key(ownerId,body.plan_id),{row,doc}=await read(a.db,storageKey);
    if(doc.version!==body.expected_timeline_version)return reply({ok:false,code:'stale_review_timeline',
      error:'Another review was recorded. Reload its history before adding a note.',retry_automatically:false},409);
    if(doc.events.length>=MAX_EVENTS)return reply({ok:false,code:'review_history_capacity',
      error:'This plan has reached its 50-event private history capacity. No older notes were discarded.',retry_automatically:false},409);
    const event={event_id:crypto.randomUUID(),recorded_at:new Date().toISOString(),outcome:body.outcome,note:body.note.trim(),
      plan_version:parent.version,status_at_review:String(parent.plan.status||'draft'),
      follow_up_on_at_review:String(parent.plan.follow_up_on||'')};
    const next={schema:643,version:doc.version+1,events:[event,...doc.events]},value=JSON.stringify(next);
    if(value.length>60000)return reply({ok:false,error:'History record is at storage capacity. No existing review notes were dropped.'},413);
    const saved=row?await a.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,
      updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?
      AND EXISTS(SELECT 1 FROM app_settings parent WHERE parent.setting_key=? AND parent.is_public=0 AND parent.setting_value=?)`)
      .bind(value,ownerId,storageKey,row.setting_value,`${PREFIX}${ownerId}`,parent.source_value).run():
      await a.db.prepare(`INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at)
        SELECT ?,?,0,?,CURRENT_TIMESTAMP WHERE EXISTS(SELECT 1 FROM app_settings parent
          WHERE parent.setting_key=? AND parent.is_public=0 AND parent.setting_value=?)
        ON CONFLICT(setting_key) DO NOTHING`)
        .bind(storageKey,value,ownerId,`${PREFIX}${ownerId}`,parent.source_value).run();
    if(Number(saved?.meta?.changes)!==1)return reply({ok:false,code:'stale_review_timeline',
      error:'A concurrent plan or review edit won the save race. Reload plans and history before another write.',retry_automatically:false},409);
    let confirmed=false;
    try{const after=await read(a.db,storageKey);
      confirmed=after.doc.version===next.version&&after.doc.events[0]?.event_id===event.event_id;}catch{}
    if(!confirmed)return reply({ok:false,code:'review_save_unverified',
      error:'Review save outcome is uncertain. Reload history; do not retry automatically.',retry_automatically:false},503);
    // Metadata only: the note body is private and excluded from the generic audit UI.
    let audit_recorded=true;
    try{await a.db.prepare(`INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,
      request_method,request_path,details_json,created_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(ownerId,'owner_restock_review_note_recorded','owner_restock_plan',event.event_id,'POST',
        '/api/admin/owner-restock-review-notes',JSON.stringify({plan_id:body.plan_id,outcome:body.outcome,
          private_note:true,plan_version:parent.version,review_version:next.version,inventory_mutation:false})).run();}
    catch{audit_recorded=false;}
    return reply({ok:true,saved:true,owner_user_id:ownerId,plan_id:body.plan_id,plan_version:parent.version,
      timeline_version:next.version,event,audit_recorded,
      warning:audit_recorded?null:'Private note was saved but metadata audit recording failed. Do not repeat the save; ask an administrator to inspect.',
      private:true,inventory_mutation:false,external_actions:false});
  }catch{return reply({ok:false,error:'Private review history or current owner-plan verification unavailable. No automatic retry.',retry_automatically:false},503);}
}
