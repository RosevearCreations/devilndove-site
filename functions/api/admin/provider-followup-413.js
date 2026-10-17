// Release 467 Build 413 — bounded, local-only escalation SLA / handoff / follow-up evidence.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft,keyValid} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
import {assigneeId,currentAssignment,localSourceReview} from '../_lib/providerWorkQueue412.mjs';
import {HANDOFF_TYPE,FOLLOWUP_TYPE,FOLLOWUP_PLANS,slaStatus,handoffStatus,followupReadiness,canAct} from '../_lib/providerFollowup413.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:413,provider_called:false,publication_performed:false,
 automatic_retry:false,us_shipping_suspended:true,notifications_sent:false,...v},status,{'Cache-Control':'no-store'});
const latest="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const keySQL="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const adminSQL="SELECT user_id,display_name FROM users WHERE lower(role)='admin' AND is_active=1 ORDER BY user_id LIMIT 40";
const queueSQL="SELECT admin_action_audit_id,details_json,created_at,target_type,target_key FROM admin_action_audit WHERE action_type='provider_evidence_411_escalation' AND target_type IN ('marketplace_draft','product') ORDER BY admin_action_audit_id DESC LIMIT 100";
const scope=(dest,pid,did)=>({type:dest==='etsy'?'marketplace_draft':'product',key:dest==='etsy'?String(did):String(pid)});
function auth(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:reply({error:'Verified active Admin required.'},401)}:
 !db?{error:reply({error:'D1 unavailable.'},503)}:{admin,db};}
