// Release 467 Build 216 — Customer-Supplied Item Intake & Suitability Review.
// Extends existing Custom Request, Build 211 triage, reference-upload and stage-photo authorities.
// No request-time DDL, media mutation, automatic feasibility promise, production start, Inventory, payment or provider action.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=216;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const OWNERSHIP=new Set(['unconfirmed','customer_owned','authorized_agent','unknown']);
const MATERIAL_STATE=new Set(['unknown','customer_stated','staff_observed']);
const FINISH_STATE=new Set(['unknown','customer_stated','staff_observed']);
const WORKFLOW_STATE=new Set(['intake','reviewing','accepted','limitations_pending','limitations_acknowledged','declined','work_complete','returned','closed']);
const DECISION=new Set(['needs_review','accepted','accepted_with_limitations','declined']);
const EVIDENCE_ROLE=new Set(['intake_condition','post_work_condition','other']);

async function ready(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['custom_requests','custom_request_manufacturing_triage','custom_request_reference_uploads','custom_order_stage_photos',
    'custom_request_supplied_items','custom_request_supplied_item_reviews','custom_request_supplied_item_evidence','custom_request_supplied_item_acknowledgements'];
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${required.map(()=>'?').join(',')})`).bind(...required).all().catch(()=>({results:[]})));
  const names=new Set(found.map(x=>String(x.name||''))),missing=required.filter(x=>!names.has(x));
  if(missing.length)return {error:json({ok:false,error:'Build 216 canonical migration is required.',code:'build216_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function requestById(db,requestId){
  return db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,supplied_item,desired_material,desired_finish,message,reference_upload_count,updated_at
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(id(requestId)).first().catch(()=>null);
}
async function itemById(db,itemId){
  return db.prepare(`SELECT * FROM custom_request_supplied_items WHERE custom_request_supplied_item_id=? LIMIT 1`).bind(id(itemId)).first().catch(()=>null);
}
async function triageByRequest(db,requestId){
  return db.prepare(`SELECT custom_request_manufacturing_triage_id,custom_request_id,triage_status,feasibility_state,material_unknowns,
    supplied_item_review_state,supplied_item_review_notes,next_clarification_question,reviewed_by_user_id,reviewed_at,updated_at
    FROM custom_request_manufacturing_triage WHERE custom_request_id=? LIMIT 1`).bind(id(requestId)).first().catch(()=>null);
}
async function latestReview(db,itemId){
  return db.prepare(`SELECT * FROM custom_request_supplied_item_reviews WHERE custom_request_supplied_item_id=?
    ORDER BY custom_request_supplied_item_review_id DESC LIMIT 1`).bind(id(itemId)).first().catch(()=>null);
}
async function evidenceForItem(db,itemId){
  return rows(await db.prepare(`SELECT e.*,
      r.public_url AS reference_url,r.original_filename AS reference_filename,r.reference_use_status,
      p.image_url AS stage_photo_url,p.image_caption AS stage_photo_caption,p.stage_key,p.public_use_status,p.moderation_status
    FROM custom_request_supplied_item_evidence e
    LEFT JOIN custom_request_reference_uploads r ON r.custom_request_reference_upload_id=e.custom_request_reference_upload_id
    LEFT JOIN custom_order_stage_photos p ON p.custom_order_stage_photo_id=e.custom_order_stage_photo_id
    WHERE e.custom_request_supplied_item_id=?
    ORDER BY e.custom_request_supplied_item_evidence_id DESC`).bind(id(itemId)).all().catch(()=>({results:[]})));
}
async function acknowledgementsForItem(db,itemId){
  return rows(await db.prepare(`SELECT * FROM custom_request_supplied_item_acknowledgements WHERE custom_request_supplied_item_id=?
    ORDER BY custom_request_supplied_item_acknowledgement_id DESC LIMIT 20`).bind(id(itemId)).all().catch(()=>({results:[]})));
}
function itemReadiness(item,triage,review,evidence,acks){
  const blockers=[],warnings=[];
  const active=(evidence||[]).filter(x=>String(x.evidence_status||'active')==='active');
  const intake=active.filter(x=>String(x.evidence_role)==='intake_condition');
  const post=active.filter(x=>String(x.evidence_role)==='post_work_condition');
  const matchingAck=review?(acks||[]).find(a=>Number(a.custom_request_supplied_item_review_id)===Number(review.custom_request_supplied_item_review_id))||null:null;
  if(!['customer_owned','authorized_agent'].includes(String(item.ownership_status||'')))blockers.push('Ownership or authority is not confirmed.');
  if(!clean(item.item_description,20))warnings.push('Item description is sparse.');
  if(!clean(item.requested_modification,20))warnings.push('Requested modification is not recorded on this item.');
  if(!clean(item.intake_condition_notes,20)&&!intake.length)blockers.push('Condition-at-intake evidence is missing.');
  if(String(item.material_status||'unknown')==='unknown')warnings.push('Item material remains unknown.');
  if(String(item.finish_status||'unknown')==='unknown')warnings.push('Item finish/coating remains unknown.');
  if(!triage)blockers.push('Build 211 manufacturing triage has not been recorded.');
  if(!review)blockers.push('No Build 216 suitability review has been recorded.');
  if(review){
    const decision=String(review.decision||'needs_review');
    const triageState=String(triage?.supplied_item_review_state||'not_applicable');
    if(decision==='accepted'&&triageState!=='acceptable_for_assessment')blockers.push('Build 211 supplied-item triage must be acceptable_for_assessment for an accepted item.');
    if(decision==='accepted_with_limitations'&&triageState!=='limitations_required')blockers.push('Build 211 supplied-item triage must be limitations_required for this decision.');
    if(decision==='declined'&&triageState!=='declined')blockers.push('Build 211 supplied-item triage must also be declined.');
    if(clean(review.material_unknowns,20))warnings.push('Material unknowns remain recorded in the latest review.');
    if(clean(review.safety_unknowns,20))warnings.push('Safety/process unknowns remain recorded in the latest review.');
    if(decision==='accepted_with_limitations'&&String(matchingAck?.acknowledgement_status||'')!=='acknowledged')blockers.push('Customer limitation acknowledgement for the exact current review is still required.');
    if(decision==='declined')return {state:'declined',blockers:[],warnings,intake_evidence_count:intake.length,post_work_evidence_count:post.length,latest_acknowledgement_status:latestAck?.acknowledgement_status||null};
  }
  if(['work_complete','returned','closed'].includes(String(item.workflow_status||''))&&!post.length)blockers.push('Post-work condition evidence is required before completion/return closure.');
  const state=blockers.length?'blocked':warnings.length?'review':'ready';
  return {state,blockers,warnings,intake_evidence_count:intake.length,post_work_evidence_count:post.length,latest_acknowledgement_status:matchingAck?.acknowledgement_status||null};
}
async function snapshot(db){
  const requests=rows(await db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,supplied_item,desired_material,desired_finish,reference_upload_count,updated_at
    FROM custom_requests WHERE supplied_item=1 OR request_type='customer_supplied_item'
    ORDER BY datetime(updated_at) DESC,custom_request_id DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const items=rows(await db.prepare(`SELECT * FROM custom_request_supplied_items ORDER BY datetime(updated_at) DESC,custom_request_supplied_item_id DESC LIMIT 320`).all().catch(()=>({results:[]})));
  const triage=rows(await db.prepare(`SELECT custom_request_manufacturing_triage_id,custom_request_id,triage_status,feasibility_state,material_unknowns,supplied_item_review_state,supplied_item_review_notes,next_clarification_question,reviewed_at,updated_at
    FROM custom_request_manufacturing_triage WHERE supplied_item_review_state<>'not_applicable' ORDER BY datetime(updated_at) DESC LIMIT 200`).all().catch(()=>({results:[]})));
  const reviews=rows(await db.prepare(`SELECT * FROM custom_request_supplied_item_reviews ORDER BY custom_request_supplied_item_review_id DESC LIMIT 640`).all().catch(()=>({results:[]})));
  const evidence=rows(await db.prepare(`SELECT e.*,r.public_url AS reference_url,r.original_filename AS reference_filename,r.reference_use_status,
      p.image_url AS stage_photo_url,p.image_caption AS stage_photo_caption,p.stage_key,p.public_use_status,p.moderation_status
    FROM custom_request_supplied_item_evidence e
    LEFT JOIN custom_request_reference_uploads r ON r.custom_request_reference_upload_id=e.custom_request_reference_upload_id
    LEFT JOIN custom_order_stage_photos p ON p.custom_order_stage_photo_id=e.custom_order_stage_photo_id
    ORDER BY e.custom_request_supplied_item_evidence_id DESC LIMIT 800`).all().catch(()=>({results:[]})));
  const acknowledgements=rows(await db.prepare(`SELECT custom_request_supplied_item_acknowledgement_id,custom_request_supplied_item_id,custom_request_supplied_item_review_id,custom_request_id,
      acknowledgement_status,customer_name,customer_email,limitations_snapshot,expires_at,acknowledged_at,declined_at,customer_response_note,created_at,updated_at
    FROM custom_request_supplied_item_acknowledgements ORDER BY custom_request_supplied_item_acknowledgement_id DESC LIMIT 320`).all().catch(()=>({results:[]})));
  const referenceUploads=rows(await db.prepare(`SELECT custom_request_reference_upload_id,custom_request_id,request_key,public_url,original_filename,reference_use_status,created_at
    FROM custom_request_reference_uploads ORDER BY custom_request_reference_upload_id DESC LIMIT 240`).all().catch(()=>({results:[]})));
  const stagePhotos=rows(await db.prepare(`SELECT custom_order_stage_photo_id,custom_request_id,stage_key,image_url,image_caption,public_use_status,moderation_status,created_at
    FROM custom_order_stage_photos WHERE custom_request_id IS NOT NULL ORDER BY custom_order_stage_photo_id DESC LIMIT 240`).all().catch(()=>({results:[]})));
  const triageMap=new Map(triage.map(x=>[Number(x.custom_request_id),x]));
  const reviewsByItem=new Map();for(const r of reviews){const k=Number(r.custom_request_supplied_item_id);if(!reviewsByItem.has(k))reviewsByItem.set(k,[]);reviewsByItem.get(k).push(r);}
  const evidenceByItem=new Map();for(const e of evidence){const k=Number(e.custom_request_supplied_item_id);if(!evidenceByItem.has(k))evidenceByItem.set(k,[]);evidenceByItem.get(k).push(e);}
  const ackByItem=new Map();for(const a of acknowledgements){const k=Number(a.custom_request_supplied_item_id);if(!ackByItem.has(k))ackByItem.set(k,[]);ackByItem.get(k).push(a);}
  const readiness=items.map(item=>({custom_request_supplied_item_id:Number(item.custom_request_supplied_item_id),
    ...itemReadiness(item,triageMap.get(Number(item.custom_request_id)),(reviewsByItem.get(Number(item.custom_request_supplied_item_id))||[])[0]||null,evidenceByItem.get(Number(item.custom_request_supplied_item_id))||[],ackByItem.get(Number(item.custom_request_supplied_item_id))||[])}));
  return {requests,items,triage,reviews,evidence,acknowledgements,reference_uploads:referenceUploads,stage_photos:stagePhotos,readiness,
    request_authority:'custom_requests',triage_authority:'custom_request_manufacturing_triage',reference_media_authority:'custom_request_reference_uploads',
    post_work_media_authority:'custom_order_stage_photos',automatic_feasibility_promise:false,automatic_production_start:false,inventory_mutation:false,provider_execution:false};
}
async function audit(context,admin,item,action,details={}){
  await auditAdminAction(context.env,context.request,admin,{action_type:`build216_${action}`,target_type:'custom_request_supplied_item',
    target_id:id(item?.custom_request_supplied_item_id),target_key:item?.item_key||null,details:{media_mutation:false,automatic_feasibility_promise:false,automatic_production_start:false,inventory_mutation:false,payment_execution:false,provider_execution:false,...details}});
}

export async function onRequestGet(context){
  const ctx=await ready(context.request,context.env);if(ctx.error)return ctx.error;
  return json({ok:true,...await snapshot(ctx.db)});
}
export async function onRequestPost(context){
  const ctx=await ready(context.request,context.env);if(ctx.error)return ctx.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,60).toLowerCase(),userId=id(ctx.admin.user_id)||null;

  if(action==='save_item'){
    const requestId=id(body.custom_request_id),itemId=id(body.custom_request_supplied_item_id);
    const requestRow=await requestById(ctx.db,requestId);if(!requestRow)return json({ok:false,error:'Custom Request was not found.'},404);
    if(Number(requestRow.supplied_item||0)!==1&&String(requestRow.request_type||'')!=='customer_supplied_item')return json({ok:false,error:'This Custom Request is not marked as customer-supplied.'},409);
    const ownership=OWNERSHIP.has(String(body.ownership_status||''))?String(body.ownership_status):'unconfirmed';
    const materialState=MATERIAL_STATE.has(String(body.material_status||''))?String(body.material_status):'unknown';
    const finishState=FINISH_STATE.has(String(body.finish_status||''))?String(body.finish_status):'unknown';
    const workflow=WORKFLOW_STATE.has(String(body.workflow_status||''))?String(body.workflow_status):'intake';
    const label=clean(body.item_label,240)||clean(requestRow.product_interest,240)||'Customer-supplied item';
    let item;
    if(itemId){
      item=await itemById(ctx.db,itemId);if(!item||Number(item.custom_request_id)!==requestId)return json({ok:false,error:'Supplied item was not found for this request.'},404);
      await ctx.db.prepare(`UPDATE custom_request_supplied_items SET item_label=?,item_description=?,ownership_status=?,ownership_notes=?,material_status=?,material_description=?,
        finish_status=?,finish_description=?,requested_modification=?,intake_condition_notes=?,workflow_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
        WHERE custom_request_supplied_item_id=?`).bind(label,clean(body.item_description,1600)||null,ownership,clean(body.ownership_notes,1000)||null,
        materialState,clean(body.material_description,800)||null,finishState,clean(body.finish_description,800)||null,
        clean(body.requested_modification,1600)||null,clean(body.intake_condition_notes,1600)||null,workflow,userId,itemId).run();
      item=await itemById(ctx.db,itemId);
    }else{
      const itemKey=`supitem_${requestRow.request_key}_${Date.now().toString(36)}`;
      const result=await ctx.db.prepare(`INSERT INTO custom_request_supplied_items(custom_request_id,item_key,item_label,item_description,ownership_status,ownership_notes,
        material_status,material_description,finish_status,finish_description,requested_modification,intake_condition_notes,workflow_status,created_by_user_id,updated_by_user_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(requestId,itemKey,label,clean(body.item_description,1600)||null,ownership,
        clean(body.ownership_notes,1000)||null,materialState,clean(body.material_description,800)||null,finishState,clean(body.finish_description,800)||null,
        clean(body.requested_modification,1600)||null,clean(body.intake_condition_notes,1600)||null,workflow,userId,userId).run();
      item=await itemById(ctx.db,id(result?.meta?.last_row_id));
    }
    await audit(context,ctx.admin,item,'save_item',{request_id:requestId,workflow_status:item.workflow_status,ownership_status:item.ownership_status});
    return json({ok:true,message:'Supplied-item intake record saved.',saved_item_id:Number(item.custom_request_supplied_item_id),...await snapshot(ctx.db)});
  }

  if(action==='link_evidence'){
    const item=await itemById(ctx.db,id(body.custom_request_supplied_item_id));if(!item)return json({ok:false,error:'Choose a supplied item.'},404);
    const role=EVIDENCE_ROLE.has(String(body.evidence_role||''))?String(body.evidence_role):'other';
    const sourceType=String(body.source_type||'').toLowerCase();
    let refId=null,photoId=null;
    if(sourceType==='reference_upload'){
      refId=id(body.custom_request_reference_upload_id);
      const row=refId?await ctx.db.prepare(`SELECT custom_request_reference_upload_id FROM custom_request_reference_uploads WHERE custom_request_reference_upload_id=? AND custom_request_id=? LIMIT 1`).bind(refId,Number(item.custom_request_id)).first():null;
      if(!row)return json({ok:false,error:'Choose a reference upload from the same Custom Request.'},400);
    }else if(sourceType==='stage_photo'){
      photoId=id(body.custom_order_stage_photo_id);
      const row=photoId?await ctx.db.prepare(`SELECT custom_order_stage_photo_id FROM custom_order_stage_photos WHERE custom_order_stage_photo_id=? AND custom_request_id=? LIMIT 1`).bind(photoId,Number(item.custom_request_id)).first():null;
      if(!row)return json({ok:false,error:'Choose a stage photo from the same Custom Request.'},400);
    }else return json({ok:false,error:'Choose reference_upload or stage_photo evidence.'},400);
    const duplicate=await ctx.db.prepare(`SELECT custom_request_supplied_item_evidence_id FROM custom_request_supplied_item_evidence
      WHERE custom_request_supplied_item_id=? AND evidence_status='active' AND evidence_role=? AND COALESCE(custom_request_reference_upload_id,0)=? AND COALESCE(custom_order_stage_photo_id,0)=? LIMIT 1`)
      .bind(Number(item.custom_request_supplied_item_id),role,refId||0,photoId||0).first().catch(()=>null);
    if(duplicate)return json({ok:true,message:'That evidence link is already active.',...await snapshot(ctx.db)});
    await ctx.db.prepare(`INSERT INTO custom_request_supplied_item_evidence(custom_request_supplied_item_id,custom_request_id,evidence_role,custom_request_reference_upload_id,
      custom_order_stage_photo_id,evidence_note,evidence_status,created_by_user_id,created_at) VALUES(?,?,?,?,?,?,'active',?,CURRENT_TIMESTAMP)`)
      .bind(Number(item.custom_request_supplied_item_id),Number(item.custom_request_id),role,refId,photoId,clean(body.evidence_note,1200)||null,userId).run();
    await audit(context,ctx.admin,item,'link_evidence',{evidence_role:role,source_type:sourceType,source_id:refId||photoId});
    return json({ok:true,message:'Existing media linked as supplied-item condition evidence.',...await snapshot(ctx.db)});
  }

  if(action==='void_evidence'){
    const evidenceId=id(body.custom_request_supplied_item_evidence_id);
    const evidence=await ctx.db.prepare(`SELECT * FROM custom_request_supplied_item_evidence WHERE custom_request_supplied_item_evidence_id=? LIMIT 1`).bind(evidenceId).first().catch(()=>null);
    if(!evidence)return json({ok:false,error:'Evidence link was not found.'},404);
    const reason=clean(body.void_reason,800);if(!reason)return json({ok:false,error:'Add a reason for voiding the evidence link.'},400);
    const item=await itemById(ctx.db,evidence.custom_request_supplied_item_id);
    await ctx.db.prepare(`UPDATE custom_request_supplied_item_evidence SET evidence_status='void',void_reason=?,voided_by_user_id=?,voided_at=CURRENT_TIMESTAMP
      WHERE custom_request_supplied_item_evidence_id=? AND evidence_status='active'`).bind(reason,userId,evidenceId).run();
    await audit(context,ctx.admin,item,'void_evidence',{evidence_id:evidenceId,reason});
    return json({ok:true,message:'Evidence link voided; history and media were retained.',...await snapshot(ctx.db)});
  }

  if(action==='record_review'){
    const item=await itemById(ctx.db,id(body.custom_request_supplied_item_id));if(!item)return json({ok:false,error:'Choose a supplied item.'},404);
    const decision=DECISION.has(String(body.decision||''))?String(body.decision):'needs_review';
    const triage=await triageByRequest(ctx.db,item.custom_request_id);
    if(decision!=='needs_review'&&!triage)return json({ok:false,error:'Complete Build 211 manufacturing triage before recording a final supplied-item suitability decision.'},409);
    const triageState=String(triage?.supplied_item_review_state||'not_applicable');
    if(decision==='accepted'&&triageState!=='acceptable_for_assessment')return json({ok:false,error:'Build 211 triage must be acceptable_for_assessment before recording accepted.'},409);
    if(decision==='accepted_with_limitations'&&triageState!=='limitations_required')return json({ok:false,error:'Build 211 triage must be limitations_required before recording accepted-with-limitations.'},409);
    if(decision==='declined'&&triageState!=='declined')return json({ok:false,error:'Build 211 triage must be declined before recording a Build 216 declined decision.'},409);
    if(['accepted','accepted_with_limitations'].includes(decision)&&!['customer_owned','authorized_agent'].includes(String(item.ownership_status||'')))
      return json({ok:false,error:'Confirm customer ownership or authority before accepting supplied-item work.'},409);
    const activeEvidence=(await evidenceForItem(ctx.db,item.custom_request_supplied_item_id)).filter(x=>String(x.evidence_status||'active')==='active'&&String(x.evidence_role)==='intake_condition');
    if(['accepted','accepted_with_limitations'].includes(decision)&&!activeEvidence.length&&!clean(item.intake_condition_notes,20))
      return json({ok:false,error:'Record condition-at-intake notes or link an intake-condition photo before accepting the item.'},409);
    const limitations=clean(body.limitations_text,2000);
    if(decision==='accepted_with_limitations'&&!limitations)return json({ok:false,error:'Accepted-with-limitations requires explicit limitations text.'},400);
    const compatibility=clean(body.process_compatibility_notes,2000);
    if(decision!=='needs_review'&&!compatibility)return json({ok:false,error:'Record the reviewed process/suitability basis. Unknown compatibility or safety facts must remain explicit.'},400);
    const prior=await latestReview(ctx.db,item.custom_request_supplied_item_id);
    const result=await ctx.db.prepare(`INSERT INTO custom_request_supplied_item_reviews(custom_request_supplied_item_id,custom_request_id,custom_request_manufacturing_triage_id,
      decision,process_compatibility_notes,material_unknowns,safety_unknowns,limitations_text,review_note,supersedes_review_id,reviewed_by_user_id,reviewed_at,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(Number(item.custom_request_supplied_item_id),Number(item.custom_request_id),
      id(triage?.custom_request_manufacturing_triage_id)||null,decision,compatibility||null,clean(body.material_unknowns,1600)||null,clean(body.safety_unknowns,1600)||null,
      limitations||null,clean(body.review_note,1600)||null,id(prior?.custom_request_supplied_item_review_id)||null,userId).run();
    const reviewId=id(result?.meta?.last_row_id);
    await ctx.db.prepare(`UPDATE custom_request_supplied_item_acknowledgements SET acknowledgement_status='superseded',updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_supplied_item_id=? AND acknowledgement_status='active' AND custom_request_supplied_item_review_id<>?`)
      .bind(Number(item.custom_request_supplied_item_id),reviewId).run().catch(()=>null);
    const workflow=decision==='accepted'?'accepted':decision==='accepted_with_limitations'?'limitations_pending':decision==='declined'?'declined':'reviewing';
    await ctx.db.prepare(`UPDATE custom_request_supplied_items SET workflow_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_supplied_item_id=?`)
      .bind(workflow,userId,Number(item.custom_request_supplied_item_id)).run();
    const updated=await itemById(ctx.db,item.custom_request_supplied_item_id);
    await audit(context,ctx.admin,updated,'record_review',{decision,review_id:reviewId,triage_state:triageState,append_only:true});
    return json({ok:true,message:'Append-only supplied-item suitability review recorded.',review_id:reviewId,...await snapshot(ctx.db)});
  }

  if(action==='create_acknowledgement_link'){
    const item=await itemById(ctx.db,id(body.custom_request_supplied_item_id));if(!item)return json({ok:false,error:'Choose a supplied item.'},404);
    const review=await latestReview(ctx.db,item.custom_request_supplied_item_id);
    if(!review||String(review.decision)!=='accepted_with_limitations')return json({ok:false,error:'A current accepted-with-limitations review is required before creating acknowledgement.'},409);
    await ctx.db.prepare(`UPDATE custom_request_supplied_item_acknowledgements SET acknowledgement_status='superseded',updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_supplied_item_id=? AND acknowledgement_status='active' AND custom_request_supplied_item_review_id<>?`)
      .bind(Number(item.custom_request_supplied_item_id),Number(review.custom_request_supplied_item_review_id)).run().catch(()=>null);
    const existing=await ctx.db.prepare(`SELECT * FROM custom_request_supplied_item_acknowledgements WHERE custom_request_supplied_item_id=? AND custom_request_supplied_item_review_id=? AND acknowledgement_status='active' ORDER BY custom_request_supplied_item_acknowledgement_id DESC LIMIT 1`)
      .bind(Number(item.custom_request_supplied_item_id),Number(review.custom_request_supplied_item_review_id)).first().catch(()=>null);
    if(existing)return json({ok:true,message:'An active limitation acknowledgement link already exists.',share_url:`${new URL(context.request.url).origin}/custom-request/supplied-item/?token=${encodeURIComponent(existing.acknowledgement_token)}`,...await snapshot(ctx.db)});
    const requestRow=await requestById(ctx.db,item.custom_request_id);
    const token=`supack_${crypto.randomUUID().replace(/-/g,'')}`;
    const expiresAt=clean(body.expires_at,80)||new Date(Date.now()+30*24*60*60*1000).toISOString();
    await ctx.db.prepare(`INSERT INTO custom_request_supplied_item_acknowledgements(custom_request_supplied_item_id,custom_request_supplied_item_review_id,custom_request_id,
      acknowledgement_token,acknowledgement_status,customer_name,customer_email,ownership_snapshot,limitations_snapshot,expires_at,created_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,'active',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(Number(item.custom_request_supplied_item_id),Number(review.custom_request_supplied_item_review_id),
      Number(item.custom_request_id),token,requestRow?.name||null,requestRow?.email||null,`Ownership/authority status: ${item.ownership_status}`,String(review.limitations_text||''),expiresAt,userId).run();
    await audit(context,ctx.admin,item,'create_acknowledgement_link',{review_id:Number(review.custom_request_supplied_item_review_id),expires_at:expiresAt});
    return json({ok:true,message:'Private customer limitation acknowledgement link created.',share_url:`${new URL(context.request.url).origin}/custom-request/supplied-item/?token=${encodeURIComponent(token)}`,...await snapshot(ctx.db)});
  }

  return json({ok:false,error:'Unsupported Build 216 action.'},400);
}
