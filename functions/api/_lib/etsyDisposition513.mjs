/* Build 513 — disposition REVIEW only. Product #53 remains unpublished and
 * immutable historical photo/listing conflicts are never silently closed. */
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
const goodDescription=(product)=>{
 const name=String(product?.name||'').trim(),d=String(product?.description||'').trim();
 return Boolean(d.length>=Math.max(16,name.length+8)&&d.toLowerCase()!==name.toLowerCase());
};
export function disposition513({claimEvidence,product,seo,override=null,live=null,
 priorWitness=null,priorPhotoRecheck=null,actorId=0}){
 const witness=parse(priorWitness),recheck=parse(priorPhotoRecheck);
 const issues=[...(claimEvidence?.issues||[])];
 const claimed=claimEvidence?.linked===true&&claimEvidence?.claim_state==='same_product';
 const descriptionReady=goodDescription(product);
 if(!descriptionReady)issues.push('Saved Product description needs real owner-provided materials, dimensions and making details; title-only is not acceptable.');
 const source=override?.mode==='override'?'etsy_override':'shared_product_seo';
 const tags=source==='etsy_override'?override?.tags: String(seo?.keywords||'').split(',').map(x=>x.trim()).filter(Boolean);
 const tagReview=Array.isArray(tags)&&tags.length>0&&!tags.some(tag=>/\bsoap\s*bars?\b/i.test(String(tag)));
 if(!tagReview)issues.push('Owner must correct or explicitly reassess the saved “Soap bars” Etsy tag override; do not invent product tags.');
 if(!live?.ready||live?.listing_id!=='4603838854'||live?.verified_unpublished!==true||live?.verified_canada_only!==true)
  issues.push('Current Etsy title/description, CAD price, quantity, category, tags, delivery and images are not fully matched.');
 const photos=live?.photo_freshness_509;
 if(!photos?.ready||photos.rows?.length!==3||![344,345,346].every(id=>photos.rows.some(row=>
   Number(row.product_image_id)===id&&row.ready&&row.original_image_url&&row.etsy_image_url)))
  issues.push('All three current original/Etsy photographs must have current image URL receipts.');
 if((claimEvidence?.conflicting_receipt_count||0)>0||claimEvidence?.missing_original_ids?.length)
  issues.push('Historical foreign/missing photo receipts still require a separately evidenced owner disposition.');
 const priorWasFactual=witness.build===512&&witness.product_id===53&&
   witness.listing_id==='4603838854'&&witness.decision==='observed_local_conflict_only'&&
   witness.provider_modified===false;
 const independent=Number(actorId)>0&&Number(priorPhotoRecheck?.actor_user_id)>0&&
   Number(actorId)!==Number(priorPhotoRecheck.actor_user_id);
 const sameRecheck=priorPhotoRecheck&&recheck.build===512&&
   recheck.decision==='independently_rechecked_unchanged_photos_only'&&
   recheck.source_claim_receipt_id===claimEvidence?.claim_receipt_id&&
   /^[a-f0-9]{64}$/.test(String(live?.evidence_fingerprint_508||''))&&
   recheck.evidence_fingerprint===live.evidence_fingerprint_508&&
   [344,345,346].every(id=>recheck.original_photo_ids?.includes(id));
 if(!sameRecheck)issues.push('Matching prior Build 512 independent three-original review is absent or stale.');
 if(!independent)issues.push('Independent content correction recheck requires a different verified Admin from the Build 512 photo reviewer.');
 return {build:513,product_id:53,listing_id:'4603838854',
  source_claim_state:claimEvidence?.claim_state||'unknown',source_claim_receipt_id:claimEvidence?.claim_receipt_id||null,
  conflicting_photo_receipt_ids:claimEvidence?.conflicting_photo_receipt_ids||[],
  missing_original_ids:claimEvidence?.missing_original_ids||[],
  prior_conflict_witness_id:priorWitness?.admin_action_audit_id||null,
  prior_photo_recheck_id:priorPhotoRecheck?.admin_action_audit_id||null,
  current_evidence_fingerprint:live?.evidence_fingerprint_508||null,
  product_sku:String(product?.sku||''),product_slug:String(product?.slug||''),
  tag_source:source,description_sufficient:descriptionReady,
  tags_require_owner_correction:!tagReview,etsy_readback_ready:live?.ready===true,
  can_record_disposition_followup:Boolean(priorWasFactual||claimEvidence?.can_record_conflict_witness),
  can_record_independent_content_recheck:Boolean(claimed&&descriptionReady&&tagReview&&
    live?.ready===true&&photos?.ready===true&&sameRecheck&&independent&&issues.length===0),
  issues,provider_modified:false,publication_performed:false,final_owner_approval:false,
  historical_photo_receipts_overwritten:false,connection_state:'HOLD'};
}
