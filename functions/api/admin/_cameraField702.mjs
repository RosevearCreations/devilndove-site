// Build 702. Server-owned D1 audit; Cloudflare R2 HEAD proof is supplied
// only by the authenticated same-owner original camera endpoint.
import {jsonResponse} from '../_lib/adminAudit.js';

const out=(value,status=200)=>jsonResponse({build:702,...value},status,{'Cache-Control':'private, no-store'});
const parse=x=>{try{return JSON.parse(String(x||''))}catch{return null}};
const goodId=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;
const noteOK=x=>typeof x==='string'&&x.trim().length>=25&&x.trim().length<=600;
const nonceOK=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{16,100}$/.test(x);
const isoTime=t=>Date.parse(String(t||'').replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));
const tuple=m=>[m.kind,m.attachment_id,m.r2_key,m.r2_bytes,m.confirmed,m.publication_status];
export const sameMedia702=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 JSON.stringify(a.map(tuple))===JSON.stringify(b.map(tuple));
export function reattestationReady702(original,live,flags,note,client,ready701){
 return original?.build===701&&original.owner_reported_real_phone===true&&
 original.independent_device_witness_verified===false&&
 live?.bounded_rows===true&&sameMedia702(original.media_snapshot,live.media)&&
 ready701(live,flags,note,client);
}
export function canCloseMedia702(open,media,reattest,live,now=Date.now()){
 if(open?.kind!=='linked'||!goodId(open.attachment_id)||!open.r2_key||
 !media?.confirmed||media.kind!==open.media_kind||
 Number(media.attachment_id)!==Number(open.attachment_id)||
 media.r2_key!==open.r2_key||Number(media.r2_bytes)<=0||
 (media.kind==='video'&&media.publication_status!=='internal_review'))return false;
 const observed=isoTime(reattest?.issued_at);
 return !!reattest?.owner_re_attested&&
 reattest?.original_701_receipt_id===open.original_701_receipt_id&&
 sameMedia702(reattest.media_snapshot,live?.media)&&
 Number.isFinite(observed)&&observed<=now+300000&&now-observed>=-300000&&now-observed<=86400000;
}
// Build 703: age from durable D1-created timestamp, not client clock.
export function ageMedia703(open,now=Date.now()){
 const timestamp=isoTime(open?.opened_at);
 const valid=Number.isFinite(timestamp)&&timestamp<=now+300000&&now-timestamp>=-300000;
 const ageMinutes=valid?Math.max(0,Math.floor((now-timestamp)/60000)):null;
 return {receipt_id:open?.receipt_id||null,age_minutes:ageMinutes,
   age_hours:ageMinutes===null?null:Math.floor(ageMinutes/60),
   escalation_due:!open?.closed&&valid&&ageMinutes>=1440,
   status:open?.closed?'CLOSED_LINKED_RECOVERY_ONLY':
     !valid?'HOLD_INVALID_SOURCE_TIMESTAMP':
     ageMinutes>=2880?'CRITICAL_ORIGINAL_MEDIA_EXCEPTION_AGED_48H':
     ageMinutes>=1440?'ESCALATE_ORIGINAL_MEDIA_EXCEPTION_24H':
     'OPEN_ORIGINAL_MEDIA_EXCEPTION_HOLD'};
}
export function mediaEscalationEligible703(caseInfo,aged,existing){
 return !!caseInfo&&!caseInfo.closed&&!!aged?.escalation_due&&
   Number.isSafeInteger(Number(caseInfo.receipt_id))&&Number(caseInfo.receipt_id)>0&&
   !existing.some(x=>Number(x.data?.open_receipt_id)===Number(caseInfo.receipt_id));
}
export async function handleCamera702({db,form,adminUser,id,token,live,ready701}){
 const action=String(form.get('action')||'');
 const auditRows=await db.prepare(
 "SELECT admin_action_audit_id,action_type,created_at,details_json FROM admin_action_audit "+
 "WHERE target_type='product' AND target_id=? AND actor_user_id=? "+
 "AND action_type IN ('camera701_owner_field_receipt','camera702_owner_reattest','camera702_media_issue_open','camera702_media_issue_close','camera703_media_aging_escalation') "+
 "ORDER BY admin_action_audit_id DESC LIMIT 81").bind(id,adminUser.user_id).all();
 const raw=Array.isArray(auditRows?.results)?auditRows.results:[];
 if(raw.length>80)return out({ok:false,error:'Unbounded original device receipt history; independent review required. HOLD.'},409);
 const history=raw.map(row=>({...row,data:parse(row.details_json)}));
 const accepted=history.find(row=>row.action_type==='camera701_owner_field_receipt'&&
  row.data?.build===701&&row.data.product_id===id&&
  row.data.capture_reference===token&&row.data.actor_user_id===Number(adminUser.user_id)&&
  row.data.owner_reported_real_phone===true);
 const original=accepted?.data,originalId=Number(accepted?.admin_action_audit_id||0);
 const reattestations=history.filter(x=>x.action_type==='camera702_owner_reattest'&&
   x.data?.original_701_receipt_id===originalId);
 const latest=reattestations[0]||null;
 const closed=new Set(history.filter(x=>x.action_type==='camera702_media_issue_close')
   .map(x=>Number(x.data?.open_receipt_id||0)));
 const cases=history.filter(x=>x.action_type==='camera702_media_issue_open'&&
   x.data?.original_701_receipt_id===originalId)
   .map(x=>({receipt_id:Number(x.admin_action_audit_id),kind:x.data.kind,
    media_kind:x.data.media_kind,attachment_id:x.data.attachment_id,
    r2_key:x.data.r2_key,opened_at:x.created_at,
    closed:closed.has(Number(x.admin_action_audit_id))}));
 const escalationRecords=history.filter(x=>x.action_type==='camera703_media_aging_escalation'&&
   x.data?.original_701_receipt_id===originalId);
 const aging=cases.map(x=>({...ageMedia703(x),escalated:escalationRecords.some(e=>
     Number(e.data?.open_receipt_id)===x.receipt_id)}));
 const state=()=>out({ok:true,status:original?'OWNER_701_SOURCE_FOUND':'HOLD_ORIGINAL_PHONE_701_REQUIRED',
  product_id:id,original_701_receipt_id:originalId,
  reattest_receipt_id:Number(latest?.admin_action_audit_id||0),
  media:live,exceptions:cases.slice(0,50),
  unresolved_count:cases.filter(x=>!x.closed).length,
  exception_aging_703:aging.slice(0,50),
  escalation_due_count:aging.filter(x=>x.escalation_due&&!x.escalated).length,
  critical_aging_count:aging.filter(x=>x.status==='CRITICAL_ORIGINAL_MEDIA_EXCEPTION_AGED_48H').length,
  independently_authenticated_phone:false,
  unrecorded_upload_recovery_certified:false,publication_performed:false});
 if(action==='camera702_inspect'||action==='camera703_inspect')return state();
 if(!original)return out({ok:false,error:'Original owner-reported Build 701 receipt required. HOLD.'},409);
 const note=String(form.get('owner_device_notes')||'').trim();
 const nonce=String(form.get('nonce')||'');
 if(!noteOK(note)||!nonceOK(nonce))
  return out({ok:false,error:'Owner notes (25–600 characters) and a fresh operation nonce are required.'},400);
 const append=async(type,extra,purpose)=>{
   const key='camera702-'+id+'-'+purpose+'-'+nonce;
   const details=JSON.stringify({build:702,product_id:id,capture_reference:token,
     actor_user_id:Number(adminUser.user_id),original_701_receipt_id:originalId,
     issued_at:new Date().toISOString(),owner_review_note:note,
     physical_phone_independently_verified:false,automatic_publication:false,
     unrecorded_uploads_certified:false,...extra});
   const result=await db.prepare(
     "INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
     "SELECT ?,?,'product',?,?,'POST','/api/admin/mobile-create-product',?,CURRENT_TIMESTAMP "+
     "WHERE NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE actor_user_id=? AND action_type=? AND target_key=?)")
    .bind(adminUser.user_id,type,id,key,details,adminUser.user_id,type,key).run();
   if(!result?.success||Number(result?.meta?.changes)!==1)
    throw Error('Original device evidence nonce duplicated, pending or not committed. Inspect the ledger before retry. HOLD.');
   const saved=await db.prepare(
    'SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE actor_user_id=? AND target_id=? AND action_type=? AND target_key=? LIMIT 2')
    .bind(adminUser.user_id,id,type,key).all();
   const list=saved?.results||[];
   if(list.length!==1||list[0].details_json!==details)
    throw Error('Unique original device evidence did not read back. HOLD.');
   return Number(list[0].admin_action_audit_id);
 };
 if(action==='camera702_reattest'){
   const flags=parse(form.get('owner_checklist_json')),
     snapshot=parse(form.get('media_snapshot_json'));
   if(!reattestationReady702(original,live,flags,note,snapshot,ready701))
    return out({ok:false,error:'Fresh original D1/R2 objects, 701 source and all phone checks must match. Missing links remain HOLD.'},409);
   const receipt=await append('camera702_owner_reattest',{
    owner_re_attested:true,owner_reported_physical_phone:true,
    owner_checklist:flags,media_snapshot:live.media,
    original_media_snapshot:original.media_snapshot,
    source_status:'OWNER_REATTESTED_SAME_DRAFT_LIVE_R2_HEAD_NO_INDEPENDENT_PHONE_WITNESS'},'reattest');
   return out({ok:true,status:'OWNER_REATTESTED_LINKED_MEDIA_ONLY',receipt_id:receipt,
    independently_authenticated_phone:false,publication_performed:false});
 }
 if(action==='camera702_triage_open'){
   const kind=String(form.get('exception_kind')||''),
    mediaKind=String(form.get('media_kind')||''),
    attachment=Number(form.get('attachment_id')||0);
   if(!['linked','unrecorded'].includes(kind)||!['photo','video'].includes(mediaKind))
    return out({ok:false,error:'Choose a linked R2 failure or an explicitly unrecorded photo/video upload.'},400);
   const item=kind==='linked'?live.media?.find(m=>m.kind===mediaKind&&m.attachment_id===attachment):null;
   if(kind==='linked'&&(!item||item.confirmed)||
     kind==='unrecorded'&&attachment!==0)
    return out({ok:false,error:'A linked failure requires a missing exact original R2 object; unrecorded uploads require HOLD.'},409);
   if(cases.some(x=>!x.closed&&x.kind===kind&&x.media_kind===mediaKind&&
      (kind==='unrecorded'||x.attachment_id===attachment)))
    return out({ok:false,error:'An unresolved case already exists for this same draft/media. HOLD.'},409);
   const receipt=await append('camera702_media_issue_open',{
    kind,media_kind:mediaKind,attachment_id:kind==='linked'?attachment:0,
    r2_key:item?.r2_key||null,observed_r2_bytes:item?.r2_bytes||0,
    status:'OPEN_MEDIA_UPLOAD_EXCEPTION_SAME_ORIGINAL_DRAFT',
    unrecorded_upload_declared_by_owner:kind==='unrecorded',
    independently_verified_media_recovered:false},'open');
   return out({ok:true,status:'MEDIA_EXCEPTION_OPEN_HOLD',receipt_id:receipt,
    unrecorded_upload_recovery_certified:false,publication_performed:false});
 }
 if(action==='camera702_triage_close'){
   const openId=Number(form.get('open_receipt_id')),
    caseInfo=cases.find(x=>x.receipt_id===openId&&!x.closed&&x.kind==='linked'),
    current=live.media?.find(x=>x.kind===caseInfo?.media_kind&&
      x.attachment_id===caseInfo?.attachment_id);
   if(!caseInfo||!goodId(latest?.admin_action_audit_id)||
     !canCloseMedia702({...caseInfo,original_701_receipt_id:originalId},
      current,latest.data,live))
    return out({ok:false,error:'Only a linked R2 object restored with current owner re-attestation may close. Unrecorded uploads remain HOLD.'},409);
   const receipt=await append('camera702_media_issue_close',{
    status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',open_receipt_id:openId,
    reattest_receipt_id:Number(latest.admin_action_audit_id),
    media_kind:caseInfo.media_kind,attachment_id:caseInfo.attachment_id,
    r2_key:current.r2_key,verified_r2_bytes:current.r2_bytes,
    original_financial_close:false},'close');
   return out({ok:true,status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',
    receipt_id:receipt,open_receipt_id:openId,
    unrecorded_upload_recovery_certified:false,publication_performed:false});
 }
 if(action==='camera703_escalate'){
   const openId=Number(form.get('open_receipt_id'));
   const caseInfo=cases.find(x=>x.receipt_id===openId);
   const aged=ageMedia703(caseInfo);
   if(!mediaEscalationEligible703(caseInfo,aged,escalationRecords))
     return out({ok:false,error:'Aging escalation requires an actual unresolved original receipt older than 24 hours with no prior escalation. Invalid timestamps remain HOLD.'},409);
   const receipt=await append('camera703_media_aging_escalation',{
     build:703,open_receipt_id:openId,media_kind:caseInfo.media_kind,
     exception_kind:caseInfo.kind,age_minutes_at_review:aged.age_minutes,
     source_opened_at:caseInfo.opened_at,source_r2_key:caseInfo.r2_key,
     escalation_reason:'UNRESOLVED_ORIGINAL_PHONE_MEDIA_EXCEPTION_24H',
     owner_followup_required:true,unrecorded_uploads_certified:false,
     physical_phone_independently_verified:false,
     status:'ESCALATED_UNRESOLVED_ORIGINAL_MEDIA_EXCEPTION_HOLD'
   },'escalate');
   return out({ok:true,status:'ESCALATED_UNRESOLVED_ORIGINAL_MEDIA_EXCEPTION_HOLD',
     receipt_id:receipt,open_receipt_id:openId,source_age_minutes:aged.age_minutes,
     independently_verified_upload_recovery:false,publication_performed:false});
 }
 return out({ok:false,error:'Unsupported Build 702/703 action.'},400);
}
