/** Build 656 — private, append-only owner evidence and device reviews.
 * Uses the canonical app_settings table with optimistic concurrency. Records are
 * actor-owned attestations, NOT third-party signatures, module certification,
 * Master Shell ingestion, provider actions, or cross-app permissions. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {POLICY,REQUIREMENTS,normalizeReview,decodeOwnerRecord,summarizeOwnerReviews}
  from '../_lib/moduleAcceptance656.mjs';

const PREFIX='site.admin.module_acceptance.v656.';
const reply=(value,status=200)=>jsonResponse({build:656,...value,policy:POLICY},status,
  {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
function grant(ctx){
  const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
  if(!admin)return {error:reply({ok:false,error:'Verified, active Admin sign-in required.'},401)};
  if(!db)return {error:reply({ok:false,error:'Private source database unavailable. No acceptance recorded.'},503)};
  return {admin,db,key:PREFIX+admin.user_id};
}
async function read(db,key){
  const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1').bind(key).first();
  return {row,doc:decodeOwnerRecord(row)};
}
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function sha256(value){return hex(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(JSON.stringify(value))));}
const actorId=admin=>admin.user_id;
const list=(doc,admin)=>({ok:true,owner_user_id:actorId(admin),private:true,
  version:doc.version,requirements:REQUIREMENTS,receipts:doc.receipts.slice(0,160),
  summary:summarizeOwnerReviews(doc),original_source_writes:false,
  master_shell_reporting:false,independent_acceptance:false});

export async function onRequestGet(ctx){
  const g=grant(ctx);if(g.error)return g.error;
  const key=new URL(ctx.request.url).searchParams.get('request_key');
  if(key!==null&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
    return reply({ok:false,error:'Invalid original request key.'},400);
  try{
    const {doc}=await read(g.db,g.key);
    if(key!==null){const receipt=doc.receipts.find(x=>x.request_key===key.toLowerCase());
      return reply({ok:true,found:Boolean(receipt),receipt:receipt||null,
        automatic_retry:false,owner_user_id:actorId(g.admin)});}
    return reply(list(doc,g.admin));
  }catch{return reply({ok:false,error:'Private owner evidence unavailable. No cached review returned.'},503);}
}

export async function onRequestPost(ctx){
  const g=grant(ctx);if(g.error)return g.error;
  const origin=new URL(ctx.request.url).origin;
  if(ctx.request.headers.get('Origin')!==origin)
    return reply({ok:false,error:'Same-origin owner submission required.'},403);
  if(!ctx.request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))
    return reply({ok:false,error:'JSON content type required.'},415);
  let body;try{body=await ctx.request.json();}catch{return reply({ok:false,error:'Valid JSON required.'},400);}
  let review;try{review=normalizeReview(body);}catch(error){return reply({ok:false,error:error.message},400);}
  try{
    const {row,doc}=await read(g.db,g.key);
    const digest=await sha256({actor_user_id:actorId(g.admin),requirement_id:review.requirement_id,
      decision:review.decision,observed_at:review.observed_at,
      device_description:review.device_description,evidence_reference:review.evidence_reference,
      review_note:review.review_note,personally_observed:review.personally_observed});
    const already=doc.receipts.find(x=>x.request_key===review.request_key);
    if(already)return already.payload_sha256===digest
      ?reply({ok:true,replayed:true,receipt:already,version:doc.version,
        independent_acceptance:false,automatic_retry:false})
      :reply({ok:false,code:'IDEMPOTENCY_CONFLICT',error:'Original request key has different evidence. Reload before proceeding.'},409);
    if(doc.version!==review.expected_version)return reply({ok:false,code:'STALE_OWNER_EVIDENCE',
      error:'Another review was saved. Reload the current private version; no automatic retry.'},409);
    if(doc.receipts.length>=160)return reply({ok:false,code:'REVIEW_CAPACITY_HOLD',
      error:'Private owner history limit reached. Preserve evidence and request an approved archive workflow.'},409);
    const now=new Date().toISOString();
    const receipt={receipt_id:crypto.randomUUID(),request_key:review.request_key,
      requirement_id:review.requirement_id,decision:review.decision,
      observed_at:review.observed_at,device_description:review.device_description,
      evidence_reference:review.evidence_reference,review_note:review.review_note,
      personally_observed:review.personally_observed,actor_user_id:actorId(g.admin),
      recorded_at:now,payload_sha256:digest,independently_verified:false,
      signed_original_source:false,master_reporting_performed:false};
    const next={schema:656,version:doc.version+1,receipts:[receipt,...doc.receipts]};
    const packed=JSON.stringify(next);
    if(packed.length>63000)return reply({ok:false,error:'Private evidence document exceeds bounded storage.'},413);
    const changed=row?await g.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
      WHERE setting_key=? AND is_public=0 AND setting_value=?`)
      .bind(packed,actorId(g.admin),g.key,row.setting_value).run():
      await g.db.prepare(`INSERT INTO app_settings
      (setting_key,setting_value,is_public,updated_by_user_id,updated_at)
      VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING`)
      .bind(g.key,packed,actorId(g.admin)).run();
    if(Number(changed?.meta?.changes)!==1)return reply({ok:false,code:'STALE_OWNER_EVIDENCE',
      error:'Owner evidence changed during Save. Reload and inspect original receipt.'},409);
    // A committed source readback is required before calling the local review recorded.
    const observed=await read(g.db,g.key).catch(()=>null);
    if(!observed||observed.doc.version!==next.version||
      observed.doc.receipts[0]?.receipt_id!==receipt.receipt_id)
      return reply({ok:false,code:'SAVE_OUTCOME_UNKNOWN',
        error:'Save may have reached storage. Check the original request key; do not submit a new review.'},503);
    let audit_recorded=true;
    try{await g.db.prepare(`INSERT INTO admin_action_audit
      (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at)
      VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(actorId(g.admin),'module_656_owner_review_'+review.decision,
        'module_acceptance_checkpoint',review.requirement_id,'POST',
        '/api/admin/module-acceptance-656',JSON.stringify({receipt_id:receipt.receipt_id,
          version:next.version,private:true,source_id:'devilndove',
          independently_verified:false,master_event_published:false})).run();}
    catch{audit_recorded=false;}
    return reply({ok:true,saved:true,version:next.version,receipt,audit_recorded,
      warning:audit_recorded?null:'Local review saved, but audit insertion failed. Do not repeat it; inspect the original receipt.',
      independent_acceptance:false,master_shell_reporting:false});
  }catch{return reply({ok:false,code:'SOURCE_STORAGE_HOLD',
    error:'Private owner source storage unavailable. Check original request key before any retry.'},503);}
}
