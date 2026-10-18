// Release 467 Build 414 — verified Admin local-only owner follow-up completion and SLA exceptions.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft,keyValid} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
import {assigneeId,currentAssignment,localSourceReview} from '../_lib/providerWorkQueue412.mjs';
import {HANDOFF_TYPE,FOLLOWUP_TYPE,slaStatus,handoffStatus} from '../_lib/providerFollowup413.mjs';
import {COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE,verifyHandoffChain,governanceProof,
 followupProof,completionProof,exceptionReasons,routeStatus,canRecord} from '../_lib/providerCompletion414.mjs';
const reply=(d,status=200)=>jsonResponse({ok:status<400,build:414,provider_called:false,
 provider_write:false,publication_performed:false,automatic_retry:false,us_shipping_suspended:true,
 notifications_sent:false,...d},status,{'Cache-Control':'no-store'});
const latest="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const keySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type IN (?,?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const adminSql="SELECT user_id,display_name FROM users WHERE lower(role)='admin' AND is_active=1 ORDER BY user_id LIMIT 40";
const queueSql="SELECT admin_action_audit_id,details_json,created_at,target_type,target_key FROM admin_action_audit WHERE action_type='provider_evidence_411_escalation' AND target_type IN ('marketplace_draft','product') ORDER BY admin_action_audit_id DESC LIMIT 100";
const scope=(dest,pid,did)=>({type:dest==='etsy'?'marketplace_draft':'product',key:dest==='etsy'?String(did):String(pid)});
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified active Admin required.'},401)}:
 !db?{error:reply({error:'D1 unavailable.'},503)}:{admin,db};}
async function admins(db){const rows=(await db.prepare(adminSql).all())?.results||[];
 return rows.filter(x=>assigneeId(x.user_id)).map(x=>({user_id:Number(x.user_id),display_name:String(x.display_name||'').slice(0,90)}));}
