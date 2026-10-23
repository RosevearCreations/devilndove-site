// Build 444 — private immutable CAD/CAM originals and reviewed canonical output lineage.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { approvalAllowed, designKey, extensionFor, LICENSES, MAX_DESIGN_BYTES, positiveId, READINESS, requestKey, safeFilename } from './_lib/makerDesignRules.js';

const out=(data,status=200)=>jsonResponse({build:444,...data},status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
const list=r=>Array.isArray(r?.results)?r.results:[];
const clean=(v,max=1200)=>String(v??'').trim().slice(0,max);
const BUCKET_NAME='CAIP_PRIVATE_MEDIA_BUCKET';
const safety={private_originals:true,public_urls:false,originals_immutable:true,operator_review_required:true,
  automatic_output_replacement:false,inventory_mutation:false,product_mutation:false,provider_publication:false};

async function access({request,env}) {
  const actor=await getAdminUserFromRequest(request,env);
  if(!actor)return {error:out({ok:false,error:'Admin login required.'},401)};
  const db=getDb(env);
  if(!db)return {error:out({ok:false,error:'Database binding unavailable.'},503)};
  const check=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('creative_work_projects','creative_work_outputs','maker_design_file_revisions','maker_design_revision_reviews','maker_design_output_links')").all();
  const found=new Set(list(check).map(r=>r.name));
  if(found.size!==5)return {error:out({ok:false,error:'Build 444 canonical D1 migration must be applied first.',code:'BUILD444_SCHEMA_REQUIRED'},503)};
  return {actor,db};
}
async function project(db,id) {
  return db.prepare("SELECT creative_work_project_id,project_key,project_title,project_status FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1").bind(id).first();
}
const revision=(db,p,id)=>db.prepare('SELECT * FROM maker_design_file_revisions WHERE creative_work_project_id=? AND maker_design_file_revision_id=? LIMIT 1').bind(p,id).first();
const latestReview=(db,id)=>db.prepare('SELECT maker_design_revision_review_id,review_status FROM maker_design_revision_reviews WHERE maker_design_file_revision_id=? ORDER BY maker_design_revision_review_id DESC LIMIT 1').bind(id).first();
async function audit(ctx,a,p,action,details){
  await auditAdminAction(ctx.env,ctx.request,a.actor,{action_type:`maker_design_${action}`,target_type:'creative_work_project',target_id:p,target_key:String(p),details:{...details,...safety}});
}
async function snapshot(db,p){
  const [revisions,outputs,links]=await Promise.all([
    db.prepare(`SELECT r.maker_design_file_revision_id,r.design_key,r.revision_no,r.parent_revision_id,r.design_title,r.original_filename,
      r.file_extension,r.sha256_hex,r.file_size_bytes,r.source_license,r.source_note,r.machine_readiness,r.revision_note,r.created_at,
      (SELECT v.maker_design_revision_review_id FROM maker_design_revision_reviews v WHERE v.maker_design_file_revision_id=r.maker_design_file_revision_id ORDER BY v.maker_design_revision_review_id DESC LIMIT 1) AS review_id,
      (SELECT v.review_status FROM maker_design_revision_reviews v WHERE v.maker_design_file_revision_id=r.maker_design_file_revision_id ORDER BY v.maker_design_revision_review_id DESC LIMIT 1) AS review_status,
      (SELECT v.review_note FROM maker_design_revision_reviews v WHERE v.maker_design_file_revision_id=r.maker_design_file_revision_id ORDER BY v.maker_design_revision_review_id DESC LIMIT 1) AS review_note
      FROM maker_design_file_revisions r WHERE r.creative_work_project_id=? ORDER BY r.maker_design_file_revision_id DESC LIMIT 121`).bind(p).all(),
    db.prepare(`SELECT creative_work_output_id,output_key,output_label,output_group,output_status,approval_status,linked_record_type,linked_record_id
      FROM creative_work_outputs WHERE creative_work_project_id=? ORDER BY creative_work_output_id DESC LIMIT 101`).bind(p).all(),
    db.prepare(`SELECT l.maker_design_output_link_id,l.creative_work_output_id,l.maker_design_file_revision_id,l.link_note,l.created_at,
      r.design_key,r.revision_no,r.sha256_hex,r.design_title
      FROM maker_design_output_links l JOIN maker_design_file_revisions r ON r.maker_design_file_revision_id=l.maker_design_file_revision_id
      WHERE l.creative_work_project_id=? ORDER BY l.maker_design_output_link_id DESC LIMIT 121`).bind(p).all()
  ]);
  if(list(revisions).length>120||list(outputs).length>100||list(links).length>120)return {error:'Project design history exceeds bounded view; archive/export review required.',code:'SCOPE_TOO_LARGE'};
  return {revisions:list(revisions),outputs:list(outputs),links:list(links),safety};
}

export async function onRequestGet(ctx){
  const a=await access(ctx);if(a.error)return a.error;
  const url=new URL(ctx.request.url),p=positiveId(url.searchParams.get('project_id'));
  try{
    if(!p){
      const rows=list(await a.db.prepare("SELECT creative_work_project_id,project_key,project_title FROM creative_work_projects ORDER BY creative_work_project_id DESC LIMIT 101").all());
      return out({ok:true,projects:rows.slice(0,100),projects_truncated:rows.length>100,safety});
    }
    const pr=await project(a.db,p);if(!pr)return out({ok:false,error:'Creative Project not found.'},404);
    const assetId=positiveId(url.searchParams.get('revision_id'));
    if(url.searchParams.get('download')==='1'){
      const file=assetId&&await revision(a.db,p,assetId);
      if(!file)return out({ok:false,error:'This revision does not belong to the selected project.'},404);
      const bucket=ctx.env[BUCKET_NAME];if(!bucket?.get)return out({ok:false,error:'Private design R2 bucket is unavailable.',code:'PRIVATE_BUCKET_REQUIRED'},503);
      const object=await bucket.get(file.object_key);
      if(!object)return out({ok:false,error:'Private original missing; contact the operator.',code:'ORIGINAL_MISSING'},503);
      await audit(ctx,a,p,'download',{revision_id:assetId});
      return new Response(object.body,{status:200,headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",
        'Content-Disposition':`attachment; filename="${safeFilename(file.original_filename)}"`}});
    }
    const data=await snapshot(a.db,p);
    return data.error?out({ok:false,...data},409):out({ok:true,project:pr,...data});
  }catch(e){console.error('BUILD444_GET',e?.name);return out({ok:false,error:'Design history could not be read.',code:'READ_FAILED'},503)}
}

