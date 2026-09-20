// Release 467 Build 213 — private customer Digital Proof review/response.
// Customer approval is never publication approval and never triggers payment/provider/publication actions.
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
const clean=(v,n=1600)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const CUSTOMER_STATUSES=new Set(['sent','viewed']);

async function load(db,token){
  const proof=await db.prepare(`SELECT p.*,r.request_key,r.request_type,r.product_interest,r.status request_status
    FROM custom_request_proof_versions p
    JOIN custom_requests r ON r.custom_request_id=p.custom_request_id
    WHERE p.proof_token=? LIMIT 1`).bind(token).first().catch(()=>null);
  if(!proof)return null;
  const closed=['draft','superseded','expired'].includes(String(proof.proof_status||'').toLowerCase());
  const timeExpired=proof.expires_at&&new Date(proof.expires_at).getTime()<Date.now();
  if(timeExpired&&!closed){
    await db.prepare(`UPDATE custom_request_proof_versions SET proof_status='expired',expired_at=COALESCE(expired_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_proof_version_id=? AND proof_status NOT IN ('expired','superseded')`).bind(id(proof.custom_request_proof_version_id)).run().catch(()=>null);
    await db.prepare(`INSERT INTO custom_request_proof_events(custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,created_at)
      VALUES(?,?,'expired','system','Proof link reached its configured expiry.',CURRENT_TIMESTAMP)`).bind(id(proof.custom_request_proof_version_id),id(proof.custom_request_id)).run().catch(()=>null);
    proof.proof_status='expired';proof.expired_at=new Date().toISOString();
  }
  return proof;
}
function publicProof(proof){
  const kind=String(proof.source_kind||'text_only');
  return {
    proof_version_id:id(proof.custom_request_proof_version_id),
    version_number:Number(proof.version_number||0),
    title:clean(proof.proof_title,220)||`Proof version ${Number(proof.version_number||0)}`,
    customer_message:clean(proof.customer_message,1800),
    proof_status:String(proof.proof_status||'draft'),
    request_type:clean(proof.request_type,120),
    product_interest:clean(proof.product_interest,220),
    source_kind:kind,
    source_note:clean(proof.source_note,800),
    preview_url:['customer_safe_url','stage_photo'].includes(kind)?String(proof.proof_preview_url||''):null,
    packaging_artifact_url:kind==='packaging_version'?'/api/custom-request-proof-artifact?token='+encodeURIComponent(String(proof.proof_token||'')):null,
    expires_at:proof.expires_at||null,
    sent_at:proof.sent_at||null,
    first_viewed_at:proof.first_viewed_at||null,
    customer_response_note:clean(proof.customer_response_note,1600),
    customer_responded_at:proof.customer_responded_at||null,
    approved_at:proof.approved_at||null,
    changes_requested_at:proof.changes_requested_at||null,
    internal_production_approval_required:Number(proof.internal_production_approval_required||0)===1,
    internal_production_approval_status:String(proof.internal_production_approval_status||'not_required'),
    publication_authorized:false,
    customer_approval_is_publication_approval:false,
    provider_message_sent:false,
  };
}
async function markViewed(db,proof){
  if(String(proof.proof_status||'')!=='sent')return proof;
  const versionId=id(proof.custom_request_proof_version_id),requestId=id(proof.custom_request_id);
  const result=await db.prepare(`UPDATE custom_request_proof_versions SET proof_status='viewed',first_viewed_at=COALESCE(first_viewed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP
    WHERE custom_request_proof_version_id=? AND proof_status='sent'`).bind(versionId).run();
  if(Number(result.meta?.changes||0)>0){
    await db.prepare(`INSERT INTO custom_request_proof_events(custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,created_at)
      VALUES(?,?,'viewed','customer','Customer opened the private proof link.',CURRENT_TIMESTAMP)`).bind(versionId,requestId).run().catch(()=>null);
    proof.proof_status='viewed';proof.first_viewed_at=proof.first_viewed_at||new Date().toISOString();
  }
  return proof;
}

export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const token=clean(new URL(context.request.url).searchParams.get('token'),180);
  if(!token||!token.startsWith('proof_'))return json({ok:false,error:'A valid private proof token is required.'},400);
  const proof=await load(db,token);
  if(!proof||['draft','superseded','expired'].includes(String(proof.proof_status||'')))return json({ok:false,error:'This proof link was not found or is no longer active.'},404);
  await markViewed(db,proof);
  return json({ok:true,proof:publicProof(proof)});
}

export async function onRequestPost(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const token=clean(body.token,180),action=clean(body.action,40).toLowerCase(),note=clean(body.customer_response_note||body.note,1600);
  if(!token||!['approve','request_changes'].includes(action))return json({ok:false,error:'Choose approve or request changes for this proof.'},400);
  const proof=await load(db,token);
  if(!proof||!CUSTOMER_STATUSES.has(String(proof.proof_status||'')))return json({ok:false,error:'This proof is no longer open for a customer response.'},409);
  const versionId=id(proof.custom_request_proof_version_id),requestId=id(proof.custom_request_id);
  if(action==='approve'){
    await db.prepare(`UPDATE custom_request_proof_versions SET proof_status='approved',customer_response_note=?,customer_responded_at=CURRENT_TIMESTAMP,
      approved_at=CURRENT_TIMESTAMP,changes_requested_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE custom_request_proof_version_id=? AND proof_status IN ('sent','viewed')`)
      .bind(note||null,versionId).run();
    await db.prepare(`INSERT INTO custom_request_proof_events(custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,created_at)
      VALUES(?,?,'approved','customer',?,CURRENT_TIMESTAMP)`).bind(versionId,requestId,note||'Customer approved this exact proof version.').run();
  }else{
    await db.prepare(`UPDATE custom_request_proof_versions SET proof_status='changes_requested',customer_response_note=?,customer_responded_at=CURRENT_TIMESTAMP,
      changes_requested_at=CURRENT_TIMESTAMP,approved_at=NULL,internal_production_approval_status=CASE WHEN internal_production_approval_required=1 THEN 'pending' ELSE 'not_required' END,
      internal_approved_by_user_id=NULL,internal_approved_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE custom_request_proof_version_id=? AND proof_status IN ('sent','viewed')`)
      .bind(note||null,versionId).run();
    await db.prepare(`INSERT INTO custom_request_proof_events(custom_request_proof_version_id,custom_request_id,event_type,actor_type,event_note,created_at)
      VALUES(?,?,'changes_requested','customer',?,CURRENT_TIMESTAMP)`).bind(versionId,requestId,note||'Customer requested changes to this proof version.').run();
  }
  const updated=await load(db,token);
  return json({ok:true,message:action==='approve'?'This proof version is approved. Thank you.':'Your requested changes were recorded for review.',proof:publicProof(updated)});
}
