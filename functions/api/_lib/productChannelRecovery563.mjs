/* Build 563 — source-linked, GET-only local receipt reconciliation. No provider assertion. */
export const RECOVERY_CHANNELS_563=Object.freeze(['etsy','facebook_marketplace','facebook','instagram','tiktok','x','pinterest','youtube']);
const clean=value=>String(value??'').trim();
const parseList=value=>{try{const data=JSON.parse(value||'[]');return Array.isArray(data)?data:[];}catch{return [];}};
const localOnly='Saved local evidence is not a live provider status check.';
const positive=value=>/^[1-9]\d{0,14}$/.test(clean(value))&&Number.isSafeInteger(Number(value));
const safeUrl=value=>{try{const url=new URL(clean(value));return url.protocol==='https:'?url.href:null;}catch{return null;}};

export function projectProductRecovery563({product,drafts=[],queue=[],attempts=[],draftsUnavailable=false,
  queueUnavailable=false,attemptsUnavailable=false}={}){
  const productId=positive(product?.product_id)?Number(product.product_id):null;
  const savedQueue=(Array.isArray(queue)?queue:[]).filter(row=>
    row.source_type==='product'&&String(row.source_id)===String(productId)&&positive(row.social_post_queue_id));
  const queueById=new Map(savedQueue.map(row=>[Number(row.social_post_queue_id),row]));
  const attemptsById=new Map();
  for(const row of Array.isArray(attempts)?attempts:[]){
    const id=Number(row.social_post_queue_id);
    if(!queueById.has(id)||!RECOVERY_CHANNELS_563.includes(clean(row.platform_key)))continue;
    const list=attemptsById.get(id)||[];list.push(row);attemptsById.set(id,list);
  }
  const result=RECOVERY_CHANNELS_563.map(channel=>{
    const related=savedQueue.filter(row=>parseList(row.target_platforms_json).includes(channel)||
      [...(attemptsById.get(Number(row.social_post_queue_id))||[])].some(a=>a.platform_key===channel));
    const records=related.flatMap(row=>(attemptsById.get(Number(row.social_post_queue_id))||[])
      .filter(a=>a.platform_key===channel).map(a=>({queue_id:Number(row.social_post_queue_id),
        attempt_id:positive(a.social_post_attempt_id)?Number(a.social_post_attempt_id):null,
        status:clean(a.attempt_status)||'unknown',remote_id:clean(a.external_post_id||a.platform_response_id)||null,
        remote_url:safeUrl(a.external_post_url||a.published_url),attempted_at:clean(a.attempted_at)||null})));
    const external=records.filter(r=>r.remote_id);
    const ids=[...new Set(external.map(r=>r.remote_id))];
    const published=records.some(r=>/posted|success|publish/i.test(r.status));
    const uncertain=records.some(r=>/failed|pending|timeout|unknown|started|error|attempt/i.test(r.status))||
      (records.length>0&&external.length===0);
    const draftClaims=(Array.isArray(drafts)?drafts:[]).filter(r=>clean(r.channel_key)===channel&&clean(r.external_reference));
    const claimIds=[...new Set(draftClaims.map(r=>clean(r.external_reference)))];
    const conflict=ids.length>1||claimIds.length>1||
      (ids.length>0&&claimIds.length>0&&ids.some(x=>!claimIds.includes(x)));
    const missing=channel==='etsy'?draftsUnavailable:queueUnavailable||attemptsUnavailable;
    const state=missing?'unavailable':conflict?'conflict':uncertain?'uncertain':
      (published||ids.length||claimIds.length)?'local_receipt_only':related.length?'queued_for_review':'no_receipt';
    const blockers=[];
    if(missing)blockers.push('Evidence source unavailable. Do not infer that a post succeeded or failed.');
    if(conflict)blockers.push('Conflicting remote identifiers or multiple draft claims; verify in the provider account.');
    if(uncertain)blockers.push('A prior attempt may have reached the provider. Do not send again until checked manually.');
    if(channel==='etsy'&&claimIds.length)blockers.push('Etsy listing linkage does not prove current live draft status or photo inventory.');
    if(!records.length&&!claimIds.length)blockers.push('No verified external publication receipt for this Product and destination.');
    const hold=state!=='no_receipt'&&state!=='queued_for_review'||related.some(row=>Number(row.do_not_repost)===1);
    return {channel,state,hold_repost:hold,local_queue_ids:related.map(row=>Number(row.social_post_queue_id)),
      external_reference:conflict?null:ids[0]||claimIds[0]||null,external_reference_verified_live:false,
      attempts:records.slice(0,12),attempt_count:records.length,blockers,
      next_action:state==='no_receipt'?'Prepare a fresh manual handoff after checking the destination for an existing post.':
        state==='queued_for_review'?'Review the existing Social Queue item; do not create a duplicate.':
        'Open the provider and inspect the exact account/post. Record corrections only in the existing authorized workflow.'};
  });
  return {product_id:productId,source:'saved_product_local_queue_attempts_and_draft_claims',
    destinations:result,manual_resolution_required:result.some(x=>x.hold_repost),
    provider_contacted:false,publication_performed:false,automatic_retry:false,remote_status_verified:false,
    remote_update_authorized:false,local_evidence_note:localOnly,
    recovery_policy:'Read existing evidence first. No automatic retry, duplicate create, remote update or silent resolution.'};
}
