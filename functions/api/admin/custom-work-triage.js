// Release 467 Build 211 — Manufacturing Triage & Route Proposal.
// Staff-reviewed triage over existing custom_requests and canonical inventory_processes.
// No request-time DDL, automatic feasibility promise, quote/order creation, stock reservation or provider action.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=211;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=1200)=>normalizeText(v).slice(0,n);
const flag=(v)=>v===true||Number(v)===1||String(v||'').toLowerCase()==='true'?1:0;
const TRIAGE_STATES=new Set(['draft','reviewed','clarification_required','on_hold']);
const FEASIBILITY_STATES=new Set(['needs_review','candidate_route','feasible_with_review','clarification_required','not_feasible','on_hold']);
const SUPPLIED_STATES=new Set(['not_applicable','needs_review','acceptable_for_assessment','limitations_required','declined']);

async function ready(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const schema=rows(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('custom_requests','inventory_processes','custom_request_manufacturing_triage','custom_request_route_processes')").all());
  const names=new Set(schema.map(x=>String(x.name||'')));
  const missing=['custom_requests','inventory_processes','custom_request_manufacturing_triage','custom_request_route_processes'].filter(x=>!names.has(x));
  if(missing.length)return {error:json({ok:false,error:'Build 211 canonical migration is required.',code:'build211_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function snapshot(db){
  const requests=rows(await db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,deadline_date,budget_cents,
    quantity,project_intent,intended_use,organization_name,event_context_structured,supplied_item,desired_material,desired_finish,
    personalization_text,requested_capability_key,tolerance_size_notes,help_choose_method,message,status,reference_upload_count,updated_at
    FROM custom_requests
    WHERE lower(COALESCE(status,'new')) NOT IN ('declined','archived')
    ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'reviewing' THEN 1 WHEN 'quote_needed' THEN 2 ELSE 3 END, datetime(updated_at) DESC
    LIMIT 80`).all());
  const triage=rows(await db.prepare(`SELECT custom_request_manufacturing_triage_id,custom_request_id,triage_status,feasibility_state,
    specialist_review_required,specialist_review_notes,proof_sample_required,proof_sample_notes,material_unknowns,
    supplied_item_review_state,supplied_item_review_notes,next_clarification_question,route_notes,reviewed_by_user_id,reviewed_at,updated_at
    FROM custom_request_manufacturing_triage ORDER BY datetime(updated_at) DESC LIMIT 160`).all());
  const route_processes=rows(await db.prepare(`SELECT rp.custom_request_route_process_id,rp.custom_request_id,rp.inventory_process_id,rp.route_order,
    rp.candidate_role,rp.route_notes,ip.process_key,ip.process_name
    FROM custom_request_route_processes rp
    JOIN inventory_processes ip ON ip.inventory_process_id=rp.inventory_process_id
    ORDER BY rp.custom_request_id,rp.route_order LIMIT 640`).all());
  const processes=rows(await db.prepare(`SELECT inventory_process_id,process_key,process_name,description,sort_order
    FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name`).all());
  return {requests,triage,route_processes,processes};
}
export async function onRequestGet({request,env}){
  const ctx=await ready(request,env);if(ctx.error)return ctx.error;
  return json({ok:true,...await snapshot(ctx.db),request_authority:'custom_requests',process_authority:'inventory_processes',
    route_authority:'custom_request_route_processes',triage_authority:'custom_request_manufacturing_triage',
    automatic_feasibility_promise:false,automatic_quote:false,automatic_order:false,automatic_stock_reservation:false});
}
export async function onRequestPost({request,env}){
  const ctx=await ready(request,env);if(ctx.error)return ctx.error;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  if(String(body.action||'save_triage')!=='save_triage')return json({ok:false,error:'Unsupported action.'},400);
  const requestId=Number(body.custom_request_id||0);
  if(!requestId)return json({ok:false,error:'Custom request is required.'},400);
  const requestRow=await ctx.db.prepare('SELECT custom_request_id,request_key,supplied_item FROM custom_requests WHERE custom_request_id=? LIMIT 1').bind(requestId).first();
  if(!requestRow)return json({ok:false,error:'Custom request not found.'},404);

  const triageStatus=TRIAGE_STATES.has(String(body.triage_status||''))?String(body.triage_status):'draft';
  const feasibilityState=FEASIBILITY_STATES.has(String(body.feasibility_state||''))?String(body.feasibility_state):'needs_review';
  const specialistRequired=flag(body.specialist_review_required);
  const proofRequired=flag(body.proof_sample_required);
  let suppliedState=SUPPLIED_STATES.has(String(body.supplied_item_review_state||''))?String(body.supplied_item_review_state):'not_applicable';
  if(Number(requestRow.supplied_item||0)!==1)suppliedState='not_applicable';

  const requestedIds=(Array.isArray(body.candidate_process_ids)?body.candidate_process_ids:[])
    .map(Number).filter(x=>Number.isInteger(x)&&x>0).filter((x,i,a)=>a.indexOf(x)===i).slice(0,8);
  const processRows=requestedIds.length?rows(await ctx.db.prepare(`SELECT inventory_process_id,process_key,process_name FROM inventory_processes
    WHERE is_active=1 AND inventory_process_id IN (${requestedIds.map(()=>'?').join(',')})`).bind(...requestedIds).all()):[];
  if(processRows.length!==requestedIds.length)return json({ok:false,error:'One or more candidate processes are invalid or inactive.'},400);
  const processMap=new Map(processRows.map(x=>[Number(x.inventory_process_id),x]));

  const userId=Number(ctx.admin.user_id||0)||null;
  const statements=[
    ctx.db.prepare(`INSERT INTO custom_request_manufacturing_triage(
      custom_request_id,triage_status,feasibility_state,specialist_review_required,specialist_review_notes,
      proof_sample_required,proof_sample_notes,material_unknowns,supplied_item_review_state,supplied_item_review_notes,
      next_clarification_question,route_notes,reviewed_by_user_id,reviewed_at,updated_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='reviewed' THEN CURRENT_TIMESTAMP ELSE NULL END,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(custom_request_id) DO UPDATE SET
        triage_status=excluded.triage_status,feasibility_state=excluded.feasibility_state,
        specialist_review_required=excluded.specialist_review_required,specialist_review_notes=excluded.specialist_review_notes,
        proof_sample_required=excluded.proof_sample_required,proof_sample_notes=excluded.proof_sample_notes,
        material_unknowns=excluded.material_unknowns,supplied_item_review_state=excluded.supplied_item_review_state,
        supplied_item_review_notes=excluded.supplied_item_review_notes,next_clarification_question=excluded.next_clarification_question,
        route_notes=excluded.route_notes,reviewed_by_user_id=excluded.reviewed_by_user_id,
        reviewed_at=CASE WHEN excluded.triage_status='reviewed' THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
        updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`)
      .bind(requestId,triageStatus,feasibilityState,specialistRequired,clean(body.specialist_review_notes,800)||null,
        proofRequired,clean(body.proof_sample_notes,800)||null,clean(body.material_unknowns,1200)||null,suppliedState,
        clean(body.supplied_item_review_notes,1000)||null,clean(body.next_clarification_question,1000)||null,
        clean(body.route_notes,1400)||null,userId,triageStatus,userId),
    ctx.db.prepare('DELETE FROM custom_request_route_processes WHERE custom_request_id=?').bind(requestId)
  ];
  requestedIds.forEach((processId,index)=>{
    statements.push(ctx.db.prepare(`INSERT INTO custom_request_route_processes(
      custom_request_id,inventory_process_id,route_order,candidate_role,created_by_user_id,updated_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(requestId,processId,index+1,index===0?'primary':'secondary',userId,userId));
  });
  await ctx.db.batch(statements);
  await auditAdminAction(env,request,ctx.admin,{action_type:'custom_work_manufacturing_triage_save',target_type:'custom_request',
    target_id:requestId,target_key:String(requestRow.request_key||requestId),details:{
      triage_status:triageStatus,feasibility_state:feasibilityState,specialist_review_required:Boolean(specialistRequired),
      proof_sample_required:Boolean(proofRequired),supplied_item_review_state:suppliedState,
      candidate_process_keys:requestedIds.map(id=>processMap.get(id)?.process_key).filter(Boolean),
      automatic_feasibility_promise:false,automatic_quote:false,automatic_order:false
    }});
  return json({ok:true,message:'Manufacturing triage saved as reviewed staff evidence.',...await snapshot(ctx.db),
    automatic_feasibility_promise:false,automatic_quote:false,automatic_order:false,automatic_stock_reservation:false});
}
