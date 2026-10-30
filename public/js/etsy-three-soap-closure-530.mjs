/* Build 530: conservative decision for one saved Product, an exact Etsy draft,
 * native tags, gallery and an optional earlier browser Save snapshot. */
import {compareUncertainProductSave521} from './product-save-outcome-521.mjs';
export function savedBrowserOutcome530({productId,saved,stored,now=Date.now()}={}){
  const at=Number(stored?.at);
  if(Number(stored?.product_id)!==Number(productId)||!stored?.submitted||
    !Number.isFinite(at)||at<=0||at>now+300000||now-at>7*86400000)
    return {state:'NO_VALID_BROWSER_RECEIPT',message:'No recent matching failed-Save browser snapshot is available. The historic POST cannot be declared successful.'};
  const comparison=compareUncertainProductSave521({productId,submitted:stored.submitted,saved});
  if(comparison.reviewed!==true||comparison.unavailable.length||comparison.different.length)
    return {state:'REVIEW_SAVED_FIELDS',message:'The earlier submitted fields differ or are unavailable. Use the Product Save recovery comparison before owner sign-off.',
      differences:comparison.different||[],unavailable:comparison.unavailable||[]};
  return {state:'CURRENT_SAVED_FIELDS_MATCH',message:'The current D1 Product fields match this browser’s earlier submitted values. This does not prove when the original POST completed.'};
}
export function assessSoapClosure530({productId,readback,content,save}={}){
  const issues=[];
  if(readback?.state!=='VERIFIED_READ_ONLY')issues.push('The exact saved Etsy listing and live original-photo pairs are not verified.');
  if(Number(content?.product_id)!==Number(productId)||String(content?.listing_id||'')!==String(readback?.listing_id||''))
    issues.push('The content readback Product or Etsy listing ID is different.');
  if(content?.verified_unpublished!==true||content?.verified_canada_only!==true||content?.ready!==true)
    issues.push('Live Etsy draft content, Canada-only shipping or photos do not fully match saved Product authority.');
  const tags=content?.tag_readback_530;
  if(tags?.match!==true||tags?.local_policy_ready!==true||tags?.remote_policy_ready!==true)
    issues.push('Saved native Etsy tags do not pass policy or equal the live Etsy draft tags.');
  if(Number(productId)===53&&content?.photo_freshness_509?.ready!==true)
    issues.push('Product #53 original photos #344–346 need the separate fresh source-image comparison.');
  if(save?.state==='REVIEW_SAVED_FIELDS')issues.push('The previous failed Product Save needs a deliberate field-difference review.');
  return {state:issues.length?'HOLD':content?.owner_receipt_530?.recorded_current===true?'OWNER_RECEIPT_CURRENT':'READY_FOR_EXPLICIT_OWNER_ACCEPTANCE',
    issues:[...new Set([...(content?.issues||[]),...(tags?.blockers||[]),...issues])],
    photo_count:readback?.pairs?.length||0,tag_count:tags?.saved_tags?.length||0,
    publication_allowed:false,automatic_write_allowed:false};
}
