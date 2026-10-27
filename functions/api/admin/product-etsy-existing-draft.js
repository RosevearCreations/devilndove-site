/* Build 486: manually reconcile an existing Etsy draft and explicitly update saved fields only. */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {connectionBlockers,WHO_MADE,WHEN_MADE} from '../_lib/etsyDraftTrial399.mjs';
import {canadaOnlyShippingProfile,productDraftDetails} from '../_lib/etsyProductDraft438.mjs';
const respond=(v,status=200)=>jsonResponse({ok:status<400,build:486,publication_performed:false,shipping_modified:false,automatic_retry:false,...v},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const requestKey=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
const parse=row=>{try{return JSON.parse(row?.payload_json||'{}')}catch{return {}}};
const base='https://api.etsy.com/v3/application/';
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:respond({error:'Verified Admin required.'},401)}:!db?{error:respond({error:'D1 unavailable.'},503)}:{admin,db};}
async function local(db,id){const [product,draft,conn,shop]=await Promise.all([
 db.prepare('SELECT product_id,name,sku,slug,description,short_description,price_cents,currency,inventory_quantity,product_type FROM products WHERE product_id=?').bind(id).first(),
 db.prepare("SELECT id,external_reference,payload_json,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(id).first(),
 // The authorization guard compares the OAuth account with the verified Etsy shop owner.
 // Always select remote_subject_id; omitting it falsely reports shop_owner_mismatch.
 db.prepare("SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1").first(),
 db.prepare("SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1").first()]);return {product,draft,conn,shop};}
// Build 503: the Product Editor asks for its saved Etsy ID frequently.
// This read-only receipt must not load/decrypt OAuth identity or shipping on
// every tab/refresh; remote ownership is verified only on an explicit POST.
async function localLinkOnly(db,id){const [product,draft]=await Promise.all([
 db.prepare('SELECT product_id,name,sku,slug FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
 db.prepare("SELECT id,external_reference,payload_json,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(id).first()
 ]);return {product,draft};}
// Build 504: differentiate a replay of THIS Product's verified receipt from
// another Product that already owns the Etsy ID. Never silently move claims.
export async function claimedListing505(db,listingId){
 return db.prepare("SELECT d.id,d.product_id,d.payload_json,p.name AS product_name,p.sku AS product_sku,p.slug AS product_slug FROM marketplace_syndication_drafts d LEFT JOIN products p ON CAST(p.product_id AS TEXT)=CAST(d.product_id AS TEXT) WHERE d.channel_key='etsy' AND d.external_reference=? ORDER BY d.updated_at DESC LIMIT 1").bind(listingId).first();
}
export function ownerClaim504(claim,productId){
 if(!claim)return {state:'unclaimed',product:null};
 const product={product_id:Number(claim.product_id),name:String(claim.product_name||''),sku:String(claim.product_sku||''),slug:String(claim.product_slug||'')};
 return {state:String(claim.product_id)===String(productId)?'same_product':'another_product',product};
}
async function credentials(env,s){const blockers=connectionBlockers(s.conn,s.shop,env);let scopes=[];try{scopes=JSON.parse(s.conn?.scopes_json||'[]')}catch{}
 if(!scopes.includes('listings_r')||!scopes.includes('listings_w'))blockers.push('etsy_listing_scopes_missing');
 if(blockers.length)throw Error('Etsy shop authorization or scopes unavailable: '+blockers.join(', '));
 const token=await decryptOAuthSecret(env,s.conn.access_token_ciphertext,'oauth-token|etsy|access');if(!token)throw Error('Etsy access token unavailable.');
 return {'Accept':'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),'Authorization':'Bearer '+token};}
async function etsy(path,headers){const r=await fetch(base+path,{headers,redirect:'manual',signal:AbortSignal.timeout(12000)});if(!r.ok||r.status>=300)throw Error('Etsy read failed: HTTP '+r.status);return r.json();}
async function verify(env,s,id,headers){const listing=await etsy('listings/'+encodeURIComponent(String(id)),headers);
 if(String(listing.listing_id||'')!==String(id)||String(listing.shop_id||'')!==String(s.shop.shop_id)||String(listing.state||'').toLowerCase()!=='draft')throw Error('Listing is not an unpublished draft belonging to our authorized Etsy shop.');
 if(!valid(listing.shipping_profile_id))throw Error('Draft has no verifiable Etsy shipping profile.');
 const root='shops/'+encodeURIComponent(String(s.shop.shop_id))+'/shipping-profiles/'+encodeURIComponent(String(listing.shipping_profile_id));
 const [profile,destinations]=await Promise.all([etsy(root,headers),etsy(root+'/destinations?limit=100',headers)]);
 const review=canadaOnlyShippingProfile(profile,destinations,Number(listing.shipping_profile_id));
 if(!review.allowed)throw Error('Etsy draft shipping profile is not proven Canada-only. '+String(review.reason||''));
 return listing;}
// Build 497 shares the same verified unpublished/Canada-only guard with native
// tag updates, rather than introducing a weaker second Etsy identity check.
export {local as readExistingDraftLocal486,credentials as existingDraftCredentials486,
  verify as verifyExistingDraft486,etsy as readEtsy486};
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;const url=new URL(c.request.url),id=url.searchParams.get('product_id');if(!valid(id))return respond({error:'Saved Product required.'},400);
 try{const s=await localLinkOnly(g.db,Number(id));if(!s.product)return respond({error:'Product not found.'},404);
 const candidate=url.searchParams.get('candidate_listing_id');
 const claim=valid(candidate)?ownerClaim504(await claimedListing505(g.db,String(candidate)),id):null;
 return respond({product_id:Number(id),product_name:String(s.product.name||''),product_sku:String(s.product.sku||''),product_slug:String(s.product.slug||''),linked_listing_id:valid(s.draft?.external_reference)?String(s.draft.external_reference):null,linked_source:parse(s.draft).verified_remote_existing_draft?'verified_existing_etsy_draft':s.draft?'product_editor_or_legacy_receipt':'unlinked',candidate_claim:claim,requires_explicit_review:true});
 }catch{return respond({error:'Existing draft status unavailable.'},503)}}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin required.'},403);
 let b;try{b=await c.request.json()}catch{return respond({error:'JSON required.'},400)}
 const id=Number(b?.product_id),action=String(b?.action||'');
 if(!valid(id)||!requestKey(b?.request_key)||!['inspect_listing','link_existing','update_saved_fields'].includes(action)||b?.confirm_unpublished_only!==true||b?.confirm_canada_only!==true)return respond({error:'Choose a saved Product, explicit draft-only Canada consent and a unique request key.'},400);
 try{
  const s=await local(g.db,id);if(!s.product)return respond({error:'Product not found.'},404);
  const headers=await credentials(c.env,s);
  if(action==='inspect_listing'||action==='link_existing'){
   const listingId=String(b.listing_id||'');if(!valid(listingId)||b?.confirm_exact_etsy_listing!==true)return respond({error:'Enter the exact Etsy listing ID and confirm you checked it in Etsy Drafts.'},400);
   if(action==='link_existing'&&s.draft?.external_reference&&String(s.draft.external_reference)!==listingId)return respond({error:`Product #${id} is linked to a DIFFERENT Etsy draft #${s.draft.external_reference}. Stop and review its original receipt; no duplicate was created.`,linked_listing_id:String(s.draft.external_reference)},409);
   const remote=await verify(c.env,s,listingId,headers);
   const titleMatches=String(remote.title||'').trim().toLocaleLowerCase()===String(s.product.name||'').trim().toLocaleLowerCase();
   if(action==='inspect_listing')return respond({listing_id:listingId,etsy_title:String(remote.title||'').slice(0,140),product_title:String(s.product.name||'').slice(0,140),title_matches:titleMatches,verified_unpublished:true,verified_canada_only:true,provider_modified:false});
   if(!titleMatches&&b?.confirm_prior_title_difference!==true)return respond({error:'Etsy title differs from saved Product. Inspect the draft preview and explicitly confirm the older title is the same item before linking.'},409);
   const collision=await claimedListing505(g.db,listingId),claim=ownerClaim504(collision,id);
   if(claim.state==='another_product')return respond({error:`Etsy draft #${listingId} is already recorded against LOCAL Product #${claim.product.product_id} (${claim.product.name||claim.product.sku||'unnamed Product'}). Open that Product and confirm which record is the real owner. Product #${id} was not linked or changed.`,code:'etsy_listing_claimed_by_another_product',linked_product_id:claim.product.product_id,conflicting_product:claim.product},409);
   const payload={...parse(collision),verified_remote_existing_draft:true,remote_etsy_draft_created:false,publication_performed:false,canada_only_shipping_verified:true,shipping_profile_id:remote.shipping_profile_id,request_key:b.request_key,verified_listing_id:listingId};
   if(claim.state==='same_product'){
    const updated=await g.db.prepare("UPDATE marketplace_syndication_drafts SET payload_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND channel_key='etsy' AND product_id=? AND external_reference=?")
      .bind(JSON.stringify(payload),collision.id,String(id),listingId).run();
    if(Number(updated.meta?.changes)!==1)return respond({error:'Saved Etsy receipt could not be reverified. Refresh the same Product before trying again.',code:'etsy_receipt_recheck_unconfirmed'},409);
    await auditAdminAction(c.env,c.request,g.admin,{action_type:'etsy_existing_draft_504_same_product_receipt_verified',target_type:'product',target_key:String(id),details:{listing_id:listingId,shop_id:s.shop.shop_id,publication_performed:false}});
    return respond({linked:true,listing_id:listingId,reused_existing_receipt:true,message:'Etsy draft already belonged to this exact Product. Its unpublished Canada-only receipt was verified; no duplicate was created.'});
   }
   // Build 499: a local Etsy PREPARATION row (id='etsy:<product>',
   // external_reference NULL) must never block the verified real-draft link.
   // Only a different actual Etsy listing receipt is a collision.
   const result=await g.db.prepare("INSERT INTO marketplace_syndication_drafts(id,channel_key,product_id,draft_title,payload_json,status,external_reference,publication_requested,created_by,created_at,updated_at) SELECT ?,'etsy',?,?,?,?,?,0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference IS NOT NULL AND (product_id=? OR external_reference=?))")
    .bind(crypto.randomUUID(),id,String(s.product.name),JSON.stringify(payload),'needs_review',listingId,String(g.admin.email||'admin'),id,listingId).run();
   if(Number(result.meta?.changes)!==1)return respond({error:'Existing draft link already claimed. Reload before continuing.'},409);
   await auditAdminAction(c.env,c.request,g.admin,{action_type:'etsy_existing_draft_486_link_verified',target_type:'product',target_key:String(id),details:{build:486,listing_id:listingId,shop_id:s.shop.shop_id,publication_performed:false}});
   return respond({linked:true,listing_id:listingId,message:'Existing unpublished Canada-only Etsy draft verified and linked. No listing created or changed.'});
  }
  if(!s.draft||!valid(s.draft.external_reference)||parse(s.draft).canada_only_shipping_verified!==true)return respond({error:'First link and verify the exact unpublished Canada-only Etsy draft.'},409);
  if(b?.confirm_saved_product_fields!==true)return respond({error:'Confirm the saved Product title, description, CAD price and quantity are correct.'},400);
  const details=productDraftDetails(s.product);if(details.blockers?.length||String(s.product.currency).toUpperCase()!=='CAD')return respond({error:'Saved Product fields must pass Etsy preflight before update.',blockers:details.blockers},409);
  const listingId=String(s.draft.external_reference),remote=await verify(c.env,s,listingId,headers);
  if(!WHO_MADE.includes(remote.who_made)||!WHEN_MADE.includes(remote.when_made)||!valid(remote.taxonomy_id)||typeof remote.is_supply!=='boolean')return respond({error:'Existing Etsy maker, era, taxonomy or supply classification cannot be verified. Update those fields manually in Etsy first.'},409);
  const holds=await g.db.prepare("SELECT (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_claimed' AND target_type='product' AND target_key=?) claimed,(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_confirmed' AND target_type='product' AND target_key=?) confirmed").bind(String(id),String(id)).first();
  if(Number(holds.claimed)!==Number(holds.confirmed))return respond({error:'Previous Etsy update outcome unresolved. Inspect Etsy and reconcile manually; no automatic retry.'},409);
  const priorKey=await g.db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(String(id),b.request_key).first();
  if(priorKey)return respond({error:'This update request has already been attempted. Check Etsy; never retry an existing request key.'},409);
  const detail={build:486,product_id:id,listing_id:listingId,request_key:b.request_key,changes:['title','description','price','quantity'],publication_performed:false};
  const claim=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_existing_draft_486_update_claimed','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_claimed' AND target_type='product' AND target_key=?)=(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_confirmed' AND target_type='product' AND target_key=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_existing_draft_486_update_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?) AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?)")
   .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(detail),String(id),String(id),String(id),b.request_key,id,listingId).run();
  if(Number(claim.meta?.changes)!==1)return respond({error:'Existing update already claimed. Inspect Etsy before another action.'},409);
  const form=new URLSearchParams({title:details.title,description:details.description,price:(details.price_cents/100).toFixed(2),quantity:String(details.quantity),who_made:remote.who_made,when_made:remote.when_made,taxonomy_id:String(remote.taxonomy_id),is_supply:String(remote.is_supply)});
  let provider,updated;try{provider=await fetch(base+'shops/'+encodeURIComponent(String(s.shop.shop_id))+'/listings/'+encodeURIComponent(listingId),{method:'PATCH',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:form,redirect:'manual',signal:AbortSignal.timeout(15000)});updated=await provider.json().catch(()=>null)}catch{return respond({error:'Etsy update result unknown. Inspect the original draft; do not retry.'},502)}
  if(!provider.ok||String(updated?.listing_id||'')!==listingId||String(updated?.shop_id||'')!==String(s.shop.shop_id)||String(updated?.state||'').toLowerCase()!=='draft')return respond({error:'Etsy did not confirm draft-only update; manual reconciliation required.',provider_http_status:provider.status},409);
  await auditAdminAction(c.env,c.request,g.admin,{action_type:'etsy_existing_draft_486_update_confirmed',target_type:'product',target_key:String(id),details:{...detail,confirmed_draft:true}});
  return respond({updated:true,listing_id:listingId,updated_fields:detail.changes,still_unpublished:true,message:'Etsy confirmed saved Product field updates on the existing unpublished draft.'});
 }catch(e){return respond({error:'Existing Etsy draft reconciliation held: '+String(e?.message||'verification unavailable').slice(0,190)},409)}
}
