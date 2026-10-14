
export const validId=x=>/^[1-9]\d*$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
export function toCents(p) {
 const a=Number(p?.amount),d=Number(p?.divisor);
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(d)||d<1||String(p?.currency_code).toUpperCase()!=='CAD') return null;
 const cents=a*100/d;
 return Number.isSafeInteger(cents)&&cents>0?cents:null;
}
export function verifyRemote(listing,shop,product,draft,claim) {
 let saved={};try{saved=JSON.parse(draft?.payload_json||'{}');}catch{}
 const blockers=[],listingId=String(listing?.listing_id||'');
 if(!claim?.admin_action_audit_id)blockers.push('unclaimed_local_draft');
 if(!validId(listingId))blockers.push('listing_id_missing');
 if(String(listing?.shop_id)!==String(shop?.shop_id)||!validId(shop?.shop_id))blockers.push('shop_mismatch');
 if(String(listing?.state).toLowerCase()!=='draft')blockers.push('not_unpublished_draft');
 if(listing?.listing_type&&listing.listing_type!=='physical')blockers.push('not_physical');
 if(!saved.title||String(listing?.title||'').trim()!==String(saved.title).trim())blockers.push('title_mismatch');
 if(!product||String(product.product_id)!==String(draft?.product_id)||draft?.channel_key!=='etsy')blockers.push('local_product_mismatch');
 if(toCents(listing?.price)!==Number(saved.price_cents)||!Number.isSafeInteger(Number(saved.price_cents))||Number(saved.price_cents)<1)blockers.push('cad_price_mismatch');
 if(!Number.isSafeInteger(Number(saved.quantity))||Number(saved.quantity)<1||Number(listing?.quantity)!==Number(saved.quantity))blockers.push('quantity_mismatch');
 if(draft?.external_reference&&String(draft.external_reference)!==listingId)blockers.push('linked_id_conflict');
 return {verified:blockers.length===0,blockers,listing_id:validId(listingId)?listingId:null,shop_id:String(listing?.shop_id||''),
 state:String(listing?.state||'unknown'),price_cents:toCents(listing?.price),quantity:Number(listing?.quantity||0),publication_performed:false};
}
