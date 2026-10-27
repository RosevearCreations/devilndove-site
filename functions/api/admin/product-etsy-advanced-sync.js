/* Build 499 — deliberate metadata-only sync to an existing verified Etsy draft.
 * Explicit read/owner approval; irreversible uncertainty holds; no photos,
 * shipping, inventory, publication or auto-retry actions. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486} from './product-etsy-existing-draft.js';
import {readOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
import {tagsMatch497} from '../_lib/etsyNativeTags497.mjs';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:499,publication_performed:false,
 shipping_modified:false,images_modified:false,automatic_retry:false,...data},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const uuid=x=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(String(x||''));
const clean=x=>String(x??'').trim();
const parse=x=>{try{const v=JSON.parse(x||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const similar=(a,b)=>clean(a).normalize('NFC')===clean(b).normalize('NFC');
const arraysMatch=(a,b)=>JSON.stringify([...a].map(clean).sort())===JSON.stringify([...b].map(clean).sort());
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:respond({error:'Verified administrator required.'},401)}:
 !db?{error:respond({error:'D1 unavailable.'},503)}:{admin,db};}
async function fingerprint(value){const raw=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',raw);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function prepare(c,g,id){
 const s=await readExistingDraftLocal486(g.db,id);
 if(!s.product)return {error:'Saved Product not found.'};
 if(!valid(s.draft?.external_reference))return {error:'No Etsy draft is linked. Product #53 has an existing Etsy draft #4603838854: verify and link that exact draft below first. Never create a duplicate.'};
 const listingId=String(s.draft.external_reference),headers=await existingDraftCredentials486(c.env,s);
 const remote=await verifyExistingDraft486(c.env,s,listingId,headers);
 if(!Array.isArray(remote.tags)||!Array.isArray(remote.materials))return {error:'Etsy native tags or materials are unavailable for reliable comparison.'};
 const [seo,profile,override]=await Promise.all([
  g.db.prepare('SELECT keywords FROM product_seo WHERE product_id=? LIMIT 1').bind(id).first(),
  g.db.prepare("SELECT title_override,description_override,materials_json,who_made,when_made,taxonomy_id FROM marketplace_listing_profiles WHERE channel_key='etsy' AND product_id=? LIMIT 1").bind(id).first(),
  readOverride499(g.db,id,'etsy')]);
 const prepared=effectiveEtsyTags499(seo?.keywords,override),tags=prepared.tags;
 const title=clean(profile?.title_override)||clean(s.product.name),description=clean(profile?.description_override)||clean(s.product.description)||clean(s.product.short_description);
 const materials=parse(profile?.materials_json).map(clean).filter(Boolean);
 const blockers=[...prepared.blockers];
 if(!title||title.length>140||/[^\p{L}\p{Nd}\p{P}\p{Sm}\p{Zs}™©®]/u.test(title))blockers.push('Etsy title must be 1–140 supported characters.');
 if(['%',':','&','+'].some(char=>title.split(char).length>2))blockers.push('Etsy title permits each of %, :, & and + only once.');
 if(!description||description.length>12000)blockers.push('Etsy description must be 1–12000 characters.');
 if(materials.length>13||materials.some(value=>value.length>45))blockers.push('Etsy materials must be at most 13 entries of 45 characters each.');
 const maker=clean(profile?.who_made),when=clean(profile?.when_made),taxonomy=clean(profile?.taxonomy_id);
 const safeMaker=['i_did','someone_else','collective'].includes(maker)?maker:null;
 const safeWhen=['made_to_order','2020_2026','2010_2019','2007_2009','before_2007','2000_2006','1990s','1980s','1970s','1960s','1950s','1940s','1930s','1920s','1910s','1900s','1800s','1700s','before_1700'].includes(when)?when:null;
 const safeTaxonomy=valid(taxonomy)?Number(taxonomy):null;
 if(maker&&!safeMaker)blockers.push('Maker classification not recognized.');
 if(when&&!safeWhen)blockers.push('Made-when classification not recognized.');
 if(taxonomy&&!safeTaxonomy)blockers.push('Etsy category must be a verified numeric taxonomy ID.');
 const desired={title,description,tags,materials,...(safeMaker?{who_made:safeMaker}:{}),...(safeWhen?{when_made:safeWhen}:{}),...(safeTaxonomy?{taxonomy_id:safeTaxonomy}:{})};
 const differences={title:!similar(title,remote.title),description:!similar(description,remote.description),
  tags:!tagsMatch497(tags,remote.tags),materials:materials.length>0&&!arraysMatch(materials,remote.materials),
  ...(safeMaker?{who_made:!similar(safeMaker,remote.who_made)}:{}),
  ...(safeWhen?{when_made:!similar(safeWhen,remote.when_made)}:{}),
  ...(safeTaxonomy?{taxonomy_id:Number(remote.taxonomy_id)!==safeTaxonomy}:{})};
 const changed=Object.keys(differences).filter(key=>differences[key]);
 if(changed.some(key=>key==='who_made'||key==='when_made')&&
   (typeof remote.is_supply!=='boolean'||!['i_did','someone_else','collective'].includes(String(desired.who_made||remote.who_made))||
    !safeWhen&& !['made_to_order','2020_2026','2010_2019','2007_2009','before_2007','2000_2006','1990s','1980s','1970s','1960s','1950s','1940s','1930s','1920s','1910s','1900s','1800s','1700s','before_1700'].includes(String(remote.when_made))))
  blockers.push('Etsy maker or era update requires verified existing maker, era and supply classification.');
 const photoNotice='Product photos require their separate, explicit owner-approved transfer and live photo readback.';
 const proof=await fingerprint({id,listingId,desired,remote:{title:remote.title,description:remote.description,tags:remote.tags,
  materials:remote.materials,who_made:remote.who_made,when_made:remote.when_made,taxonomy_id:remote.taxonomy_id},changed});
 const holds=await g.db.prepare("SELECT (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_advanced_499_claimed' AND target_type='product' AND target_key=?) claimed,(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_advanced_499_confirmed' AND target_type='product' AND target_key=?) confirmed").bind(String(id),String(id)).first();
 const previousUncertain=Number(holds?.claimed)!==Number(holds?.confirmed);
 return {s,headers,remote,listingId,desired,changed,blockers,proof,previousUncertain,tag_source:prepared.source,photoNotice};
}
function preview(info,id){return {product_id:id,listing_id:info.listingId,verified_unpublished:true,verified_canada_only:true,
 expected_source:'saved_Product_and_Etsy_advanced_profile',tag_source:info.tag_source,review_fingerprint:info.proof,
 changed_fields:info.changed,blockers:info.blockers,ready:!info.blockers.length&&!info.previousUncertain,
 unresolved_attempt:info.previousUncertain,desired:info.desired,
 remote_fields:{title:info.remote.title,description:info.remote.description,tags:info.remote.tags,
  materials:info.remote.materials,who_made:info.remote.who_made,when_made:info.remote.when_made,taxonomy_id:info.remote.taxonomy_id},
 photo_notice:info.photoNotice};}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 const id=Number(new URL(c.request.url).searchParams.get('product_id'));if(!valid(id))return respond({error:'Saved Product ID required.'},400);
 try{const info=await prepare(c,g,id);return info.error?respond({error:info.error},409):respond(preview(info,id));}
 catch(error){return respond({error:'Etsy advanced comparison held: '+String(error?.message||'unknown').slice(0,180)},409)}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin required.'},403);
 let body;try{body=await c.request.json()}catch{return respond({error:'JSON required.'},400)}
 const id=Number(body?.product_id);if(body?.action!=='sync_metadata_once'||!valid(id)||!valid(body?.listing_id)||!uuid(body?.request_key)||
  body?.confirm_reviewed_changes!==true||body?.confirm_unpublished_only!==true||body?.confirm_canada_only!==true||
  body?.confirm_no_photo_or_shipping_change!==true||!/^[a-f\d]{64}$/.test(String(body?.review_fingerprint||'')))
  return respond({error:'Exact draft, recent comparison and explicit owner consent are required.'},400);
 try{const info=await prepare(c,g,id);
  if(info.error)return respond({error:info.error},409);
  if(info.listingId!==String(body.listing_id)||info.proof!==body.review_fingerprint)return respond({error:'Saved fields or live Etsy draft changed since review. Compare again; nothing sent.'},409);
  if(info.previousUncertain)return respond({error:'A previous advanced metadata attempt has no confirmed receipt. Inspect Etsy; no automatic retry.'},409);
  if(info.blockers.length)return respond({error:'Advanced metadata is not valid for Etsy.',blockers:info.blockers},409);
  if(!info.changed.length)return respond({...preview(info,id),already_matches:true,provider_modified:false});
  const old=await g.db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='etsy_advanced_499_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(String(id),body.request_key).first();
  if(old)return respond({error:'Request key was already used. Inspect Etsy before any further operation.'},409);
  const receipt={build:499,product_id:id,listing_id:info.listingId,request_key:body.request_key,
   changed_fields:info.changed,review_fingerprint:info.proof,tag_source:info.tag_source,
   publication_performed:false,images_modified:false,shipping_modified:false};
  const claim=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_advanced_499_claimed','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_advanced_499_claimed' AND target_type='product' AND target_key=?)=(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_advanced_499_confirmed' AND target_type='product' AND target_key=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_advanced_499_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?) AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?)")
   .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(receipt),String(id),String(id),String(id),body.request_key,id,info.listingId).run();
  if(Number(claim.meta?.changes)!==1)return respond({error:'Concurrent Etsy sync claimed. Compare Etsy; no duplicate attempt.'},409);
  const form=new URLSearchParams();
  for(const key of info.changed)form.set(key,Array.isArray(info.desired[key])?info.desired[key].join(','):String(info.desired[key]));
  if(info.changed.includes('who_made')||info.changed.includes('when_made')){
   form.set('who_made',String(info.desired.who_made||info.remote.who_made));
   form.set('when_made',String(info.desired.when_made||info.remote.when_made));
   form.set('is_supply',String(info.remote.is_supply));
  }
  let response,remote;
  try{response=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(String(info.s.shop.shop_id))+'/listings/'+encodeURIComponent(info.listingId),
   {method:'PATCH',headers:{...info.headers,'Content-Type':'application/x-www-form-urlencoded'},body:form,redirect:'manual',signal:AbortSignal.timeout(15000)});
   remote=await response.json().catch(()=>null);}catch{return respond({error:'Etsy update outcome unknown. Inspect the existing draft; never automatically retry.'},502)}
  if(!response.ok||String(remote?.listing_id)!==info.listingId||String(remote?.shop_id)!==String(info.s.shop.shop_id)||String(remote?.state).toLowerCase()!=='draft')
   return respond({error:'Etsy did not confirm an unpublished advanced update. Inspect provider state before any action.',provider_http_status:response.status},409);
  let checked;try{checked=await verifyExistingDraft486(c.env,info.s,info.listingId,info.headers)}catch{return respond({error:'Etsy accepted the change but its live readback could not be verified. Hold for manual review.'},502)}
  const accurate=info.changed.every(key=>key==='tags'?tagsMatch497(info.desired.tags,checked.tags):
   key==='materials'?arraysMatch(info.desired.materials,Array.isArray(checked.materials)?checked.materials:[]):
   key==='taxonomy_id'?Number(info.desired.taxonomy_id)===Number(checked.taxonomy_id):similar(info.desired[key],checked[key]));
  if(!accurate)return respond({error:'Fresh Etsy draft readback differs from advanced metadata. Manual reconciliation required.'},409);
  const result=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (?,'etsy_advanced_499_confirmed','product',?,'POST',?,?,CURRENT_TIMESTAMP)")
   .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify({...receipt,verified_remote_readback:true})).run();
  if(Number(result.meta?.changes)!==1)return respond({error:'Etsy matched but local confirmation receipt failed. Reconcile before another attempt.'},503);
  return respond({listing_id:info.listingId,verified_advanced_metadata:true,changed_fields:info.changed,
   still_unpublished:true,provider_modified:true,photo_notice:info.photoNotice});
 }catch(error){return respond({error:'Advanced Etsy update held: '+String(error?.message||'unknown').slice(0,190)},409)}
}