export async function onRequestPost(ctx){
  const a=await access(ctx);if(a.error)return a.error;
  if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return out({ok:false,error:'Same-origin owner action required.'},403);
  const contentType=ctx.request.headers.get('content-type')||'';
  if(contentType.includes('multipart/form-data'))return uploadRevision(ctx,a);
  let body;try{body=await ctx.request.json()}catch{return out({ok:false,error:'Invalid JSON body.'},400)}
  const action=clean(body.action,40),p=positiveId(body.project_id),id=positiveId(body.revision_id),actor=positiveId(a.actor.user_id);
  if(!p||!id||!actor)return out({ok:false,error:'Project, revision and authenticated operator required.'},400);
  try{
    const selected=await revision(a.db,p,id);
    if(!selected)return out({ok:false,error:'Revision not found in this Creative Project.'},404);
    if(action==='review_revision'){
      const status=clean(body.review_status,40),note=clean(body.review_note),prior=await latestReview(a.db,id);
      const expected=positiveId(body.expected_review_id);
      if(!['approved','needs_changes','rejected'].includes(status)||note.length<12)return out({ok:false,error:'Choose a review decision and write a factual note (12+ characters).'},400);
      if(status==='approved'&&!approvalAllowed(selected))return out({ok:false,error:'Approval requires owner/licensed provenance and machine readiness READY. Record a corrected new revision otherwise.',code:'APPROVAL_HOLD'},409);
      if((prior?.maker_design_revision_review_id||0)!==expected)return out({ok:false,error:'Another review was saved. Reload before deciding.',code:'STALE_REVIEW'},409);
      const result=await a.db.prepare(`INSERT INTO maker_design_revision_reviews(maker_design_file_revision_id,review_status,review_note,reviewed_by_user_id)
        SELECT ?,?,?,? WHERE COALESCE((SELECT MAX(maker_design_revision_review_id) FROM maker_design_revision_reviews WHERE maker_design_file_revision_id=?),0)=?`)
        .bind(id,status,note,actor,id,expected).run();
      if(!result.meta?.changes)return out({ok:false,error:'Review changed; reload before deciding.',code:'STALE_REVIEW'},409);
      await audit(ctx,a,p,'review',{revision_id:id,status});
    }else if(action==='link_output'){
      const outputId=positiveId(body.output_id),note=clean(body.link_note),replace=body.replace_existing===true;
      if(!outputId||note.length<12)return out({ok:false,error:'Choose a real project output and explain the association (12+ characters).'},400);
      const output=await a.db.prepare('SELECT creative_work_output_id FROM creative_work_outputs WHERE creative_work_project_id=? AND creative_work_output_id=? LIMIT 1').bind(p,outputId).first();
      if(!output)return out({ok:false,error:'Output does not belong to this Creative Project.'},404);
      const latest=await latestReview(a.db,id);
      if(latest?.review_status!=='approved')return out({ok:false,error:'Only an explicitly approved exact design revision can be linked to an output.',code:'DESIGN_APPROVAL_REQUIRED'},409);
      const current=await a.db.prepare('SELECT maker_design_output_link_id FROM maker_design_output_links WHERE creative_work_output_id=? ORDER BY maker_design_output_link_id DESC LIMIT 1').bind(outputId).first();
      const expected=positiveId(body.expected_link_id);
      if((current?.maker_design_output_link_id||0)!==expected)return out({ok:false,error:'Output link changed. Refresh before replacing.',code:'STALE_OUTPUT_LINK'},409);
      if(current&&!replace)return out({ok:false,error:'Output already has a design; tick explicit replacement acknowledgement.',code:'REPLACEMENT_REQUIRES_CONSENT'},409);
      const result=await a.db.prepare(`INSERT INTO maker_design_output_links(creative_work_project_id,creative_work_output_id,maker_design_file_revision_id,link_note,linked_by_user_id)
        SELECT ?,?,?,?,? WHERE COALESCE((SELECT MAX(maker_design_output_link_id) FROM maker_design_output_links WHERE creative_work_output_id=?),0)=?
        AND EXISTS (SELECT 1 FROM maker_design_revision_reviews v WHERE v.maker_design_file_revision_id=? AND v.maker_design_revision_review_id=(SELECT MAX(maker_design_revision_review_id) FROM maker_design_revision_reviews WHERE maker_design_file_revision_id=?) AND v.review_status='approved')`)
        .bind(p,outputId,id,note,actor,outputId,expected,id,id).run();
      if(!result.meta?.changes)return out({ok:false,error:'Approval or output assignment changed; reload.',code:'STALE_OUTPUT_LINK'},409);
      await audit(ctx,a,p,'output_link',{revision_id:id,output_id:outputId,replace_existing:replace});
    }else return out({ok:false,error:'Unsupported design action.'},400);
    return out({ok:true,message:action==='review_revision'?'Append-only review saved.':'Exact approved design revision linked; prior assignments preserved.',...(await snapshot(a.db,p))});
  }catch(e){console.error('BUILD444_POST',e?.name);return out({ok:false,error:'Design action was not confirmed. Refresh before retrying.',code:'WRITE_NOT_CONFIRMED'},503)}
}

