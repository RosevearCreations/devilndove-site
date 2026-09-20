// Release 467 Build 213 — Digital Proof & Customer Approval admin authority.
// Explicit-save only. No request-time DDL, provider messaging, publication, payment,
// Inventory, CAIP-private-media or Production execution side effects.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { loadCustomRequestProofReadiness } from '../_lib/customRequestProofReadiness.js';

const BUILD=213;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const CUSTOMER_STATUSES=new Set(['sent','viewed']);
const INTERNAL_STATUSES=new Set(['pending','approved','rejected']);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const ready=await db.prepare("SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name IN ('custom_request_proof_versions','custom_request_proof_events')").first().catch(()=>({c:0}));
  if(Number(ready?.c||0)!==2)return {error:json({ok:false,error:'Build 213 canonical migration is required.',code:'build213_schema_required'},503)};
  return {admin,db};
}
function proofToken(){return 'proof_'+crypto.randomUUID().replace(/-/g,'');}
function safePreviewUrl(value){
  const u=clean(value,1200);
  if(!u)return null;
  const low=u.toLowerCase();
  if(!(u.startsWith('/')||/^https:\/\//i.test(u)))throw new Error('Customer-safe preview URL must be root-relative or HTTPS.');
  if(low.includes('/api/admin/')||low.includes('/admin/')||low.includes('caip')||low.includes('private-media')||low.includes('private_media'))throw new Error('Admin/private/CAIP URLs cannot be used as customer proof previews.');
  return u;
}
async function requestRow(db,requestId){
  return db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,quantity,project_intent,
      intended_use,organization_name,event_name,desired_material,desired_finish,personalization_text,deadline_date,updated_at
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(requestId).first();
}
async function event(db,{versionId,requestId,type,actor='admin',note=null,userId=null}){
  await db.prepare(`INSERT INTO custom_request_proof_events(
    custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,actor_user_id,created_at)
    VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(versionId,requestId,type,actor,note,userId).run();
}
async function validateSource(db,requestId,body){
  const kind=clean(body.source_kind,40)||'text_only';
  if(!['text_only','customer_safe_url','stage_photo','packaging_version'].includes(kind))throw new Error('Choose a supported customer proof source.');
  if(kind==='text_only')return {kind,previewUrl:null,stagePhotoId:null,packagingProjectId:null,packagingVersionId:null,sourceNote:clean(body.source_note,800)||null};
  if(kind==='customer_safe_url')return {kind,previewUrl:safePreviewUrl(body.proof_preview_url),stagePhotoId:null,packagingProjectId:null,packagingVersionId:null,sourceNote:clean(body.source_note,800)||null};
  if(kind==='stage_photo'){
    const stagePhotoId=id(body.custom_order_stage_photo_id);
    const photo=stagePhotoId?await db.prepare(`SELECT custom_order_stage_photo_id,image_url,image_caption,public_use_status,moderation_status
      FROM custom_order_stage_photos WHERE custom_order_stage_photo_id=? AND custom_request_id=? LIMIT 1`).bind(stagePhotoId,requestId).first():null;
    if(!photo)throw new Error('Choose a stage photo attached to this Custom Request.');
    const publicUse=String(photo.public_use_status||'').toLowerCase(),moderation=String(photo.moderation_status||'').toLowerCase();
    if(!['customer_private','product_page_ok','social_ok','all_public_ok'].includes(publicUse)||!['approved','customer_private'].includes(moderation))throw new Error('The stage photo is not cleared for customer viewing.');
    return {kind,previewUrl:safePreviewUrl(photo.image_url),stagePhotoId,packagingProjectId:null,packagingVersionId:null,sourceNote:clean(body.source_note||photo.image_caption,800)||null};
  }
  const packagingProjectId=id(body.packaging_project_id),packagingVersionId=id(body.packaging_project_version_id);
  const pv=packagingProjectId&&packagingVersionId?await db.prepare(`SELECT v.packaging_project_version_id,v.packaging_project_id,v.version_number,v.version_label,v.review_status,
      CASE WHEN COALESCE(v.svg_markup,'')<>'' THEN 1 ELSE 0 END has_svg,p.project_name
    FROM packaging_project_versions v JOIN packaging_projects p ON p.packaging_project_id=v.packaging_project_id
    WHERE v.packaging_project_version_id=? AND v.packaging_project_id=? LIMIT 1`).bind(packagingVersionId,packagingProjectId).first():null;
  if(!pv||Number(pv.has_svg||0)!==1)throw new Error('Choose an immutable saved Packaging version with an SVG artifact.');
  return {kind,previewUrl:null,stagePhotoId:null,packagingProjectId,packagingVersionId,sourceNote:clean(body.source_note||`${pv.project_name||'Packaging'} — ${pv.version_label||'Version '+pv.version_number}`,800)||null};
}
async function bundle(db,requestId=0){
  const requests=rows(await db.prepare(`SELECT r.custom_request_id,r.request_key,r.name,r.email,r.request_type,r.product_interest,r.status,r.quantity,r.project_intent,r.updated_at,
      (SELECT COUNT(*) FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id) proof_version_count,
      (SELECT p.proof_status FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id ORDER BY p.version_number DESC LIMIT 1) latest_proof_status
    FROM custom_requests r ORDER BY datetime(r.updated_at) DESC,r.custom_request_id DESC LIMIT 80`).all());
  let request=null,readiness=null,events=[],stagePhotos=[],packagingCandidates=[];
  if(requestId){
    request=await requestRow(db,requestId);
    if(request){
      readiness=await loadCustomRequestProofReadiness(db,requestId);
      const versionIds=(readiness?.versions||[]).map(v=>id(v.custom_request_proof_version_id)).filter(Boolean);
      if(versionIds.length){
        events=rows(await db.prepare(`SELECT custom_request_proof_event_id,custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,actor_user_id,created_at
          FROM custom_request_proof_events WHERE custom_request_id=? ORDER BY custom_request_proof_event_id DESC LIMIT 120`).bind(requestId).all());
      }
      stagePhotos=rows(await db.prepare(`SELECT custom_order_stage_photo_id,image_url,image_caption,public_use_status,moderation_status,stage_key,created_at
        FROM custom_order_stage_photos WHERE custom_request_id=? AND COALESCE(public_use_status,'internal_review') IN ('customer_private','product_page_ok','social_ok','all_public_ok')
          AND COALESCE(moderation_status,'approved') IN ('approved','customer_private')
        ORDER BY datetime(created_at) DESC,custom_order_stage_photo_id DESC LIMIT 40`).bind(requestId).all().catch(()=>({results:[]})));
      packagingCandidates=rows(await db.prepare(`SELECT v.packaging_project_version_id,v.packaging_project_id,v.version_number,v.version_label,v.review_status,v.created_at,p.project_name,
          CASE WHEN COALESCE(v.svg_markup,'')<>'' THEN 1 ELSE 0 END has_svg
        FROM packaging_project_versions v JOIN packaging_projects p ON p.packaging_project_id=v.packaging_project_id
        WHERE COALESCE(v.svg_markup,'')<>'' ORDER BY datetime(v.created_at) DESC,v.packaging_project_version_id DESC LIMIT 60`).all().catch(()=>({results:[]})));
    }
  }
  return {requests,request,readiness,events,stage_photos:stagePhotos,packaging_candidates:packagingCandidates,
    publication_authorized:false,provider_message_sent:false,caip_private_originals_exposed:false};
}
async function audit(env,request,admin,requestId,action,details={}){
  await auditAdminAction(env,request,admin,{action_type:`custom_request_proof_${action}`,target_type:'custom_request',target_id:requestId,target_key:String(requestId),details:{
    customer_approval_is_publication_approval:false,publication_authorized:false,provider_message_sent:false,caip_private_originals_exposed:false,...details
  }});
}

export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  const requestId=id(new URL(request.url).searchParams.get('request_id'));
  if(requestId&&!(await requestRow(a.db,requestId)))return json({ok:false,error:'Custom Request not found.'},404);
  return json({ok:true,...await bundle(a.db,requestId)});
}

export async function onRequestPost({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80).toLowerCase(),requestId=id(body.custom_request_id||body.request_id);
  const req=await requestRow(a.db,requestId);if(!req)return json({ok:false,error:'Choose an existing Custom Request.'},400);
  const userId=id(a.admin.user_id)||null;
  let message='Digital proof saved.';

  if(action==='create_version'){
    const source=await validateSource(a.db,requestId,body);
    const max=await a.db.prepare('SELECT COALESCE(MAX(version_number),0) m FROM custom_request_proof_versions WHERE custom_request_id=?').bind(requestId).first();
    const version=Number(max?.m||0)+1,token=proofToken();
    const internalRequired=Number(body.internal_production_approval_required||0)===1?1:0;
    const internalStatus=internalRequired?'pending':'not_required';
    const result=await a.db.prepare(`INSERT INTO custom_request_proof_versions(
      custom_request_id,version_number,proof_token,proof_title,customer_message,proof_status,source_kind,proof_preview_url,
      custom_order_stage_photo_id,packaging_project_id,packaging_project_version_id,source_note,expires_at,
      internal_production_approval_required,internal_production_approval_status,created_by_user_id,updated_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
      .bind(requestId,version,token,clean(body.proof_title,220)||`Proof version ${version}`,clean(body.customer_message,1800)||null,source.kind,source.previewUrl,
        source.stagePhotoId,source.packagingProjectId,source.packagingVersionId,source.sourceNote,clean(body.expires_at,80)||null,
        internalRequired,internalStatus,userId,userId).run();
    const versionId=id(result.meta?.last_row_id);
    await event(a.db,{versionId,requestId,type:'created',note:clean(body.source_note,800)||null,userId});
    await audit(env,request,a.admin,requestId,'create',{proof_version_id:versionId,version_number:version,source_kind:source.kind,internal_approval_required:Boolean(internalRequired)});
    message=`Proof version ${version} created as a private draft.`;
  } else {
    const versionId=id(body.custom_request_proof_version_id);
    const version=versionId?await a.db.prepare('SELECT * FROM custom_request_proof_versions WHERE custom_request_proof_version_id=? AND custom_request_id=? LIMIT 1').bind(versionId,requestId).first():null;
    if(!version)return json({ok:false,error:'Choose a proof version attached to this Custom Request.'},400);

    if(action==='activate_link'){
      if(!['draft','changes_requested'].includes(String(version.proof_status||'')))return json({ok:false,error:'Only a draft or changes-requested version can be activated.'},409);
      await a.db.prepare(`UPDATE custom_request_proof_versions SET proof_status='superseded',superseded_at=COALESCE(superseded_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP,updated_by_user_id=?
        WHERE custom_request_id=? AND custom_request_proof_version_id<>? AND proof_status IN ('sent','viewed','approved')`).bind(userId,requestId,versionId).run();
      const old=rows(await a.db.prepare(`SELECT custom_request_proof_version_id FROM custom_request_proof_versions
        WHERE custom_request_id=? AND custom_request_proof_version_id<>? AND proof_status='superseded' AND superseded_at IS NOT NULL ORDER BY version_number DESC LIMIT 20`).bind(requestId,versionId).all());
      for(const row of old)await event(a.db,{versionId:id(row.custom_request_proof_version_id),requestId,type:'superseded',actor:'system',note:`Superseded when proof version ${version.version_number} was activated.`,userId});
      await a.db.prepare(`UPDATE custom_request_proof_versions SET proof_status='sent',sent_at=COALESCE(sent_at,CURRENT_TIMESTAMP),updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_proof_version_id=?`).bind(userId,versionId).run();
      await event(a.db,{versionId,requestId,type:'sent',note:'Private proof link activated. No provider message was sent automatically.',userId});
      await audit(env,request,a.admin,requestId,'activate',{proof_version_id:versionId,provider_message_sent:false});
      message='Private proof link activated. Copy/share it manually; no email or provider message was sent.';
    } else if(action==='expire_version'){
      if(['superseded','expired'].includes(String(version.proof_status||'')))return json({ok:false,error:'This proof is already closed.'},409);
      await a.db.prepare(`UPDATE custom_request_proof_versions SET proof_status='expired',expired_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_proof_version_id=?`).bind(userId,versionId).run();
      await event(a.db,{versionId,requestId,type:'expired',note:clean(body.note,800)||'Expired by administrator.',userId});
      await audit(env,request,a.admin,requestId,'expire',{proof_version_id:versionId});
      message='Proof version expired.';
    } else if(action==='internal_review'){
      const status=clean(body.internal_production_approval_status,40);
      if(!INTERNAL_STATUSES.has(status))return json({ok:false,error:'Choose pending, approved, or rejected for internal production approval.'},400);
      if(status==='approved'&&String(version.proof_status||'')!=='approved')return json({ok:false,error:'Customer approval is required before internal production approval.'},409);
      const required=Number(version.internal_production_approval_required||0)===1;
      const effective=required?status:'not_required';
      await a.db.prepare(`UPDATE custom_request_proof_versions SET internal_production_approval_status=?,internal_production_approval_note=?,
        internal_approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE NULL END,
        internal_approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_proof_version_id=?`)
        .bind(effective,clean(body.internal_production_approval_note,1200)||null,effective,userId,effective,userId,versionId).run();
      const eventType=effective==='approved'?'internal_approved':effective==='rejected'?'internal_rejected':'internal_reset';
      await event(a.db,{versionId,requestId,type:eventType,note:clean(body.internal_production_approval_note,1200)||null,userId});
      await audit(env,request,a.admin,requestId,'internal_review',{proof_version_id:versionId,status:effective});
      message=`Internal production approval is now ${effective.replace(/_/g,' ')}.`;
    } else {
      return json({ok:false,error:'Unsupported Build 213 proof action.'},400);
    }
  }
  return json({ok:true,message,...await bundle(a.db,requestId)});
}