const auditTypes=[
 'etsy_remote_draft_trial_claimed','etsy_remote_draft_reconciled','etsy_trial_410_case_review',
 'provider_evidence_411_snapshot','provider_evidence_411_escalation','provider_escalation_412_assignment',
 HANDOFF_TYPE,FOLLOWUP_TYPE,COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE
];
async function load(db,dest,pid,did,people){
 const sc=scope(dest,pid,did);
 const [product,draft,intent,policy,evidence]=await Promise.all([
  db.prepare("SELECT product_id,name,price_cents,inventory_quantity FROM products WHERE product_id=? LIMIT 1").bind(pid).first(),
  dest==='etsy'?db.prepare("SELECT id,product_id,channel_key,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1").bind(did).first():Promise.resolve(null),
  db.prepare(latest).bind('product_channel_intent_405','product',String(pid)).first(),
  db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(pid),dest).first(),
  db.prepare("SELECT admin_action_audit_id,action_type,details_json,created_at FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN ('etsy_remote_draft_trial_claimed','etsy_remote_draft_reconciled','etsy_trial_410_case_review','provider_evidence_411_snapshot','provider_evidence_411_escalation','provider_escalation_412_assignment','provider_escalation_413_handoff','provider_escalation_413_followup','provider_escalation_414_completion','provider_escalation_414_sla_exception','provider_escalation_414_handoff_governance') ORDER BY admin_action_audit_id DESC LIMIT 160").bind(sc.type,sc.key).all()
 ]);
 if(!product||(dest==='etsy'&&(!draft||Number(draft.product_id)!==pid)))return null;
 const records=evidence?.results||[];
 const latestType=t=>records.find(x=>x.action_type===t)||null;
 const escalationRow=latestType('provider_evidence_411_escalation'),
  assignmentRow=latestType('provider_escalation_412_assignment'),
  handoffRow=latestType(HANDOFF_TYPE),followupRow=latestType(FOLLOWUP_TYPE),
  completionRow=latestType(COMPLETION_TYPE),routeRow=latestType(ROUTE_TYPE),govRow=latestType(GOVERNANCE_TYPE);
 const source=localSourceReview({destination:dest,product,draft,claim:dest==='etsy'?latestType('etsy_remote_draft_trial_claimed'):null,
  verified:dest==='etsy'?latestType('etsy_remote_draft_reconciled'):null,
  caseReceipt:dest==='etsy'?latestType('etsy_trial_410_case_review'):null,policyReceipt:policy,channelIntent:intent,
  latestSnapshot:latestType('provider_evidence_411_snapshot'),latestEscalation:escalationRow});
 const assignmentReceipt=currentAssignment(assignmentRow),e=source.escalation.receipt,
  assignment=assignmentReceipt.claimed_escalation_receipt===e?assignmentReceipt:{...assignmentReceipt,assignee_user_id:null};
 const handoff=handoffStatus({latestHandoff:handoffRow,assignment,escalationReceipt:e});
 const handoffDetail=parseReceipt(handoffRow),requestId=Number(handoffDetail.request_receipt||0);
 // Build 413 acknowledgement alone cannot be trusted. Independently fetch original saved request by exact receipt.
 const requestRow=handoff.status==='ACKNOWLEDGED'&&Number.isSafeInteger(requestId)&&requestId>0?
  await db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type=? AND target_type=? AND target_key=? LIMIT 1").bind(requestId,HANDOFF_TYPE,sc.type,sc.key).first():null;
 const chain=verifyHandoffChain({handoff,ackRow:handoffRow,requestRow,assignment,escalationReceipt:e});
 const gov=governanceProof({row:govRow,handoffChain:chain,assignment,escalationReceipt:e});
 const followup=followupProof({row:followupRow,assignment,escalationReceipt:e});
 const sourceReady=source.governance.source_matches_snapshot&&!source.governance.review_due;
 const complete=completionProof({row:completionRow,followup,assignment,escalationReceipt:e,
 sourceSignature:source.signature,handoff:chain,governance:gov});
 const sla=slaStatus({escalatedAt:escalationRow?.created_at,isOpen:source.escalation.status==='OPEN_OWNER_REVIEW'});
 const active=people.some(u=>u.user_id===assignment.assignee_user_id),open=source.escalation.status==='OPEN_OWNER_REVIEW';
 const issues=exceptionReasons({sla,escalationOpen:open,assignedActive:active,assignment,
  sourceCurrent:sourceReady,handoff:chain,governance:gov,followup,completion:complete});
 const route=routeStatus({row:routeRow,escalationReceipt:e,assignment,followup,sourceSignature:source.signature});
 return {sc,product,source,escalationRow,assignment,handoff:chain,gov,followup,complete,sla,active,open,auditCount:records.length,
  sourceReady,issues,route,routeRow,completionRow,govRow,handoffRow,followupRow,
  receipts:{escalation:e,assignment:assignment.receipt,handoff:handoff.receipt,followup:followup.receipt,
    completion:complete.receipt,route:route.receipt,governance:gov.receipt}};
}
function summary(s,people,admin){
 return {product_id:Number(s.product.product_id),product_name:String(s.product.name||'').slice(0,150),
 destination:s.source.state.destination,draft_id:s.source.state.draft_id,escalation_status:s.source.escalation.status,
 source_signature:s.source.signature,source_snapshot_current:s.sourceReady,assigned_user_id:s.assignment.assignee_user_id,
 viewer_user_id:admin.user_id,admins:people,sla:s.sla,handoff:s.handoff,governance:s.gov,
 followup:s.followup,completion:s.complete,exception_reasons:s.issues,route:s.route,
 evidence_receipts:s.receipts,scan_limit:160,evidence_scan_exhausted:s.auditCount<160,provider_status_verified_now:false,
 publication_allowed:false,notifications_sent:false};
}
async function queue(db,people){
 const rows=(await db.prepare(queueSql).all())?.results||[],seen=new Set(),items=[];
 for(const r of rows){const v=parseReceipt(r),key=r.target_type+':'+r.target_key;
  if(seen.has(key))continue;seen.add(key);
  if(v.decision!=='OPEN_OWNER_REVIEW'||!productIdValid(v.product_id)||!['etsy','facebook'].includes(v.destination)||
    (v.destination==='etsy'&&!uuidDraft(v.draft_id)))continue;
  const sc=scope(v.destination,Number(v.product_id),v.draft_id);
  if(sc.type!==r.target_type||sc.key!==r.target_key)continue;
  // A bounded single local read per queue case; detail reload strictly validates receipts before any write.
  const list=(await db.prepare("SELECT admin_action_audit_id,action_type,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN ('provider_escalation_412_assignment','provider_escalation_413_followup','provider_escalation_414_completion','provider_escalation_414_sla_exception') ORDER BY admin_action_audit_id DESC LIMIT 100").bind(sc.type,sc.key).all())?.results||[];
  const take=t=>list.find(x=>x.action_type===t)||null;
  const assignment=currentAssignment(take('provider_escalation_412_assignment')),
   assignee=assignment.claimed_escalation_receipt===r.admin_action_audit_id?assignment.assignee_user_id:null;
  const completed=take(COMPLETION_TYPE),followup=take(FOLLOWUP_TYPE),route=take(ROUTE_TYPE);
  const sla=slaStatus({escalatedAt:r.created_at});
  items.push({product_id:Number(v.product_id),destination:v.destination,draft_id:v.destination==='etsy'?v.draft_id:null,
    escalation_receipt:r.admin_action_audit_id,assigned_user_id:assignee,assignee_active:people.some(p=>p.user_id===assignee),
    sla_status:sla.status,initial_due_at:sla.initial_due_at,followup_due_at:sla.followup_due_at,
    completion_receipt:completed?.admin_action_audit_id||0,followup_receipt:followup?.admin_action_audit_id||0,
    exception_route_receipt:route?.admin_action_audit_id||0,completion_must_be_verified_in_detail:true});
  if(items.length>=20)break;
 }
 return {items,count:items.length,scan_limit:100,return_limit:20,older_cases_not_exhaustive:true,
  provider_state_checked_now:false,automatic_notifications:false};
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const u=new URL(c.request.url),mode=u.searchParams.get('mode')||'queue';
 try{const people=await admins(g.db);
  if(mode==='queue')return reply(await queue(g.db,people));
  if(mode!=='detail')return reply({error:'Unknown read mode.'},400);
  const dest=u.searchParams.get('destination'),pid=u.searchParams.get('product_id'),did=u.searchParams.get('draft_id');
  if(!productIdValid(pid)||!['etsy','facebook'].includes(dest)||(dest==='etsy'&&!uuidDraft(did)))
   return reply({error:'Choose Product/destination and a saved Etsy draft.'},400);
  const s=await load(g.db,dest,Number(pid),did,people);
  return s?reply(summary(s,people,g.admin)):reply({error:'Selected Product/draft missing.'},404);
 }catch{return reply({error:'Bounded audit evidence unavailable. No provider contact.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'JSON required.'},400);}
 const action=b?.action,dest=b?.destination,pid=b?.product_id,did=b?.draft_id;
 if(!['complete_followup','route_exception','verify_handoff'].includes(action)||
 !productIdValid(pid)||!['etsy','facebook'].includes(dest)||(dest==='etsy'&&!uuidDraft(did))||
 !keyValid(b?.request_key)||!/^[0-9a-f]{8}$/.test(String(b?.expected_source_signature||''))||
 !['escalation','assignment','handoff','followup','completion','route','governance'].every(k=>Number.isSafeInteger(b?.expected_receipts?.[k])&&b.expected_receipts[k]>=0)||
 b.expected_receipts.escalation<1||b.expected_receipts.assignment<0)return reply({error:'Valid Product, action, source signature, request key, and all expected receipts required.'},400);
 const sc=scope(dest,Number(pid),did);
 const type=action==='complete_followup'?COMPLETION_TYPE:action==='route_exception'?ROUTE_TYPE:GOVERNANCE_TYPE;
 try{
  const existed=await g.db.prepare(keySql).bind(COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE,sc.type,sc.key,b.request_key).first();
  if(existed){const p=parseReceipt(existed);return p.action===action&&p.product_id===Number(pid)&&p.destination===dest?
   reply({receipt:existed.admin_action_audit_id,idempotent:true}):reply({error:'Conflicting request-key reuse.'},409);}
  const people=await admins(g.db),s=await load(g.db,dest,Number(pid),did,people);
  if(!s)return reply({error:'Source Product/draft missing.'},404);
  if(s.source.signature!==b.expected_source_signature||
  !Object.entries(s.receipts).every(([k,v])=>b.expected_receipts[k]===v))
   return reply({error:'Escalation, assignment, handoff or follow-up evidence changed. Reload.',blockers:['stale_audit_evidence']},409);
  if(!canRecord({action,viewer:g.admin.user_id,admins:people,assignment:s.assignment,escalationOpen:s.open,
   sourceCurrent:s.sourceReady,handoff:s.handoff,governance:s.gov,followup:s.followup,
   completion:s.complete,issues:s.issues,body:b}))
   return reply({error:'Completion requires current Build 413 follow-up and verified handoff governance; exception route requires an actual reason and active Admin.',blockers:s.issues},409);
  const record={build:414,action,request_key:b.request_key,product_id:Number(pid),destination:dest,
   draft_id:dest==='etsy'?did:null,escalation_receipt:s.receipts.escalation,assignment_receipt:s.receipts.assignment,
   handoff_ack_receipt:s.handoff.ack_receipt,handoff_request_receipt:s.handoff.request_receipt,
   followup_receipt:s.receipts.followup,governance_receipt:s.receipts.governance,
   source_signature:s.source.signature,reviewer_user_id:g.admin.user_id,
   route_to_user_id:action==='route_exception'?Number(b.route_to_user_id):null,
   route_choice:action==='route_exception'?b.route_choice:null,exception_reasons:action==='route_exception'?s.issues:[],
   confirmed_manual_exception_review:action==='route_exception',
   confirmed_local_followup_completed:action==='complete_followup',
   confirmed_no_provider_completion_claim:action==='complete_followup',
   owner_note:b.owner_note.trim(),no_provider_retry:true,no_publication:true,us_shipping_suspended:true,
   provider_called:false,publication_performed:false,notifications_sent:false,local_only:true};
  // Compare-and-swap all seven latest receipts. Never write to provider/draft/assignment tables.
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE "+
  ["provider_evidence_411_escalation","provider_escalation_412_assignment","provider_escalation_413_handoff","provider_escalation_413_followup",COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE]
  .map(t=>"COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='"+t+"' AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=?").join(" AND ")+
  " AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type IN (?,?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
  const q=g.db.prepare(sql),bind=[g.admin.user_id,type,sc.type,sc.key,new URL(c.request.url).pathname,JSON.stringify(record)];
  for(const k of ['escalation','assignment','handoff','followup','completion','route','governance'])bind.push(sc.type,sc.key,s.receipts[k]);
  bind.push(COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE,sc.type,sc.key,b.request_key);
  const inserted=await q.bind(...bind).run();
  if(Number(inserted?.meta?.changes||0)!==1)return reply({error:'Concurrent evidence change; reload before any other local action.'},409);
  const saved=await g.db.prepare(keySql).bind(COMPLETION_TYPE,ROUTE_TYPE,GOVERNANCE_TYPE,sc.type,sc.key,b.request_key).first();
  if(!saved||parseReceipt(saved).action!==action)return reply({error:'Audit persistence unconfirmed. Inspect D1 before retry.'},409);
  return reply({receipt:saved.admin_action_audit_id,action,
    message:action==='complete_followup'?'Local owner follow-up completion evidence recorded; no provider action.':
    action==='route_exception'?'SLA exception routed in the local audit ledger; no notification was sent.':
    'Existing Build 413 handoff request and acknowledgement chain verified locally; no reassignment or publication.'});
 }catch{return reply({error:'Local audit result uncertain; reload. No provider changes.'},503);}
}
