/* Build 529: classify genuine *read-only* saved Product + primary Etsy ID +
 * live unpublished Canada-only draft and exact original-image receipts. */
const numeric=value=>/^[1-9]\d{0,14}$/.test(String(value||''))&&Number.isSafeInteger(Number(value));
export function parseProductIds529(raw){
 const tokens=String(raw||'').split(/[,\s]+/).filter(Boolean);
 const ids=tokens.filter(numeric).map(Number),unique=[...new Set(ids)];
 if(!tokens.length)return {ids:[],error:'Enter one to three real saved Product IDs.'};
 if(tokens.length>3)return {ids:[],error:'Choose at most three Product IDs for one bounded read.'};
 if(ids.length!==tokens.length||unique.length!==tokens.length)return {ids:[],error:'Use unique, positive numeric Product IDs only.'};
 return {ids:unique,error:null};
}
export function assessOwnerReadback529({productId,detail,identity,oauth,photos}={}){
 const issues=[],id=Number(productId),saved=detail?.product||{};
 if(Number(saved.product_id)!==id||!String(saved.name||'').trim())issues.push('Authoritative saved Product could not be identified.');
 if(Number(identity?.product_id)!==id)issues.push('Saved Etsy identity refers to another Product.');
 const listing=String(identity?.linked_listing_id||'');
 if(!numeric(listing))issues.push('No exact numeric Etsy listing ID is saved for this Product; do not create another draft without checking Etsy.');
 else if(identity.saved_link_readback_confirmed!==true)issues.push('The Etsy ID lacks one uniquely confirmed primary D1 receipt.');
 if(oauth?.connection?.connected!==true||oauth?.shop?.acceptance_status!=='connected_verified')
   issues.push('Stored Etsy OAuth and shop receipt are not verified as connected.');
 if(photos?.provider_contacted!==true)issues.push('A live Etsy draft/photo GET was not completed.');
 if(listing&&String(photos?.listing_id||'')!==listing)issues.push('Remote photo readback does not agree with the saved Etsy listing ID.');
 if(photos?.remote_reconciliation?.ready!==true)issues.push('Etsy image inventory does not match local photo receipts.');
 if(photos?.photo_pair_readback_529?.ready!==true)issues.push('Original-to-Etsy photo pairs are not independently confirmed.');
 const pairs=Array.isArray(photos?.verified_photo_pairs_529)?photos.verified_photo_pairs_529:[];
 if(!pairs.length)issues.push('No verified original-to-Etsy image pairs were returned.');
 for(const issue of photos?.photo_pair_readback_529?.issues||[])issues.push(String(issue).slice(0,200));
 return {state:issues.length?'HOLD':'VERIFIED_READ_ONLY',product_id:id,
  name:String(saved.name||identity?.product_name||'').slice(0,160),sku:String(saved.sku||'').slice(0,80),
  slug:String(saved.slug||'').slice(0,180),listing_id:numeric(listing)?listing:null,
  shop_id:oAuthShopId(oauth),pairs,issues:[...new Set(issues)],
  saved_record_read:true,oauth_live_proof:photos?.provider_contacted===true,
  no_listing_write:true,owner_approval_created:false};
}
function oAuthShopId(oauth){const id=oauth?.shop?.shop_id;return numeric(id)?String(id):null;}
