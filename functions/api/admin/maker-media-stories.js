// Release 467 Build 452. Maker media is referenced, never copied or published.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const str=(v,max=6000)=>String(v??'').trim().slice(0,max);
const list=r=>Array.isArray(r?.results)?r.results:[];
const reply=(data,status=200)=>jsonResponse({release:467,build:452,...data},status,{'Cache-Control':'no-store'});
const boundary=Object.freeze({private_admin_only:true,source_links_only:true,r2_copy:false,product_gallery_write:false,public_story_publication:false,etsy_publication:false,requires_consent_for_public_candidate:true});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');

async function guard(ctx){
 const user=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!user)return {error:reply({ok:false,error:'Admin authentication is required.'},401)};
 const db=getDb(ctx.env);if(!db)return {error:reply({ok:false,error:'D1 binding is unavailable.'},503)};
 const check=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('maker_media_story_revisions','maker_media_story_frames','maker_media_story_release_reviews')").first().catch(()=>null);
 if(Number(check?.n)!==3)return {error:reply({ok:false,code:'MIGRATION_REQUIRED',error:'Canonical Build 452 migration 0047 is required.'},503)};
 return {user,db};
}

async function load(db,projectId,selectedRevisionId){
 const projects=list(await db.prepare(`SELECT creative_work_project_id,project_title,project_status,privacy_status,rights_status
  FROM creative_work_projects ORDER BY creative_work_project_id DESC LIMIT 100`).all());
 if(!projectId)return {projects,selected:null,boundary};
 const project=await db.prepare('SELECT creative_work_project_id,project_title,project_status,privacy_status,rights_status FROM creative_work_projects WHERE creative_work_project_id=?').bind(projectId).first();
 if(!project)return {projects,selected:null,boundary};
 const products=list(await db.prepare(`SELECT p.product_id,p.name,p.status,p.review_status FROM products p
  WHERE p.product_id=(SELECT product_id FROM creative_work_projects WHERE creative_work_project_id=?)
  OR EXISTS(SELECT 1 FROM creative_project_product_links l WHERE l.creative_work_project_id=? AND l.product_id=p.product_id)
  OR EXISTS(SELECT 1 FROM maker_quality_product_links l JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=l.maker_quality_attempt_id
     WHERE a.creative_work_project_id=? AND l.product_id=p.product_id)
  ORDER BY p.product_id DESC LIMIT 60`).bind(projectId,projectId,projectId).all());
 const revisions=list(await db.prepare(`SELECT s.*,(SELECT r.decision FROM maker_media_story_release_reviews r WHERE r.maker_media_story_revision_id=s.maker_media_story_revision_id ORDER BY r.maker_media_story_release_review_id DESC LIMIT 1) latest_review,
   (SELECT COUNT(*) FROM maker_media_story_frames f WHERE f.maker_media_story_revision_id=s.maker_media_story_revision_id) frame_count
   FROM maker_media_story_revisions s WHERE s.creative_work_project_id=? ORDER BY s.maker_media_story_revision_id DESC LIMIT 70`).bind(projectId).all());
 const current=revisions.find(r=>id(r.maker_media_story_revision_id)===selectedRevisionId)||revisions[0]||null;
 const frames=current?list(await db.prepare(`SELECT f.*,
   CASE f.source_kind WHEN 'creative_event' THEN (SELECT media_url FROM creative_work_events WHERE creative_work_event_id=f.source_id)
     WHEN 'product_image' THEN (SELECT image_url FROM product_images WHERE product_image_id=f.source_id)
     WHEN 'product_video' THEN (SELECT video_url FROM product_video_attachments WHERE product_video_id=f.source_id)
     WHEN 'media_asset' THEN (SELECT public_url FROM media_assets WHERE media_asset_id=f.source_id) END media_url,
   c.consent_status,c.consent_scope,c.public_use_allowed,c.expires_at
   FROM maker_media_story_frames f LEFT JOIN media_consent_records c ON c.consent_record_id=f.consent_record_id
   WHERE f.maker_media_story_revision_id=? ORDER BY f.sort_order,f.maker_media_story_frame_id LIMIT 90`).bind(id(current.maker_media_story_revision_id)).all()):[];
 const events=list(await db.prepare(`SELECT creative_work_event_id,event_title,event_type,media_url,is_public_candidate FROM creative_work_events
    WHERE creative_work_project_id=? AND entry_status='active' AND length(trim(COALESCE(media_url,'')))>0
    ORDER BY creative_work_event_id DESC LIMIT 90`).bind(projectId).all());
 // Bounded batch query. Only source-linked canonical Product media is eligible.
 const ids=products.map(x=>id(x.product_id)).filter(Boolean).slice(0,60);
 let images=[],videos=[],assets=[];
 if(ids.length){const placeholders=ids.map(()=>'?').join(',');
  [images,videos,assets]=await Promise.all([
   db.prepare(`SELECT product_image_id,product_id,image_url,alt_text,sort_order FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id,sort_order LIMIT 90`).bind(...ids).all().then(list),
   db.prepare(`SELECT product_video_id,product_id,video_url,video_title,publication_status FROM product_video_attachments WHERE product_id IN (${placeholders}) ORDER BY product_video_id DESC LIMIT 60`).bind(...ids).all().then(list),
   db.prepare(`SELECT media_asset_id,product_id,public_url,object_key,variant_role FROM media_assets WHERE product_id IN (${placeholders}) AND deleted_at IS NULL ORDER BY media_asset_id DESC LIMIT 60`).bind(...ids).all().then(list)
  ]);
 }
 const consents=list(await db.prepare(`SELECT consent_record_id,media_url,consent_status,consent_scope,public_use_allowed,expires_at
   FROM media_consent_records WHERE public_use_allowed=1 AND consent_status IN ('granted','not_required') ORDER BY consent_record_id DESC LIMIT 120`).all());
 return {projects,selected:{project,products,revisions,current,frames,events,images,videos,assets,consents},boundary};
}