async function admins(db){const data=await db.prepare(adminSQL).all();return (data?.results||[]).filter(x=>assigneeId(x.user_id)).map(x=>({user_id:Number(x.user_id),display_name:String(x.display_name||'').slice(0,90)}));}
async function load(db,destination,id,draftId,people){
 const sc=scope(destination,id,draftId);
 const [product,draft,claim,verified,caseReceipt,policyReceipt,intent,snapshot,escalation,assigned,handoff,followup]=await Promise.all([
 db.prepare("SELECT product_id,name,price_cents,inventory_quantity FROM products WHERE product_id=? LIMIT 1").bind(id).first(),
 destination==='etsy'?db.prepare("SELECT id,product_id,channel_key,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1").bind(draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_trial_claimed',sc.type,sc.key).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_reconciled',sc.type,sc.key).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_trial_410_case_review',sc.type,sc.key).first():Promise.resolve(null),
 db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id),destination).first(),
 db.prepare(latest).bind('product_channel_intent_405','product',String(id)).first(),
 db.prepare(latest).bind('provider_evidence_411_snapshot',sc.type,sc.key).first(),
 db.prepare(latest).bind('provider_evidence_411_escalation',sc.type,sc.key).first(),
 db.prepare(latest).bind('provider_escalation_412_assignment',sc.type,sc.key).first(),
 db.prepare(latest).bind(HANDOFF_TYPE,sc.type,sc.key).first(),
 db.prepare(latest).bind(FOLLOWUP_TYPE,sc.type,sc.key).first()
 ]);
 if(!product||(destination==='etsy'&&(!draft||Number(draft.product_id)!==id)))return null;
 const sr=localSourceReview({destination,product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent:intent,latestSnapshot:snapshot,latestEscalation:escalation});
 const assignment=currentAssignment(assigned),escalationOpen=sr.escalation.status==='OPEN_OWNER_REVIEW';
 const acceptedAssignment=assignment.claimed_escalation_receipt===sr.escalation.receipt?assignment:{...assignment,assignee_user_id:null};
 const hs=handoffStatus({latestHandoff:handoff,assignment:acceptedAssignment,escalationReceipt:sr.escalation.receipt});
 const readiness=followupReadiness({escalationOpen,assignedActive:people.some(p=>p.user_id===acceptedAssignment.assignee_user_id),
 assignment:acceptedAssignment,handoff:hs,sourceSnapshotCurrent:sr.governance.source_matches_snapshot&&!sr.governance.review_due,
 latestFollowup:followup,escalationReceipt:sr.escalation.receipt});
 return {sc,product,source:sr,assignment:acceptedAssignment,handoff:hs,handoffRow:handoff,followupRow:followup,readiness,
 escalationRow:escalation,escalationOpen,escalationReceipt:sr.escalation.receipt,
 sla:slaStatus({escalatedAt:escalation?.created_at,isOpen:escalationOpen})};
}
function summary(s,people,viewer){
 return {destination:s.source.state.destination,product_id:Number(s.product.product_id),
 product_name:String(s.product.name||'').slice(0,150),draft_id:s.source.state.draft_id,
 outcome:s.source.state.outcome,escalation_status:s.source.escalation.status,
 sla:s.sla,assigned_user_id:s.assignment.assignee_user_id,
 viewer_user_id:viewer.user_id,admins:people,handoff:s.handoff,followup:s.readiness,
 source_snapshot_current:s.source.governance.source_matches_snapshot&&!s.source.governance.review_due,
 source_signature:s.source.signature,evidence_receipts:{escalation:s.escalationReceipt,assignment:s.assignment.receipt,
 handoff:s.handoff.receipt,followup:s.readiness.latest_receipt,snapshot:s.source.governance.snapshot_receipt},
 provider_state_checked_now:false,provider_writes_allowed:false,followup_is_local_evidence_only:true};
}
async function queue(db,people){
 const rows=(await db.prepare(queueSQL).all())?.results||[],seen=new Set(),out=[];
 for(const r of rows){const d=parseReceipt(r),key=r.target_type+':'+r.target_key;
  if(seen.has(key))continue;seen.add(key);
  if(d.decision!=='OPEN_OWNER_REVIEW'||!productIdValid(d.product_id)||!['etsy','facebook'].includes(d.destination)||
  d.destination==='etsy'&&!uuidDraft(d.draft_id))continue;
  const sc=scope(d.destination,d.product_id,d.draft_id);
  if(sc.type!==r.target_type||sc.key!==r.target_key)continue;
  // One bounded local D1 read per case, instead of 3 per case (Pages subrequest budget).
  const entries=(await db.prepare("SELECT admin_action_audit_id,action_type,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN ('provider_escalation_412_assignment','provider_escalation_413_handoff','provider_escalation_413_followup') ORDER BY admin_action_audit_id DESC LIMIT 90").bind(sc.type,sc.key).all())?.results||[];
  const latestType=type=>entries.find(x=>x.action_type===type)||null;
  const assigned=latestType('provider_escalation_412_assignment'),
   handoff=latestType(HANDOFF_TYPE),followup=latestType(FOLLOWUP_TYPE);
  const a=currentAssignment(assigned),effective=a.claimed_escalation_receipt===r.admin_action_audit_id?a:{...a,assignee_user_id:null};
  const hs=handoffStatus({latestHandoff:handoff,assignment:effective,escalationReceipt:r.admin_action_audit_id});
  const sla=slaStatus({escalatedAt:r.created_at,isOpen:true});
  out.push({product_id:Number(d.product_id),destination:d.destination,draft_id:d.draft_id||null,
   escalation_receipt:r.admin_action_audit_id,escalated_at:r.created_at,
   assigned_user_id:effective.assignee_user_id,assignee_active:people.some(x=>x.user_id===effective.assignee_user_id),
   handoff_status:hs.status,last_followup_receipt:followup?.admin_action_audit_id||0,
   sla_status:sla.status,initial_due_at:sla.initial_due_at,followup_due_at:sla.followup_due_at,
   provider_writes_allowed:false});
  if(out.length===20)break;
 }
 return {items:out,count:out.length,scan_limit:100,return_limit:20,older_cases_may_be_omitted:true,
 no_automatic_notifications:true,provider_state_checked_now:false};
}
export async function onRequestGet(c){
 const g=auth(c);if(g.error)return g.error;
 const u=new URL(c.request.url),mode=u.searchParams.get('mode')||'queue';
 try{
 if(mode==='queue'){const people=await admins(g.db);return reply(await queue(g.db,people));}
 if(mode!=='detail')return reply({error:'Unsupported mode.'},400);
 const destination=u.searchParams.get('destination'),pid=u.searchParams.get('product_id'),did=u.searchParams.get('draft_id');
 if(!productIdValid(pid)||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!uuidDraft(did)))
  return reply({error:'Valid Product/destination and existing Etsy draft required.'},400);
 const people=await admins(g.db),s=await load(g.db,destination,Number(pid),did,people);
 return s?reply(summary(s,people,g.admin)):reply({error:'Product or Etsy draft not found.'},404);
 }catch{return reply({error:'Local SLA or owner review cannot be read. No provider call.'},503);}
}
export async function onRequestPost(c){
 const g=auth(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'Valid JSON required.'},400);}
 const action=b?.action,dest=b?.destination,pid=b?.product_id,did=b?.draft_id;
 if(!['request_handoff','ack_handoff','record_followup'].includes(action)||!productIdValid(pid)||
 !['etsy','facebook'].includes(dest)||(dest==='etsy'&&!uuidDraft(did))||!keyValid(b?.request_key)||
 !/^[a-f0-9]{8}$/.test(String(b?.expected_source_signature||''))||
 !Number.isSafeInteger(b?.expected_escalation_receipt)||b.expected_escalation_receipt<=0||
 !Number.isSafeInteger(b?.expected_assignment_receipt)||b.expected_assignment_receipt<=0||
 !Number.isSafeInteger(b?.expected_handoff_receipt)||b.expected_handoff_receipt<0||
 !Number.isSafeInteger(b?.expected_followup_receipt)||b.expected_followup_receipt<0)
 return reply({error:'Valid action, Product, source signature and immutable receipt expectations required.'},400);
 const sc=scope(dest,Number(pid),did),type=action==='record_followup'?FOLLOWUP_TYPE:HANDOFF_TYPE;
 try{
 const previous=await g.db.prepare(keySQL).bind(HANDOFF_TYPE,FOLLOWUP_TYPE,sc.type,sc.key,b.request_key).first();
 if(previous){const x=parseReceipt(previous);return x.action===action&&x.product_id===Number(pid)&&x.destination===dest?
  reply({receipt:previous.admin_action_audit_id,idempotent:true}):reply({error:'Request key already used for different operation.'},409);}
 const people=await admins(g.db),s=await load(g.db,dest,Number(pid),did,people);
 if(!s)return reply({error:'Product/draft missing.'},404);
 if(s.source.signature!==b.expected_source_signature||s.escalationReceipt!==b.expected_escalation_receipt||
 s.assignment.receipt!==b.expected_assignment_receipt||s.handoff.receipt!==b.expected_handoff_receipt||
 s.readiness.latest_receipt!==b.expected_followup_receipt)
 return reply({error:'Escalation, assignment or prior evidence changed; reload.',blockers:['stale_owner_evidence']},409);
 if(!canAct({action,viewerId:g.admin.user_id,assignment:s.assignment,admins:people,handoff:s.handoff,
 readiness:s.readiness,source:s.source,body:b,escalationOpen:s.escalationOpen}))
 return reply({error:'Only active assigned Admin may acknowledge or plan follow-up. Handoff requires Build 412 reassignment first.',blockers:s.readiness.blockers},409);
 const detail={build:413,action,request_key:b.request_key,product_id:Number(pid),destination:dest,
  draft_id:dest==='etsy'?did:null,escalation_receipt:s.escalationReceipt,
  assignment_receipt:s.assignment.receipt,previous_handoff_receipt:s.handoff.receipt,
  previous_followup_receipt:s.readiness.latest_receipt,source_signature:s.source.signature,
  owner_note:b.owner_note.trim(),from_user_id:action==='request_handoff'?s.assignment.assignee_user_id:s.handoff.from_user_id,
  target_user_id:action==='request_handoff'?Number(b.target_user_id):s.handoff.target_user_id,
  request_receipt:action==='ack_handoff'?s.handoff.request_receipt:null,
  base_assignment_receipt:action==='ack_handoff'?s.assignment.receipt:null,
  plan:action==='record_followup'?b.plan:null,confirmed_manual_owner_followup:action==='record_followup',
  no_provider_retry:true,no_publication:true,us_shipping_suspended:true,provider_called:false,
  publication_performed:false,automatic_notifications:false,local_only:true};
 // Atomic optimistic fence on the four independent latest receipts plus request key.
 const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='provider_evidence_411_escalation' AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='provider_escalation_412_assignment' AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
 const saved=await g.db.prepare(sql).bind(g.admin.user_id,type,sc.type,sc.key,new URL(c.request.url).pathname,JSON.stringify(detail),
  sc.type,sc.key,s.escalationReceipt,sc.type,sc.key,s.assignment.receipt,
  HANDOFF_TYPE,sc.type,sc.key,s.handoff.receipt,FOLLOWUP_TYPE,sc.type,sc.key,s.readiness.latest_receipt,
  HANDOFF_TYPE,FOLLOWUP_TYPE,sc.type,sc.key,b.request_key).run();
 if(Number(saved?.meta?.changes||0)!==1)return reply({error:'Concurrent escalation, assignment or evidence change. Reload before repeating.'},409);
 const confirmed=await g.db.prepare(keySQL).bind(HANDOFF_TYPE,FOLLOWUP_TYPE,sc.type,sc.key,b.request_key).first();
 if(!confirmed||parseReceipt(confirmed).action!==action)return reply({error:'Receipt cannot be confirmed; reload local audit.'},409);
 return reply({receipt:confirmed.admin_action_audit_id,action,
  message:action==='request_handoff'?'Handoff requested locally. Reassign with Build 412, then target Admin acknowledges.':
  action==='ack_handoff'?'Handoff acknowledged by assigned Admin. No provider change.':
  'Manual owner follow-up plan recorded locally; no notification or remote action sent.'});
 }catch{return reply({error:'Local audit outcome uncertain; reload. No provider request was made.'},503);}
}
