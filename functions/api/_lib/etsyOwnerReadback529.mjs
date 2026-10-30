// Build 529: read-only original-to-Etsy photo receipt verification. Neither
// missing source images nor a zero-photo/zero-receipt comparison is success.
const id=value=>/^[1-9]\d{0,14}$/.test(String(value??''))&&Number.isSafeInteger(Number(value));
const safeEtsyImageUrl=value=>{
  try{const url=new URL(String(value||''));return url.protocol==='https:'&&
    (url.hostname==='etsystatic.com'||url.hostname.endsWith('.etsystatic.com'))?url.href:null;
  }catch{return null;}
};
export function verifiedOwnerPhotoPairs529({listingId,images=[],remote=[],receipts=[],galleryCount}={}){
  const issues=[];
  if(!id(listingId)||!Array.isArray(images)||!Array.isArray(remote)||!Array.isArray(receipts))
    return {ready:false,pairs:[],issues:['Incomplete listing or gallery readback.']};
  const originals=images.filter(row=>id(row.product_image_id));
  if(Number.isSafeInteger(galleryCount)&&galleryCount!==originals.length)
    issues.push('Some images in the full Product gallery are missing, invalid or not approved for transfer.');
  if(!originals.length)issues.push('No approved original Product photos were returned.');
  if(originals.length>20||remote.length>20)issues.push('The full gallery exceeds Etsy’s 20-photo limit.');
  if(originals.some(row=>row.transferable!==true))issues.push('An original photo lacks approved public-use R2 authority.');
  const remoteMap=new Map(remote.filter(row=>id(row?.listing_image_id)).map(row=>[String(row.listing_image_id),row]));
  if(remoteMap.size!==remote.length)issues.push('Remote Etsy image IDs are missing or duplicated.');
  const pairs=[],seenOriginals=new Set(),seenEtsy=new Set();
  for(const receipt of receipts){
    const original=String(receipt?.product_image_id||''),etsy=String(receipt?.etsy_image_id||'');
    if(String(receipt?.listing_id||'')!==String(listingId)||receipt?.verified_remote_readback!==true||
      !id(original)||!id(etsy)||seenOriginals.has(original)||seenEtsy.has(etsy)||!remoteMap.has(etsy)||
      !originals.some(row=>String(row.product_image_id)===original)){
      issues.push('A photo receipt is stale, duplicated, lacks remote confirmation, or belongs to another listing.');
      continue;
    }
    seenOriginals.add(original);seenEtsy.add(etsy);
    const source=originals.find(row=>String(row.product_image_id)===original),etsyRow=remoteMap.get(etsy);
    pairs.push({product_image_id:Number(original),etsy_image_id:etsy,
      original_url:source.transferable?String(source.image_url||''):null,
      etsy_image_url:safeEtsyImageUrl(etsyRow.url_fullxfull||etsyRow.url_570xN),
      alt_text:String(source.alt_text||'').slice(0,180)});
  }
  if(pairs.length!==originals.length||pairs.length!==remoteMap.size)
    issues.push('The exact approved original and remote Etsy image counts do not match confirmed receipts.');
  return {ready:issues.length===0,pairs,issues:[...new Set(issues)]};
}
