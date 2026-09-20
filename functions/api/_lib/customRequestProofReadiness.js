// Release 467 Build 213 — shared Digital Proof readiness projection.
// Read-only helper: Custom Work remains request authority, Packaging remains layout/version
// authority, and customer proof approval is distinct from publication approval.

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};

export async function loadCustomRequestProofReadiness(db, customRequestId) {
  const requestId=id(customRequestId);
  if(!requestId) return null;
  const request=await db.prepare(`SELECT custom_request_id,request_key,request_type,product_interest,status
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(requestId).first().catch(()=>null);
  if(!request) return null;

  const triage=await db.prepare(`SELECT proof_sample_required,proof_sample_notes,triage_status,feasibility_state
    FROM custom_request_manufacturing_triage WHERE custom_request_id=? LIMIT 1`).bind(requestId).first().catch(()=>null);
  const versions=rows(await db.prepare(`SELECT custom_request_proof_version_id,version_number,proof_token,proof_status,proof_title,customer_message,
      source_kind,proof_preview_url,custom_order_stage_photo_id,packaging_project_id,packaging_project_version_id,source_note,expires_at,sent_at,first_viewed_at,customer_response_note,customer_responded_at,approved_at,changes_requested_at,superseded_at,expired_at,
      internal_production_approval_required,internal_production_approval_status,internal_approved_at,created_at,updated_at
    FROM custom_request_proof_versions WHERE custom_request_id=?
    ORDER BY version_number DESC,custom_request_proof_version_id DESC LIMIT 40`).bind(requestId).all().catch(()=>({results:[]})));

  const proofRequired=Number(triage?.proof_sample_required||0)===1;
  const current=versions.find(v=>!['superseded','expired'].includes(String(v.proof_status||'').toLowerCase()))||null;
  const approved=versions.find(v=>String(v.proof_status||'').toLowerCase()==='approved')||null;
  const internalRequired=Boolean(approved&&Number(approved.internal_production_approval_required||0)===1);
  const internalApproved=Boolean(approved&&(!internalRequired||String(approved.internal_production_approval_status||'')==='approved'));
  const customerApproved=Boolean(approved);
  const blockers=[];
  if(proofRequired&&!customerApproved) blockers.push('A customer proof is required but no current proof version is approved.');
  if(proofRequired&&customerApproved&&internalRequired&&!internalApproved) blockers.push('The customer-approved proof still requires internal production approval.');
  const productionReady=!proofRequired||(customerApproved&&internalApproved);

  return {
    request,
    triage:triage||null,
    proof_required:proofRequired,
    current_proof:current,
    exact_customer_approved_version:approved,
    customer_approved:customerApproved,
    internal_production_approval_required:internalRequired,
    internal_production_approved:internalApproved,
    production_ready:productionReady,
    blockers,
    versions,
    publication_authorized:false,
    customer_approval_is_publication_approval:false,
  };
}
