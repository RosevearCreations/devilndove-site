/* Build 536: owner-readable stages from independently authenticated GET receipts.
 * A claimed Etsy number, a local upload intention, or a stale owner approval
 * is never a successful remote photo/tag transfer. Pure and side-effect free. */
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const unique=values=>new Set(values.map(String)).size===values.length;

export function assessOwnerFinalReadback536({productId,candidateListingId='',identity,photos,tags,content}={}){
 const id=Number(productId),claimed=String(identity?.linked_listing_id||''),candidate=String(candidateListingId||'');
 const exact=Number(identity?.product_id)===id&&valid(claimed)&&identity?.saved_link_readback_confirmed===true&&
  String(identity?.receipt_id||'').trim().length>0&&(!candidate||claimed===candidate);
 const stages=[];
 const add=(key,ready,message,next)=>stages.push({key,ready:Boolean(ready),message,next});
 add('identity',exact,exact?`Exact primary Product #${id} → Etsy draft #${claimed}; receipt #${identity.receipt_id}.`:
  `Product #${id} has no verified unique primary receipt${candidate?' for previously reported Etsy draft #'+candidate:''}.`,
  'Inspect the existing Etsy Drafts listing, verify its owner, then link this same unpublished draft to the Product. Do not create another listing.');

 const originals=Number(photos?.gallery_photo_count),remote=photos?.remote_reconciliation,
  pairList=Array.isArray(photos?.verified_photo_pairs_529)?photos.verified_photo_pairs_529:[],
  confirmed=Number(photos?.photo_pair_readback_529?.confirmed_pairs),
  remoteCount=Number.isSafeInteger(Number(remote?.remote_count))&&remote?.remote_count!==null?Number(remote.remote_count):null,
  unresolved=Number(photos?.hold_unconfirmed_claims||0),
  approvedIds=pairList.map(p=>p.product_image_id),etsyIds=pairList.map(p=>p.etsy_image_id);
 const photosReady=exact&&Number(photos?.product_id)===id&&String(photos?.listing_id||'')===claimed&&
  photos?.provider_contacted===true&&Number.isSafeInteger(originals)&&originals>0&&originals<=20&&
  remote?.ready===true&&remoteCount===originals&&photos?.photo_pair_readback_529?.ready===true&&
  confirmed===originals&&pairList.length===originals&&unique(approvedIds)&&unique(etsyIds)&&
  approvedIds.every(valid)&&etsyIds.every(valid)&&unresolved===0;
 const photoSummary=`Etsy photos: ${remoteCount===null?'not verified':remoteCount} / ${Number.isSafeInteger(originals)&&originals>=0?originals:'?'} saved originals; `+
  `${pairList.length} exact verified original↔Etsy photo receipt${pairList.length===1?'':'s'}`+
  `${unresolved?' · '+unresolved+' unfinished transfer claim(s)':''}.`;
 add('photos',photosReady,photoSummary,unresolved?
  'An earlier photo upload has an uncertain outcome. Reconcile its Etsy image ID with the original receipt before another transfer. Never resend blindly.':
  remote?.reason==='existing_etsy_photos_need_manual_reconciliation'?
  'Etsy contains photos missing local original-image receipts. Compare the existing photos before sending anything new.':
  'Review approved original photos and explicitly transfer only missing ones to the SAME draft; then check live photo IDs again.');

 const localTags=Array.isArray(tags?.local_tags)?tags.local_tags:[],remoteTags=Array.isArray(tags?.remote_tags)?tags.remote_tags:[],
  tagsReady=exact&&Number(tags?.product_id)===id&&String(tags?.listing_id||'')===claimed&&tags?.provider_contacted===true&&
  tags?.verified_draft===true&&tags?.verified_canada_only===true&&tags?.ready===true&&
  tags?.unresolved_attempt===false&&tags?.matching_tags===true&&localTags.length>0&&remoteTags.length===localTags.length;
 add('tags',tagsReady,`Native Etsy tags: ${tags?.provider_contacted===true?remoteTags.length+' live':'not read'} / ${localTags.length} saved; `+
  `${tags?.matching_tags===true?'reported matching':'different or unavailable'}${tags?.unresolved_attempt===true?' · earlier update not confirmed':''}.`,
  tags?.unresolved_attempt===true?'Review the earlier native-tag update on Etsy and reconcile its outcome before another write.':
  'Save valid Product search tags, review native Etsy tags and explicitly update only when different; then verify the live tags again.');

 const contentReady=exact&&photosReady&&tagsReady&&content?.ready===true&&Number(content?.product_id)===id&&
  String(content?.listing_id||'')===claimed&&content?.verified_unpublished===true&&
  content?.verified_canada_only===true&&content?.tag_readback_530?.match===true&&
  content?.tag_readback_530?.local_policy_ready===true&&content?.tag_readback_530?.remote_policy_ready===true&&
  /^[a-f0-9]{64}$/.test(String(content?.evidence_fingerprint_508||''));
 add('final',contentReady,contentReady?
  `Exact unpublished Canada-only Etsy draft matches saved content and current photo/tag fingerprint${content?.owner_receipt_530?.recorded_current?' · owner receipt already current':''}.`:
  'Independent Product, Etsy draft, Canada-only shipping and complete content fingerprint are not all verified.',
  'After resolving the precise photo/tag/identity results, recheck live content. Record one separate, explicit owner approval only when every stage matches.');
 return {ready:stages.every(s=>s.ready),stages,listingId:exact?claimed:null,photosReady,tagsReady,contentReady,
  remotePhotoCount:remoteCount,expectedPhotoCount:Number.isSafeInteger(originals)?originals:null,
  ownerRecordedCurrent:contentReady&&content?.owner_receipt_530?.recorded_current===true};
}
