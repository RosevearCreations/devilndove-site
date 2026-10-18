// Release 467 Build 421 — bounded read-only Admin review of local exception follow-up receipts.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {TYPE as APPROVAL_TYPE} from '../_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE} from '../_lib/providerReopenDecision419.mjs';
import {FOLLOWUP_TYPE} from '../_lib/providerFollowup413.mjs';
import {COMPLETION_TYPE} from '../_lib/providerCompletion414.mjs';
import {reconcileContinuity420} from '../_lib/providerReopenContinuity420.mjs';
import {reviewExceptionFollowup421} from '../_lib/providerExceptionFollowup421.mjs';
const reply=(d,status=200)=>Response.json({ok:status<400,build:421,read_only:true,
 provider_called:false,publication_performed:false,automatic_reopen:false,automatic_closure:false,
 notifications_sent:false,us_shipping_suspended:true,...d},
 {status,headers:{'Cache-Control':'no-store'}});
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'Local audit D1 unavailable.'},503);
 const u=new URL(c.request.url),dest=u.searchParams.get('destination'),
  pid=u.searchParams.get('product_id'),draft=u.searchParams.get('draft_id');
 if(u.searchParams.get('mode')!=='detail'||!['etsy','facebook'].includes(dest))
  return reply({error:'Select an existing case in explicit detail mode.'},400);
 try{
  const evidence=await read414(c);
  if(!evidence.ok)return evidence;
  const snapshot=await evidence.json();
  if(!snapshot?.ok||!snapshot.evidence_receipts||String(snapshot.product_id)!==String(pid)||
   snapshot.destination!==dest||(dest==='etsy'&&snapshot.draft_id!==draft))
   return reply({error:'Exact Product/draft evidence unavailable.'},409);
  const targetType=dest==='etsy'?'marketplace_draft':'product',
   targetKey=dest==='etsy'?draft:pid;
  const statement=
   'SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit '+
   'WHERE target_type=? AND target_key=? AND action_type IN (?,?) ORDER BY admin_action_audit_id DESC LIMIT 101';
  const [decisions,followups]=await Promise.all([
   db.prepare(statement).bind(targetType,targetKey,APPROVAL_TYPE,DECISION_TYPE).all(),
   db.prepare(statement).bind(targetType,targetKey,FOLLOWUP_TYPE,COMPLETION_TYPE).all()
  ]);
  const decisionsRows=decisions?.results||[],followupRows=followups?.results||[];
  const continuity=reconcileContinuity420({
   rows:decisionsRows.slice(0,100),snapshot,scanComplete:decisionsRows.length<101
  });
  const review=reviewExceptionFollowup421({
   continuity,sourceRows:followupRows.slice(0,100),snapshot,scanComplete:followupRows.length<101
  });
  return reply({product_id:snapshot.product_id,destination:dest,
   decision_continuity:{status:continuity.status,holds:continuity.holds,
    latest_decision_receipt:continuity.latest_decision_receipt,scan_complete:continuity.scan_complete},
   exception_followup_review:review,
   operator_action:'Inspect exact immutable receipts and verify provider state separately. A local receipt never resolves an exception automatically.'});
 }catch{return reply({error:'Audit follow-up evidence unavailable; no state changes authorized.'},503);}
}
