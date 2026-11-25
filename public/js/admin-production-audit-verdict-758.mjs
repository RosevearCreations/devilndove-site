// Build 758: fail-closed decision for original production source and private D1 certificate readback.
// A software readback is NOT an independent human-identity or field acceptance certificate.
const SHA40=/^[a-f0-9]{40}$/i, DIGEST64=/^[a-f0-9]{64}$/i;
const hold=(code)=>({outcome:'HOLD',code,source_sha:null,digest:null});
export function validPublicMarker758(marker) {
  return marker?.branch==='main' && SHA40.test(String(marker.source_sha||'')) &&
    /^\d+$/.test(String(marker.workflow_run_id||''));
}
export function evaluateBuild758(marker,doc) {
  if(!validPublicMarker758(marker))return hold('INVALID_LIVE_RELEASE_MARKER');
  const sha=String(marker.source_sha).toLowerCase();
  if(doc?.ok!==true || doc?.build!==756 || doc?.private_d1_only!==true)
    return hold('PRIVATE_ORIGINAL_READBACK_UNAVAILABLE');
  if(doc.production_marker?.ok!==true ||
      String(doc.production_marker.source_sha||'').toLowerCase()!==sha ||
      String(doc.status?.current_main_sha||'').toLowerCase()!==sha)
    return hold('CURRENT_PRODUCTION_SHA_MISMATCH');
  if(doc.source_verified!==true || doc.original_source_fresh!==true ||
      doc.status?.verified_original_source!==true)
    return hold('ORIGINAL_SOURCE_NOT_INDEPENDENTLY_VERIFIED');
  if(doc.automatic_renewal!==false || doc.no_purge!==true)
    return hold('PRIVATE_APPROVAL_BOUNDARY_NOT_VERIFIED');
  const digest=String(doc.source_renewal_sha256||'').toLowerCase();
  if(!DIGEST64.test(digest))return hold('AUDIT_DIGEST_INVALID');
  const previous=String(doc.status?.previous_sha||'').toLowerCase();
  if(!SHA40.test(previous)||previous===sha)return hold('PRIOR_RELEASE_PROVENANCE_MISSING');
  if(doc.status?.certificate_renewed!==true ||
     doc.status?.status!=='CURRENT_RELEASE_CERTIFICATE_RENEWED')
    return hold('TWO_DISTINCT_ORIGINAL_ADMIN_RECEIPTS_REQUIRED');
  return {outcome:'PRIVATE_D1_CONTINUITY_RECORDED',code:'CURRENT_RELEASE_MATCH',
    source_sha:sha,digest,previous_sha:previous,
    human_field_certification:false};
}
