// Build 420 — verified Admin-only and bounded read-only owner decision continuity.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {TYPE as APPROVAL_TYPE} from '../_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE} from '../_lib/providerReopenDecision419.mjs';
import {reconcileContinuity420} from '../_lib/providerReopenContinuity420.mjs';
const reply=(o,status=200)=>Response.json({ok:status<400,build:420,read_only:true,
 provider_called:false,automatic_reopen:false,publication_performed:false,
 notifications_sent:false,us_shipping_suspended:true,...o},
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
   return reply({error:'Exact current Product/draft evidence unavailable.'},409);
  const targetType=dest==='etsy'?'marketplace_draft':'product',
   targetKey=dest==='etsy'?draft:pid;
  const records=(await db.prepare(
   'SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit '+
   'WHERE target_type=? AND target_key=? AND action_type IN (?,?) ORDER BY admin_action_audit_id DESC LIMIT 101'
  ).bind(targetType,targetKey,APPROVAL_TYPE,DECISION_TYPE).all())?.results||[];
  const continuity=reconcileContinuity420({
   rows:records.slice(0,100),snapshot,scanComplete:records.length<101
  });
  return reply({product_id:snapshot.product_id,destination:dest,
   owner_continuity:continuity,operator_action:'Read original audit receipts; resolve HOLDs with a verified assigned Admin. No provider state changed.'});
 }catch{return reply({error:'Bounded audit history unavailable. No decision was authorized.'},503);}
}