const tables={create_revision:['maker_media_story_revisions','maker_media_story_revision_id','edited_by_user_id'],add_frame:['maker_media_story_frames','maker_media_story_frame_id','added_by_user_id'],review_story:['maker_media_story_release_reviews','maker_media_story_release_review_id','reviewed_by_user_id']};
async function perform(db,action,body,actor,key,digest){
 if(action==='create_revision'){
  const project=id(body.project_id),product=id(body.product_id)||null,label=str(body.revision_label,100),kind=str(body.story_kind,35),title=str(body.story_title,180),narrative=str(body.narrative,8000),visibility=str(body.intended_visibility,25);
  if(!project||label.length<4||title.length<8||narrative.length<30||!['product_story','workshop_journal','tutorial','learning_failure'].includes(kind)||!['internal_only','public_candidate'].includes(visibility))return reply({ok:false,error:'Choose a Project, four-character revision label, story title, narrative of 30+ characters, kind and intended privacy.'},400);
  const r=await db.prepare(`INSERT INTO maker_media_story_revisions(creative_work_project_id,product_id,revision_label,story_kind,story_title,narrative,intended_visibility,edited_by_user_id,request_key,payload_sha256)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(project,product,label,kind,title,narrative,visibility,actor,key,digest).run();
  return {receipt:id(r.meta?.last_row_id),project,revision:id(r.meta?.last_row_id)};
 }
 if(action==='add_frame'){
  const revision=id(body.revision_id),source=id(body.source_id),kind=str(body.source_kind,30),moment=str(body.moment,30),label=str(body.frame_label,120),caption=str(body.caption,800),alt=str(body.alt_description,800),principal=body.is_principal===true||body.is_principal==='1'?1:0,publication=str(body.publication_intent,25),consent=id(body.consent_record_id)||null,sort=Number(body.sort_order||0);
  if(!revision||!source||!['creative_event','product_image','product_video','media_asset'].includes(kind)||!['before','during','after','detail','tutorial','failure'].includes(moment)||label.length<4||caption.length<12||alt.length<12||!['internal_only','public_candidate'].includes(publication)||!Number.isSafeInteger(sort)||sort<0||sort>1000)return reply({ok:false,error:'Select a real source, moment, meaningful caption and alt description, privacy and sort position.'},400);
  const story=await db.prepare('SELECT creative_work_project_id FROM maker_media_story_revisions WHERE maker_media_story_revision_id=?').bind(revision).first();if(!story)return reply({ok:false,error:'Story revision no longer exists.'},404);
  const r=await db.prepare(`INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,is_principal,publication_intent,consent_record_id,sort_order,added_by_user_id,request_key,payload_sha256)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(revision,kind,source,moment,label,caption,alt,principal,publication,consent,sort,actor,key,digest).run();
  return {receipt:id(r.meta?.last_row_id),project:id(story.creative_work_project_id),revision};
 }
 const revision=id(body.revision_id),decision=str(body.decision,40),note=str(body.review_note);
 if(!revision||!['hold','internal_only','approved_candidate'].includes(decision)||note.length<12)return reply({ok:false,error:'Choose a revision, human review decision and a factual note of 12+ characters.'},400);
 const story=await db.prepare('SELECT creative_work_project_id FROM maker_media_story_revisions WHERE maker_media_story_revision_id=?').bind(revision).first();if(!story)return reply({ok:false,error:'Story revision not found.'},404);
 const r=await db.prepare('INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)').bind(revision,decision,note,actor,key,digest).run();
 return {receipt:id(r.meta?.last_row_id),project:id(story.creative_work_project_id),revision};
}

