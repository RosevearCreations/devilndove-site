// Release 467 Build 412 — click-only bounded escalation queue, validated Admin assignment,
// destination change review evidence only. Never publishes or updates a remote listing.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft,keyValid} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
import {ASSIGN_ACTION,REVIEW_ACTION,DECISIONS,assigneeId,noteValid,currentAssignment,currentReview,reviewEligibility,queueEntry,localSourceReview} from '../_lib/providerWorkQueue412.mjs';
const reply=(data,status=200)=>jsonResponse({ok:status<400,build:412,provider_called:false,
 provider_write:false,publication_performed:false,auto_retry:false,us_shipping_suspended:true,...data},status,{'Cache-Control':'no-store'});
const latest="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const receiptByKey="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const ACTIVE_ADMINS="SELECT user_id,display_name,email FROM users WHERE lower(role)='admin' AND is_active=1 ORDER BY user_id LIMIT 40";
const queueSql="SELECT admin_action_audit_id,action_type,target_type,target_key,details_json,created_at FROM admin_action_audit WHERE action_type='provider_evidence_411_escalation' AND target_type IN ('marketplace_draft','product') ORDER BY admin_action_audit_id DESC LIMIT 100";
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified active Admin required.'},401)}:
 !db?{error:reply({error:'D1 unavailable.'},503)}:{admin,db};}
const scope=(destination,id,draftId)=>({type:destination==='etsy'?'marketplace_draft':'product',
 key:destination==='etsy'?String(draftId):String(id)});
async function activeAdmins(db){const result=await db.prepare(ACTIVE_ADMINS).all();
 return (result?.results||[]).filter(a=>assigneeId(a.user_id))
 .map(a=>({user_id:Number(a.user_id),display_name:String(a.display_name||'').slice(0,90),
 email:String(a.email||'').slice(0,120)}));}