async function uploadRevision(ctx,a){
  const bucket=ctx.env[BUCKET_NAME];
  if(!bucket?.put)return out({ok:false,error:'Private design R2 bucket is required. No public-media fallback is permitted.',code:'PRIVATE_BUCKET_REQUIRED'},503);
  let form;try{form=await ctx.request.formData()}catch{return out({ok:false,error:'Invalid file upload.'},400)}
  const p=positiveId(form.get('project_id')),actor=positiveId(a.actor.user_id),key=designKey(form.get('design_key'));
  const title=clean(form.get('design_title'),180),license=clean(form.get('source_license'),60);
  const source=clean(form.get('source_note')),readiness=clean(form.get('machine_readiness'),60);
  const note=clean(form.get('revision_note')),reqKey=requestKey(form.get('request_key'));
  const parentId=positiveId(form.get('parent_revision_id'));
  const file=form.get('file');
  const ext=extensionFor(file?.name),size=Number(file?.size||0);
  if(!p||!actor||!key||title.length<2||!reqKey||!LICENSES.has(license)||!READINESS.has(readiness))return out({ok:false,error:'Valid project, design key, title, provenance, readiness and unique upload receipt are required.'},400);
  if((license==='licensed'||license==='third_party_reference')&&source.length<12)return out({ok:false,error:'Licensed and third-party designs require documented source and rights.'},400);
  if(!file||typeof file.arrayBuffer!=='function'||!ext||size<1||size>MAX_DESIGN_BYTES)return out({ok:false,error:'Choose a supported CAD/CAM/reference file up to 12 MiB.'},400);
  try{
    const proj=await project(a.db,p);
    if(!proj)return out({ok:false,error:'Creative Project not found.'},404);
    if(proj.project_status==='archived')return out({ok:false,error:'Archived projects cannot accept new design revisions.'},409);
    const bytes=await file.arrayBuffer();
    if(bytes.byteLength!==size)return out({ok:false,error:'File transfer size mismatch.'},400);
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    const previousRequest=await a.db.prepare('SELECT * FROM maker_design_file_revisions WHERE created_by_user_id=? AND request_key=? LIMIT 1').bind(actor,reqKey).first();
    if(previousRequest)return previousRequest.creative_work_project_id===p&&previousRequest.design_key===key&&previousRequest.sha256_hex===digest
      ?out({ok:true,replayed:true,revision_id:previousRequest.maker_design_file_revision_id,message:'Original upload already recorded; no duplicate revision created.'})
      :out({ok:false,error:'Upload receipt already belongs to different content.',code:'RECEIPT_CONFLICT'},409);
    const last=await a.db.prepare('SELECT maker_design_file_revision_id,revision_no FROM maker_design_file_revisions WHERE creative_work_project_id=? AND design_key=? ORDER BY revision_no DESC LIMIT 1').bind(p,key).first();
    if((last?.maker_design_file_revision_id||0)!==parentId)return out({ok:false,error:'The design changed. Select its exact latest parent revision before adding another.',code:'STALE_DESIGN_REVISION'},409);
    const objectKey=`maker-designs/${p}/${crypto.randomUUID()}.${ext}`;
    // A unique object key is never reused or overwritten. An unreferenced object on a DB failure
    // is deliberately retained for audited recovery rather than risking deletion of an original.
    await bucket.put(objectKey,bytes,{httpMetadata:{contentType:'application/octet-stream',cacheControl:'private, no-store'},
      customMetadata:{project_id:String(p),sha256:digest,source:'maker-design-build444'}});
    const result=await a.db.prepare(`INSERT INTO maker_design_file_revisions(
      creative_work_project_id,design_key,revision_no,parent_revision_id,design_title,original_filename,file_extension,object_key,
      sha256_hex,file_size_bytes,source_license,source_note,machine_readiness,revision_note,created_by_user_id,request_key)
      SELECT ?,?,COALESCE(MAX(revision_no),0)+1,?,?,?,?,?,?,?,?,?,?,?,?,? FROM maker_design_file_revisions
      WHERE creative_work_project_id=? AND design_key=?
      HAVING COALESCE(MAX(maker_design_file_revision_id),0)=?`)
      .bind(p,key,parentId||null,title,safeFilename(file.name),ext,objectKey,digest,size,license,source,readiness,note,actor,reqKey,p,key,parentId).run();
    if(!result.meta?.changes)return out({ok:false,error:'Design changed during upload. Original retained privately for recovery; refresh.',code:'CONCURRENT_REVISION'},409);
    const row=await a.db.prepare('SELECT maker_design_file_revision_id,revision_no FROM maker_design_file_revisions WHERE created_by_user_id=? AND request_key=?').bind(actor,reqKey).first();
    await audit(ctx,a,p,'upload',{revision_id:row?.maker_design_file_revision_id,sha256:digest,bytes:size});
    return out({ok:true,revision_id:row?.maker_design_file_revision_id,revision_no:row?.revision_no,message:'Private original saved as a new immutable revision. Review is still required.',...(await snapshot(a.db,p))});
  }catch(e){console.error('BUILD444_UPLOAD',e?.name);return out({ok:false,error:'Design upload not confirmed. Keep the same upload receipt and refresh before retrying.',code:'UPLOAD_UNCONFIRMED'},503)}
}