export async function onRequestGet(ctx){
 const a=await guard(ctx);if(a.error)return a.error;
 const params=new URL(ctx.request.url).searchParams;
 try{return reply({ok:true,...await load(a.db,id(params.get('project_id')),id(params.get('revision_id')))})}
 catch(error){console.error('BUILD452_MEDIA_READ_FAILED',error?.name);return reply({ok:false,error:'Story sources could not be loaded; check canonical media availability.'},503)}
}
export async function onRequestPost(ctx){
 const a=await guard(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin admin action required.'},403);
 let body;try{body=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({ok:false,error:'An operator action object is required.'},400);
 const action=str(body.action,32),key=str(body.request_key,80),actor=id(a.user.user_id);
 if(!tables[action]||!/^[A-Za-z0-9_-]{16,80}$/.test(key)||!actor)return reply({ok:false,error:'A supported action, signed-in user and unique request key are required.'},400);
 const digest=await hash({action,actor,fields:Object.fromEntries(Object.entries(body).filter(([k])=>k!=='request_key').sort(([a],[b])=>a.localeCompare(b)))});
 const [table,pk,actorColumn]=tables[action];
 const prior=await a.db.prepare(`SELECT ${pk} receipt_id,${actorColumn} actor_id,payload_sha256 FROM ${table} WHERE request_key=?`).bind(key).first().catch(()=>null);
 if(prior)return Number(prior.actor_id)===actor&&prior.payload_sha256===digest?reply({ok:true,replayed:true,receipt_id:prior.receipt_id,boundary}):reply({ok:false,code:'REQUEST_KEY_REUSED',error:'This request key already identifies different evidence.'},409);
 try{
  const result=await perform(a.db,action,body,actor,key,digest);
  if(result?.status)return result;
  await auditAdminAction(ctx.env,ctx.request,a.user,{action_type:'build452_'+action,target_type:'maker_story_evidence',target_id:result.receipt,details:{project_id:result.project,revision_id:result.revision,boundary}});
  return reply({ok:true,receipt_id:result.receipt,project_id:result.project,revision_id:result.revision,selected:(await load(a.db,result.project,result.revision)).selected,boundary});
 }catch(error){
  console.error('BUILD452_MEDIA_WRITE_FAILED',error?.name);
  const prior=await a.db.prepare(`SELECT ${pk} receipt_id,payload_sha256 FROM ${table} WHERE request_key=?`).bind(key).first().catch(()=>null);
  if(prior&&prior.payload_sha256===digest)return reply({ok:true,replayed:true,receipt_id:prior.receipt_id,boundary});
  const known={maker_story_public_project_not_authorized:'This Creative Project is private or its public rights have not been approved.',maker_story_event_wrong_project_or_void:'Choose an active photographed event from this exact Project.',maker_story_image_wrong_product:'Product imagery must come from the linked canonical Product.',maker_story_video_wrong_product_or_blocked:'Choose an unblocked video actually attached to the linked Product.',maker_story_consent_required_and_source_matched:'The exact media URL requires current, source-matched public-use consent.',maker_story_event_not_public_candidate:'Only events explicitly marked as public candidates can be proposed for public use.',maker_story_public_approval_has_private_or_revoked_media:'At least one frame is private, expired or has revoked consent. Keep the story on HOLD.',maker_story_public_approval_requires_reviewed_media:'Select at least one genuinely consented public-candidate frame.',maker_story_product_quality_not_approved:'The linked Product has an unresolved quality hold. Keep this story private.',maker_story_revision_reviewed_locked:'An approved story revision is immutable; create another revision to revise its storyboard.'};
  const code=Object.keys(known).find(x=>String(error?.message||'').includes(x))||'SOURCE_OR_PRIVACY_CONFLICT';
  return reply({ok:false,code,error:known[code]||'Review the real source, project rights, consent and story revision. No write was confirmed.'},409);
 }
}
