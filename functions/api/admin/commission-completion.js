// Release 467 Build 453: read canonical commission sources; append private maker handoff decisions only.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
const num=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const note=v=>String(v??'').trim().slice(0,1200);
const rows=r=>Array.isArray(r?.results)?r.results:[];
const reply=(d,s=200)=>jsonResponse({release:467,build:453,...d},s,{'Cache-Control':'no-store'});
const policy={internal_only:true,customer_approval_requires_real_proof:true,deposit_draft_is_not_payment:true,
 estimated_cost_impact_is_not_actual:true,delivery_acceptance_not_inferred:true,automatic_customer_message:false,
 product_stock_changed:false,payment_capture:false,publication:false};
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');
async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);if(!admin)return {error:reply({ok:false,error:'Admin sign-in is required.'},401)};
 const db=getDb(ctx.env);if(!db)return {error:reply({ok:false,error:'D1 database binding unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_commission_completion_reviews'").first().catch(()=>null);
 if(Number(ready?.n)!==1)return {error:reply({ok:false,error:'Build 453 forward migration 0048 must be applied.',code:'MIGRATION_REQUIRED'},503)};
 return {admin,db};
}
async function view(db,requestId){
 const req=await db.prepare('SELECT custom_request_id,request_type,product_interest,status FROM custom_requests WHERE custom_request_id=?').bind(requestId).first();
 if(!req)return null;
 const lifecycle=await db.prepare('SELECT creative_work_project_id,current_stage FROM creative_project_manufacturing_lifecycles WHERE custom_request_id=? ORDER BY creative_project_manufacturing_lifecycle_id DESC LIMIT 1').bind(requestId).first();
 const project=num(lifecycle?.creative_work_project_id);
 const [revisions,proofs,orders,history]=await Promise.all([
  db.prepare('SELECT custom_request_quote_revision_id,revision_type,revision_status,created_at FROM custom_request_quote_revisions WHERE custom_request_id=? ORDER BY custom_request_quote_revision_id DESC LIMIT 30').bind(requestId).all().then(rows),
  db.prepare('SELECT custom_request_proof_version_id,version_number,proof_status,approved_at,internal_production_approval_required,internal_production_approval_status FROM custom_request_proof_versions WHERE custom_request_id=? ORDER BY version_number DESC LIMIT 30').bind(requestId).all().then(rows),
  db.prepare(`SELECT l.custom_request_order_status_link_id,l.order_id,l.link_status,o.order_status,o.payment_status,o.currency,o.total_cents
    FROM custom_request_order_status_links l JOIN orders o ON o.order_id=l.order_id WHERE l.custom_request_id=?
    AND COALESCE(l.link_status,'active') NOT IN ('void','expired') AND l.voided_at IS NULL AND l.expired_at IS NULL
    ORDER BY l.custom_request_order_status_link_id DESC LIMIT 20`).bind(requestId).all().then(rows),
  db.prepare(`SELECT maker_commission_completion_review_id,decision,source_quote_revision_id,source_proof_version_id,source_cost_review_id,
    source_traveler_run_id,source_finished_piece_id,source_order_status_link_id,estimated_change_cost_delta_cents,
    cost_impact_basis,review_note,actor_user_id,created_at FROM maker_commission_completion_reviews
    WHERE custom_request_id=? ORDER BY maker_commission_completion_review_id DESC LIMIT 51`).bind(requestId).all().then(rows)
 ]);
 let costs=[],travelers=[],pieces=[];
 if(project){[costs,travelers,pieces]=await Promise.all([
  db.prepare(`SELECT maker_project_cost_review_id,review_label,scenario_kind,created_at FROM maker_project_cost_reviews
   WHERE creative_work_project_id=? AND scenario_kind='commission' ORDER BY maker_project_cost_review_id DESC LIMIT 25`).bind(project).all().then(rows),
  db.prepare(`SELECT r.maker_traveler_run_id,r.created_at,
   (SELECT COUNT(*) FROM maker_traveler_run_steps s WHERE s.maker_traveler_run_id=r.maker_traveler_run_id) total_steps,
   (SELECT COUNT(*) FROM maker_traveler_run_steps s WHERE s.maker_traveler_run_id=r.maker_traveler_run_id AND
      (SELECT e.event_kind FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=s.maker_traveler_run_step_id
       ORDER BY e.maker_traveler_step_event_id DESC LIMIT 1)='complete') completed_steps
   FROM maker_traveler_runs r WHERE r.creative_work_project_id=? ORDER BY r.maker_traveler_run_id DESC LIMIT 25`).bind(project).all().then(rows),
  db.prepare(`SELECT piece.maker_finished_piece_id,piece.serial_code,piece.variant_label,
    (SELECT review.decision FROM maker_quality_release_reviews review WHERE review.maker_quality_attempt_id=piece.maker_quality_attempt_id
     ORDER BY review.maker_quality_release_review_id DESC LIMIT 1) latest_quality_decision
    FROM maker_finished_pieces piece JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=piece.maker_quality_attempt_id
    WHERE a.creative_work_project_id=? ORDER BY piece.maker_finished_piece_id DESC LIMIT 25`).bind(project).all().then(rows)
 ]);}
 return {request:req,manufacturing:lifecycle,quote_revisions:revisions,proof_versions:proofs,linked_orders:orders,
   cost_reviews:costs,traveler_runs:travelers,finished_pieces:pieces,completion_history:history.slice(0,50),history_truncated:history.length>50,policy};
}
export async function onRequestGet(ctx){const a=await access(ctx);if(a.error)return a.error;
 const requestId=num(new URL(ctx.request.url).searchParams.get('request_id'));if(!requestId)return reply({ok:false,error:'Select a valid Custom Request first.'},400);
 try{const d=await view(a.db,requestId);return d?reply({ok:true,...d}):reply({ok:false,error:'Custom Request not found.'},404)}
 catch(err){console.error('BUILD453_COMPLETION_READ',err?.name);return reply({ok:false,error:'Commission completion sources unavailable.'},503)}
}
export async function onRequestPost(ctx){const a=await access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin request required.'},403);
 let b;try{b=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)};
 if(!b||typeof b!=='object'||Array.isArray(b))return reply({ok:false,error:'A completion review object is required.'},400);
 const requestId=num(b?.request_id),decision=String(b?.decision||''),text=note(b?.review_note),key=String(b?.request_key||'');
 const allowed=['approved_change_review','maker_handoff_ready','delivery_followup_hold'];
 if(!requestId||!allowed.includes(decision)||text.length<16||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Select an actual request, supported decision, 16+ character review note and unique key.'},400);
 const sourceIds={revision:num(b.source_quote_revision_id)||null,proof:num(b.source_proof_version_id)||null,
  cost:num(b.source_cost_review_id)||null,traveler:num(b.source_traveler_run_id)||null,
  piece:num(b.source_finished_piece_id)||null,order:num(b.source_order_status_link_id)||null};
 const delta=decision==='approved_change_review'&&b.estimated_change_cost_delta_cents!==''&&b.estimated_change_cost_delta_cents!=null?Number(b.estimated_change_cost_delta_cents):null;
 if(delta!==null&&(!Number.isSafeInteger(delta)||Math.abs(delta)>1000000000))return reply({ok:false,error:'Enter a signed whole-cent cost impact estimate, or leave it unknown.'},400);
 const actor=num(a.admin.user_id),basis=decision==='approved_change_review'?'reviewed_estimate':'not_established';
 if(!actor)return reply({ok:false,error:'A verified Admin actor is required.'},401);
 const payload={requestId,decision,text,sourceIds,delta,basis};const sha=await digest(payload);
 const prior=await a.db.prepare('SELECT maker_commission_completion_review_id,actor_user_id,payload_sha256 FROM maker_commission_completion_reviews WHERE request_key=?').bind(key).first();
 if(prior)return prior.actor_user_id===actor&&prior.payload_sha256===sha?reply({ok:true,replayed:true,receipt_id:prior.maker_commission_completion_review_id,policy}):reply({ok:false,error:'Request key was already used for a different review.',code:'IDEMPOTENCY_CONFLICT'},409);
 try{
  const insert=await a.db.prepare(`INSERT INTO maker_commission_completion_reviews(custom_request_id,decision,source_quote_revision_id,source_proof_version_id,
    source_cost_review_id,source_traveler_run_id,source_finished_piece_id,source_order_status_link_id,
    estimated_change_cost_delta_cents,cost_impact_basis,review_note,actor_user_id,request_key,payload_sha256)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(requestId,decision,sourceIds.revision,sourceIds.proof,sourceIds.cost,sourceIds.traveler,
     sourceIds.piece,sourceIds.order,delta,basis,text,actor,key,sha).run();
  const receipt=Number(insert.meta?.last_row_id||0);
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'build453_'+decision,target_type:'custom_request_commission_completion',target_id:receipt,
   details:{custom_request_id:requestId,private:true,no_payment_or_stock_write:true}});
  return reply({ok:true,receipt_id:receipt,completion:await view(a.db,requestId),policy});
 }catch(err){
  const repeat=await a.db.prepare('SELECT maker_commission_completion_review_id,actor_user_id,payload_sha256 FROM maker_commission_completion_reviews WHERE request_key=?').bind(key).first().catch(()=>null);
  if(repeat&&repeat.actor_user_id===actor&&repeat.payload_sha256===sha)return reply({ok:true,replayed:true,receipt_id:repeat.maker_commission_completion_review_id,policy});
  console.error('BUILD453_COMPLETION_WRITE',err?.name);
  return reply({ok:false,error:'HOLD: reviewed source evidence is missing, unapproved, from another request or stale. No completion was confirmed.',code:'SOURCE_REVIEW_HOLD'},409);
 }
}
