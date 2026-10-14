// Release 467 Build 399 — pure safeguards for an explicit, unpublished Etsy physical draft trial.
export const REMOTE_DRAFT_ACTION='create_unpublished_etsy_draft';
export const WHO_MADE=['i_did','someone_else','collective'];
export const WHEN_MADE=['made_to_order','2020_2026','2010_2019','2007_2009','before_2007','2000_2006','1990s','1980s','1970s','1960s','1950s','1940s','1930s','1920s','1910s','1900s','1800s','1700s','before_1700'];
export const positive=v=>/^[1-9]\d*$/.test(String(v??''))&&Number.isSafeInteger(Number(v))&&Number(v)>0;
export function safeSettings(data){
 if(!data||data.action!==REMOTE_DRAFT_ACTION||data.confirmed_unpublished_draft_only!==true||
    data.confirmed_no_auto_retry!==true||!positive(data.product_id)||
    !/^[a-zA-Z0-9-]{16,80}$/.test(String(data.draft_id||''))||
    !/^[a-fA-F0-9-]{32,50}$/.test(String(data.request_key||''))||
    !positive(data.taxonomy_id)||!positive(data.shipping_profile_id)||!positive(data.readiness_state_id)||
    !WHO_MADE.includes(data.who_made)||!WHEN_MADE.includes(data.when_made)||
    typeof data.is_supply!=='boolean'||typeof data.fingerprint!=='string'||data.fingerprint.length<12||data.fingerprint.length>420)return null;
 return {action:REMOTE_DRAFT_ACTION,product_id:Number(data.product_id),draft_id:data.draft_id,request_key:data.request_key,
 taxonomy_id:Number(data.taxonomy_id),shipping_profile_id:Number(data.shipping_profile_id),
 readiness_state_id:Number(data.readiness_state_id),who_made:data.who_made,when_made:data.when_made,is_supply:data.is_supply,
 fingerprint:data.fingerprint,confirmed_unpublished_draft_only:true,confirmed_no_auto_retry:true};
}
export function connectionBlockers(conn,shop,env,now=Date.now()){
 const out=[];
 if(!conn||conn.connection_status!=='connected'||!conn.access_token_ciphertext)out.push('etsy_not_connected');
 if(!shop||shop.acceptance_status!=='connected_verified'||!positive(shop.shop_id))out.push('verified_shop_missing');
 if(conn&&shop&&String(conn.remote_subject_id)!==String(shop.owner_user_id))out.push('shop_owner_mismatch');
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('shops_r'))out.push('shops_r_missing');
 if(!Array.isArray(scopes)||!scopes.includes('listings_w'))out.push('listings_w_missing');
 const exp=Date.parse(String(conn?.access_expires_at||''));
 if(!Number.isFinite(exp)||exp<=now+120000)out.push('oauth_access_expired_or_near_expiry');
 if(String(shop?.currency_code||'').toUpperCase()!=='CAD')out.push('etsy_shop_currency_not_confirmed_CAD');
 if(!String(env?.ETSY_API_KEYSTRING||'').trim()||!String(env?.ETSY_SHARED_SECRET||'').trim())out.push('etsy_api_credentials_missing');
 return out;
}
export function localDraftReview(product,draft,shop,connection){
 let details={};try{details=JSON.parse(draft?.payload_json||'{}');}catch{}
 const id=Number(product?.product_id),price=Number(product?.price_cents),quantity=Number(product?.inventory_quantity),draftQty=Number(details.quantity);
 const blockers=[];
 if(!draft||draft.channel_key!=='etsy'||String(draft.product_id)!==String(id))blockers.push('local_etsy_draft_required');
 if(draft?.external_reference)blockers.push('already_linked_to_remote_etsy');
 if(!['draft','needs_review'].includes(String(draft?.status||'')))blockers.push('local_draft_not_reviewable');
 if(!product||!positive(id)||String(product.currency||'').toUpperCase()!=='CAD'||!Number.isSafeInteger(price)||price<1)
   blockers.push('valid_positive_cad_price_required');
 if(!Number.isSafeInteger(quantity)||quantity<1||!Number.isSafeInteger(draftQty)||draftQty<1||draftQty>quantity)
   blockers.push('inventory_changed_or_unavailable');
 if(Number(details.price_cents)!==price||String(details.currency||'').toUpperCase()!=='CAD')
   blockers.push('local_price_changed_restage');
 if(!String(details.title||'').trim()||!String(details.description||'').trim()||
    String(details.title).length>140||String(details.description).length>15000)blockers.push('staged_listing_text_required');
 const fingerprint=[String(draft?.id||''),id,price,quantity,String(shop?.shop_id||''),String(connection?.access_expires_at||''),String(draft?.updated_at||''),String(draft?.external_reference||'none')].join('|');
 return {blockers,fingerprint,details:{title:String(details.title||'').slice(0,140),
 description:String(details.description||'').slice(0,15000),price_cents:price,quantity:draftQty,currency:'CAD'},draft_id:String(draft?.id||'')};
}
export function collectTaxonomy(nodes,needle='soap',max=30){
 const found=[];const visit=(nodes,depth=0)=>{
 if(depth>18||found.length>=max||!Array.isArray(nodes))return;
 for(const n of nodes){if(found.length>=max)break;
 const name=String(n?.name||'');if(name.toLowerCase().includes(needle)&&positive(n?.id))
  found.push({id:Number(n.id),name:name.slice(0,100),level:Number(n.level)||0});
 visit(n?.children,depth+1);
 }};visit(nodes);return found;
}
export function remoteDraftForm(settings,review){
 const body=new URLSearchParams();
 body.set('quantity',String(review.details.quantity));body.set('title',review.details.title);
 body.set('description',review.details.description);
 body.set('price',(review.details.price_cents/100).toFixed(2));
 for(const field of ['who_made','when_made','taxonomy_id','shipping_profile_id','readiness_state_id'])
  body.set(field,String(settings[field]));
 body.set('is_supply',String(settings.is_supply));
 body.set('type','physical');
 // createDraftListing creates unpublished "draft" only; never pass state=active.
 return body;
}
