// Build 438: a Product Editor draft is never an Etsy publication.
// Keep these pure checks shared by preflight and the single-attempt write.
import {positive, WHO_MADE, WHEN_MADE} from './etsyDraftTrial399.mjs';

export function productDraftDetails(product) {
  const id=Number(product?.product_id),price=Number(product?.price_cents),quantity=Number(product?.inventory_quantity);
  const title=String(product?.name||'').trim(),description=String(product?.description||product?.short_description||'').trim();
  const blockers=[];
  if(!positive(id))blockers.push('saved_product_required');
  if(String(product?.currency||'').toUpperCase()!=='CAD'||!Number.isSafeInteger(price)||price<1)blockers.push('positive_saved_cad_price_required');
  if(!Number.isSafeInteger(quantity)||quantity<1)blockers.push('positive_inventory_required');
  if(!title||title.length>140)blockers.push('product_name_required_max_140');
  if(!description||description.length>15000)blockers.push('product_description_required_max_15000');
  return {blockers,title,description,price_cents:price,quantity,product_id:id};
}

export function productDraftFingerprint(product,shop,connection) {
  // This is a change-detection receipt, not authentication. The server re-reads all fields.
  return [product?.product_id,product?.name,product?.description,product?.short_description,
    product?.price_cents,product?.currency,product?.inventory_quantity,shop?.shop_id,
    connection?.access_expires_at].map(v=>encodeURIComponent(String(v??''))).join('|');
}

export function flattenEtsyTaxonomy(nodes,max=1200) {
  const results=[];
  function walk(items,path=[],depth=0) {
    if(depth>16||results.length>=max||!Array.isArray(items))return;
    for(const item of items){
      if(results.length>=max)break;
      const label=String(item?.name||'').trim();
      const next=label?[...path,label]:path;
      // Parent nodes are navigation headings, not listing-ready categories.
      if(positive(item?.id)&&label&&(!Array.isArray(item.children)||!item.children.length))
        results.push({id:Number(item.id),name:next.join(' › ').slice(0,220)});
      walk(item?.children,next,depth+1);
    }
  }
  walk(nodes);
  return results;
}

export function safeEtsyDraftInput(body) {
  if(body?.action!=='create_draft'||body.confirm_unpublished_draft_only!==true||body.confirm_no_automatic_retry!==true||
    body.confirm_canada_only_shipping_profile!==true||
    !positive(body.product_id)||!positive(body.taxonomy_id)||
    !positive(body.shipping_profile_id)||!positive(body.readiness_state_id)||
    !WHO_MADE.includes(body.who_made)||!WHEN_MADE.includes(body.when_made)||
    typeof body.is_supply!=='boolean'||typeof body.fingerprint!=='string'||body.fingerprint.length<12||body.fingerprint.length>80000||
    !/^[a-fA-F0-9-]{32,50}$/.test(String(body.request_key||'')))return null;
  return {product_id:Number(body.product_id),taxonomy_id:Number(body.taxonomy_id),
    shipping_profile_id:Number(body.shipping_profile_id),readiness_state_id:Number(body.readiness_state_id),who_made:body.who_made,
    when_made:body.when_made,is_supply:body.is_supply,fingerprint:body.fingerprint,request_key:body.request_key};
}

export function etsyDraftForm(input,details) {
  const form=new URLSearchParams();
  form.set('quantity',String(details.quantity));
  form.set('title',details.title);form.set('description',details.description);
  form.set('price',(details.price_cents/100).toFixed(2));
  form.set('who_made',input.who_made);form.set('when_made',input.when_made);
  form.set('is_supply',String(input.is_supply));form.set('taxonomy_id',String(input.taxonomy_id));
  form.set('shipping_profile_id',String(input.shipping_profile_id));
  form.set('readiness_state_id',String(input.readiness_state_id));
  form.set('type','physical');
  // Etsy requires shipping and processing IDs for physical drafts. Server-side
  // validation restricts the chosen profile to Canadian destinations only.
  // Never pass state=active or image IDs; publication is a separate review.
  return form;
}

export function safeEtsyShopOptions(shipping,readiness){
  const profiles=(Array.isArray(shipping?.results)?shipping.results:[]).slice(0,100)
    .filter(x=>positive(x?.shipping_profile_id)&&x?.is_deleted!==true)
    .map(x=>({id:Number(x.shipping_profile_id),name:String(x.title||'Shipping profile').slice(0,100)}));
  const processing=(Array.isArray(readiness?.results)?readiness.results:[]).slice(0,100)
    .filter(x=>positive(x?.readiness_state_id))
    .map(x=>({id:Number(x.readiness_state_id),name:String(x.processing_days_display_label||x.readiness_state||'Processing profile').slice(0,90)}));
  return {shipping:profiles,readiness:processing};
}

export function canadaOnlyShippingProfile(profile,destinations,id){
  if(!positive(id)||Number(profile?.shipping_profile_id)!==Number(id)||profile.is_deleted===true||
    String(profile.origin_country_iso||'').toUpperCase()!=='CA')return {allowed:false,reason:'Shipping profile must be active and originate in Canada.'};
  const rows=destinations?.results;
  if(!Array.isArray(rows)||!rows.length||!Number.isSafeInteger(Number(destinations.count))||
    Number(destinations.count)!==rows.length)return {allowed:false,reason:'Complete shipping destinations could not be verified; do not use this profile.'};
  if(rows.some(x=>{
    const country=String(x.destination_country_iso||'').trim().toUpperCase();
    const region=String(x.destination_region||'').trim().toLowerCase();
    // Etsy's API can represent an unselected region with the enum value 'none'.
    // Only an explicit CA country is safe: 'none' without CA is not a destination.
    return Number(x.shipping_profile_id)!==Number(id)||country!=='CA'||
      (region!==''&&region!=='none');
  }))return {allowed:false,reason:'This shipping profile includes a non-Canadian, regional or worldwide destination.'};
  return {allowed:true,destinations:rows.length,reason:'All verified destinations are Canada-only.'};
}
