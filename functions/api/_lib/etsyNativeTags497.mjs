// Etsy Open API v3 accepts a comma-separated tag list in updateListing.
// Search keywords are Product SEO authority; never infer native Etsy state.
const allowed=/^[\p{L}\p{Nd}\p{Zs}\-'™©®]+$/u;
const fold=value=>String(value||'').normalize('NFC').trim().toLocaleLowerCase();
export function preparedEtsyTags497(raw){
 const tags=String(raw??'').split(',').map(value=>value.normalize('NFC').trim()).filter(Boolean);
 const blockers=[];
 if(tags.length===0)blockers.push('Enter at least one saved Product search tag before replacing native Etsy tags.');
 if(tags.length>13)blockers.push('Etsy supports at most 13 tags.');
 if(tags.some(tag=>Array.from(tag).length>20))blockers.push('Each Etsy tag must have at most 20 characters.');
 if(tags.some(tag=>!allowed.test(tag)))blockers.push('Etsy tags may only contain letters, digits, spaces, hyphens, apostrophes, ™, © or ®.');
 if(new Set(tags.map(fold)).size!==tags.length)blockers.push('Remove duplicate search tags.');
 return {tags,blockers,ready:blockers.length===0};
}
export function tagsMatch497(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;
 const left=a.map(fold).sort(),right=b.map(fold).sort();
 return left.every((value,i)=>value===right[i]);
}