async function scoped(db,destination,id,draftId){
 const sc=scope(destination,id,draftId);
 const [product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent,snapshot,escalation,assignment,review]=await Promise.all([
 db.prepare('SELECT product_id,name,price_cents,inventory_quantity FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
 destination==='etsy'?db.prepare("SELECT id,product_id,channel_key,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1").bind(draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_trial_claimed','marketplace_draft',draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_reconciled','marketplace_draft',draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_trial_410_case_review','marketplace_draft',draftId).first():Promise.resolve(null),
 db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id),destination).first(),
 db.prepare(latest).bind('product_channel_intent_405','product',String(id)).first(),
 db.prepare(latest).bind('provider_evidence_411_snapshot',sc.type,sc.key).first(),
 db.prepare(latest).bind('provider_evidence_411_escalation',sc.type,sc.key).first(),
 db.prepare(latest).bind(ASSIGN_ACTION,sc.type,sc.key).first(),
 db.prepare(latest).bind(REVIEW_ACTION,sc.type,sc.key).first()]);
 if(!product||(destination==='etsy'&&(!draft||Number(draft.product_id)!==id)))return null;
 const source=localSourceReview({destination,product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent,latestSnapshot:snapshot,latestEscalation:escalation});
 if(!source)return null;
 return {sc,product,draft,source,assignment:currentAssignment(assignment),review:currentReview(review),escalationRow:escalation};
}
function scopedSummary(s,admins,viewer){
 const a=s.assignment,e=s.source.escalation,st=s.source.state;
 return {destination:st.destination,product_id:Number(s.product.product_id),product_name:String(s.product.name||'').slice(0,160),
 draft_id:st.draft_id,case_outcome:st.outcome,source_signature:s.source.signature,blockers:st.blockers,
 source_review_age_hours:s.source.governance.review_age_hours,source_snapshot_current:s.source.governance.source_matches_snapshot,
 source_snapshot_review_due:s.source.governance.review_due,
 evidence_receipts:{claim:st.claim_receipt,verified_draft:st.verified_receipt,case:st.case_receipt,
  channel_intent:st.channel_intent_receipt,policy:st.policy_receipt,snapshot:s.source.governance.snapshot_receipt,
  escalation:e.receipt,assignment:a.receipt,review:s.review.receipt},
 escalation_status:e.status,assigned_user_id:a.claimed_escalation_receipt===e.receipt?a.assignee_user_id:null,
 reviewer_user_id:viewer.user_id,review_decision:s.review.decision,can_assign:e.status==='OPEN_OWNER_REVIEW',
 can_review_local_evidence:reviewEligibility({destination:st.destination,state:st,escalation:e,
  governance:s.source.governance,assignment:a,reviewerId:viewer.user_id,
  assigneeActive:admins.some(p=>p.user_id===a.assignee_user_id),
  decision:'review',body:{owner_note:'readiness preview only',no_provider_retry:true,no_publication:true,
   us_shipping_suspended:true,confirm_matching_build400_receipt:true,confirm_matching_build410_closure:true,confirm_local_only_review:true}}),
 provider_state_checked_now:false,remote_publish_allowed:false,operator_assignment_does_not_grant_provider_permissions:true};
}
async function queue(db,admin){
 const [recent,admins]=await Promise.all([db.prepare(queueSql).all(),activeAdmins(db)]);
 const unique=new Set(),candidates=[];
 for(const row of recent?.results||[]){const d=parseReceipt(row),k=row.target_type+':'+row.target_key;
  if(unique.has(k))continue;unique.add(k);
  if(d.decision!=='OPEN_OWNER_REVIEW'||!productIdValid(d.product_id)||!['etsy','facebook'].includes(d.destination))continue;
  if(d.destination==='etsy'&&!uuidDraft(d.draft_id))continue;
  candidates.push(row);if(candidates.length>=20)break;}
 const items=await Promise.all(candidates.map(async row=>{
  const sc={type:row.target_type,key:row.target_key};
  const [assigned,review]=await Promise.all([
   db.prepare(latest).bind(ASSIGN_ACTION,sc.type,sc.key).first(),
   db.prepare(latest).bind(REVIEW_ACTION,sc.type,sc.key).first()]);
  return queueEntry(row,assigned,review);}));
 return {items,admins,queue_count:items.length,scan_limit:100,returned_limit:20,
  queue_incomplete_if_older_than_scan:true,viewer_user_id:admin.user_id,
  provider_state_checked_now:false,provider_writes_allowed:false};
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const u=new URL(c.request.url),mode=u.searchParams.get('mode')||'queue';
 if(!['queue','detail'].includes(mode))return reply({error:'Unsupported evidence view.'},400);
 try{
  if(mode==='queue')return reply(await queue(g.db,g.admin));
  const destination=u.searchParams.get('destination'),productId=u.searchParams.get('product_id'),
   draftId=u.searchParams.get('draft_id');
  if(!productIdValid(productId)||!['etsy','facebook'].includes(destination)||
   (destination==='etsy'&&!uuidDraft(draftId)))return reply({error:'Select one Product and destination with a saved Etsy draft.'},400);
  const [s,admins]=await Promise.all([scoped(g.db,destination,Number(productId),draftId),activeAdmins(g.db)]);
  return s?reply({...scopedSummary(s,admins,g.admin),admins}):reply({error:'Selected Product/draft absent.'},404);
 }catch{return reply({error:'Bounded local queue or evidence read unavailable. No provider contact.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'JSON required.'},400);}
 const destination=b?.destination,productId=b?.product_id,draftId=b?.draft_id,action=b?.action;
 if(!productIdValid(productId)||!['etsy','facebook'].includes(destination)||
 (destination==='etsy'&&!uuidDraft(draftId))||!['assign','review_hold','review_evidence'].includes(action)||
 !keyValid(b?.request_key)||!noteValid(b?.owner_note)||
 !/^[0-9a-f]{8}$/.test(String(b?.expected_source_signature||''))||
 !Number.isSafeInteger(b?.expected_escalation_receipt)||b.expected_escalation_receipt<1||
 !Number.isSafeInteger(b?.expected_assignment_receipt)||b.expected_assignment_receipt<0||
 !Number.isSafeInteger(b?.expected_review_receipt)||b.expected_review_receipt<0||
 b.no_provider_retry!==true||b.no_publication!==true||b.us_shipping_suspended!==true)
 return reply({error:'Complete explicit owner review, safe shipping and expected receipts required.'},400);
 const sc=scope(destination,Number(productId),draftId),type=action==='assign'?ASSIGN_ACTION:REVIEW_ACTION;
 try{
  const existing=await g.db.prepare(receiptByKey).bind(ASSIGN_ACTION,REVIEW_ACTION,sc.type,sc.key,b.request_key).first();
  if(existing){const d=parseReceipt(existing);return d.action===action&&d.product_id===Number(productId)&&d.destination===destination?
   reply({receipt:existing.admin_action_audit_id,idempotent:true}):reply({error:'Request key reused with different operation.'},409);}
  const [s,admins]=await Promise.all([scoped(g.db,destination,Number(productId),draftId),activeAdmins(g.db)]);
  if(!s)return reply({error:'Product/draft no longer matches.'},404);
  const e=s.source.escalation;
  if(e.status!=='OPEN_OWNER_REVIEW')return reply({error:'Build 411 OPEN owner escalation required.'},409);
  if(s.source.signature!==b.expected_source_signature||e.receipt!==b.expected_escalation_receipt||
   s.assignment.receipt!==b.expected_assignment_receipt||s.review.receipt!==b.expected_review_receipt)
   return reply({error:'Source, assignment, or escalation changed. Reload case.',blockers:['stale_case_evidence']},409);
  let assignedUserId=s.assignment.assignee_user_id,decision=null;
  if(action==='assign'){
   if(!assigneeId(b.assignee_user_id)||!admins.some(a=>a.user_id===Number(b.assignee_user_id)))
    return reply({error:'Choose an active verified Admin assignee.'},409);
   assignedUserId=Number(b.assignee_user_id);
  }else{
   const chosen=action==='review_hold'?'hold':'review';
   if(!reviewEligibility({destination,state:s.source.state,escalation:e,
    governance:s.source.governance,assignment:s.assignment,reviewerId:g.admin.user_id,
    assigneeActive:admins.some(a=>a.user_id===s.assignment.assignee_user_id),
    decision:chosen,body:b}))
    return reply({error:'Only assigned active Admin can review; verified local evidence requires current Build 400, Build 410, and Build 411 snapshots. Unknown/Meta remains HOLD.',blockers:s.source.state.blockers},409);
   decision=action==='review_hold'?DECISIONS.hold:DECISIONS.review;
  }
  const detail={build:412,action,request_key:b.request_key,product_id:Number(productId),destination,
   draft_id:destination==='etsy'?String(draftId):null,
   escalation_receipt:e.receipt,source_signature:s.source.signature,
   prior_assignment_receipt:s.assignment.receipt,prior_review_receipt:s.review.receipt,
   assignee_user_id:assignedUserId,assigned_by_user_id:g.admin.user_id,reviewed_by_user_id:action==='assign'?null:g.admin.user_id,
   verified_draft_receipt:s.source.state.verified_receipt,case_receipt:s.source.state.case_receipt,
   policy_receipt:s.source.state.policy_receipt,source_snapshot_receipt:s.source.governance.snapshot_receipt,
   decision,owner_note:b.owner_note.trim(),local_evidence_only:true,provider_called:false,publication_performed:false,
   no_provider_retry:true,no_publication:true,us_shipping_suspended:true};
  // Compare-and-swap on latest assignment AND review. One new immutable audit row only.
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='provider_evidence_411_escalation' AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
  const saved=await g.db.prepare(sql).bind(g.admin.user_id,type,sc.type,sc.key,new URL(c.request.url).pathname,JSON.stringify(detail),
   ASSIGN_ACTION,sc.type,sc.key,s.assignment.receipt,REVIEW_ACTION,sc.type,sc.key,s.review.receipt,
   sc.type,sc.key,e.receipt,ASSIGN_ACTION,REVIEW_ACTION,sc.type,sc.key,b.request_key).run();
  if(Number(saved?.meta?.changes||0)!==1)return reply({error:'Concurrent assignment/review change. Reload before repeating any local action.'},409);
  const found=await g.db.prepare(receiptByKey).bind(ASSIGN_ACTION,REVIEW_ACTION,sc.type,sc.key,b.request_key).first();
  if(!found||parseReceipt(found).action!==action)return reply({error:'New audit receipt not confirmed; inspect D1 before retry.'},409);
  return reply({receipt:found.admin_action_audit_id,action,decision,
   publication_performed:false,provider_called:false,
   message:action==='assign'?'Active Admin assignment saved. It does not authorize provider publication.':
    action==='review_hold'?'Destination change HOLD retained; no provider activity or retry.':
    'Matching local unpublished-draft evidence reviewed. Provider publication remains disabled.'});
 }catch{return reply({error:'Audit result uncertain; reload case, no provider action occurred.'},503);}
}
