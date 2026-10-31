/* Build 558: evidence is read from saved owner records and live Etsy IDs.
 * A Product title, checkbox or old upload claim is never remote proof. */
export const SWEET_ORANGE_558=Object.freeze({productId:54,listingId:'4601705477',photoIds:Object.freeze([342,341,343])});
const id=value=>/^[1-9]\d{0,14}$/.test(String(value??''));
const rows=value=>Array.isArray(value)?value:[];

export function ownerRecipeSnapshot558({projectId,materials,ingredients,netWeightG}={}){
  const sources=rows(materials).map(row=>({role:String(row.material_role||''),id:Number(row.packaging_source_material_template_id)}))
    .sort((a,b)=>a.role.localeCompare(b.role)||a.id-b.id);
  const inci=rows(ingredients).map(row=>String(row.inci_name||'').trim());
  return {project_id:Number(projectId||0),sources,inci,net_weight_g:Number(netWeightG||0)};
}
export function ownerRecipeReadback558(saved,receipt){
  if(!receipt||receipt.confirm_actual_formula!==true||!id(receipt.owner_user_id)||!id(receipt.project_id))return false;
  const current=ownerRecipeSnapshot558(saved);
  return current.project_id===Number(receipt.project_id)&&current.net_weight_g>0&&current.inci.length>0&&
    current.sources.some(row=>row.role==='base')&&
    JSON.stringify(current)===JSON.stringify(receipt.snapshot);
}
export function sweetOrangePhotoState558({receipt,photos,expected=SWEET_ORANGE_558}={}){
  const expectedId=String(expected.listingId),expectedPhotos=expected.photoIds.map(Number);
  const issues=[];
  const exactLinked=receipt?.saved_link_readback_confirmed===true&&String(receipt.linked_listing_id||'')===expectedId&&
    Number(receipt.product_id)===expected.productId&&!!String(receipt.receipt_id||'').trim();
  if(!exactLinked)
    issues.push('The exact existing Etsy draft has not been verified and linked to this Product.');
  if(String(photos?.listing_id||'')!==expectedId)issues.push('The photo inventory is not linked to that same Etsy draft.');
  const gallery=rows(photos?.images),originals=new Map(gallery.map(row=>[Number(row.product_image_id),row]));
  if(Number(photos?.gallery_photo_count)!==expectedPhotos.length||originals.size!==expectedPhotos.length||
    !expectedPhotos.every(photoId=>originals.has(photoId)))issues.push('The three expected original Product photographs (#342, #341, #343) need review.');
  if(expectedPhotos.some(photoId=>originals.get(photoId)?.transferable!==true))issues.push('One or more originals are not approved for Etsy transfer.');
  if(Number(photos?.hold_unconfirmed_claims||0)>0||gallery.some(row=>row.hold))issues.push('A prior photo upload is uncertain; inspect Etsy before doing anything else.');
  if(photos?.provider_contacted!==true||photos?.remote_reconciliation?.ready!==true)
    issues.push('Live Etsy photo inventory is not reconciled.');
  const pairs=rows(photos?.verified_photo_pairs_529),verifiedIds=new Map();
  for(const pair of pairs)if(expectedPhotos.includes(Number(pair.product_image_id))&&id(pair.etsy_image_id))
    verifiedIds.set(Number(pair.product_image_id),String(pair.etsy_image_id));
  const pairIds=[...verifiedIds.values()];
  if(new Set(pairIds).size!==pairIds.length)issues.push('Etsy image IDs are duplicated.');
  if(gallery.some(row=>row.transferred&&!verifiedIds.has(Number(row.product_image_id))))
    issues.push('A saved upload receipt lacks a live matching Etsy image ID.');
  const allVerified=photos?.photo_pair_readback_529?.ready===true&&
    verifiedIds.size===expectedPhotos.length&&new Set(pairIds).size===expectedPhotos.length&&
    Number(photos?.remote_reconciliation?.remote_count)===expectedPhotos.length;
  if(!allVerified)issues.push('All three original-to-Etsy photo IDs have not been independently confirmed.');
  const verifiedNow=exactLinked&&photos?.provider_contacted===true&&
    String(photos?.listing_id||'')===expectedId&&photos?.remote_reconciliation?.ready===true;
  return {ready:issues.length===0,linked:exactLinked,
    verifiedCount:verifiedNow?verifiedIds.size:0,
    verifiedIds:verifiedNow?verifiedIds:new Map(),issues,canTransfer:issues.length>0&&issues.every(x=>x==='All three original-to-Etsy photo IDs have not been independently confirmed.')&&
      photos?.provider_contacted===true&&photos?.remote_reconciliation?.ready===true};
}
