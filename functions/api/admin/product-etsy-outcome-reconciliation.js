/* Build 491: read-only, bounded Etsy draft field/photo outcome ledger. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const respond=(body,status=200)=>jsonResponse({ok:status<400,build:491,provider_contacted:false,publication_performed:false,...body},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
function parsed(row){try{return JSON.parse(row?.details_json||'{}')}catch{return {}}}
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);if(!admin)return respond({error:'Verified Admin required.'},401);
 if(!db)return respond({error:'D1 unavailable.'},503);
 const id=new URL(c.request.url).searchParams.get('product_id');if(!valid(id))return respond({error:'Saved Product ID required.'},400);
 try{
  const [product,draft,rows]=await Promise.all([
   db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(Number(id)).first(),
   db.prepare("SELECT external_reference,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(Number(id)).first(),
   db.prepare("SELECT admin_action_audit_id,action_type,target_key,details_json,created_at FROM admin_action_audit WHERE (target_key=? OR target_key LIKE ?) AND target_type='product' AND action_type IN ('etsy_unified_490_owner_authorized','etsy_product_editor_draft_claimed','etsy_product_editor_draft_created','etsy_existing_draft_486_update_claimed','etsy_existing_draft_486_update_confirmed','etsy_product_editor_image_443_claimed','etsy_product_editor_image_443_accepted') ORDER BY admin_action_audit_id DESC LIMIT 60")
    .bind(String(id),`${id}:%`).all()
  ]);
  if(!product)return respond({error:'Product not found.'},404);
  const events=rows?.results||[];const latest=type=>events.find(e=>e.action_type===type);
  const approval=latest('etsy_unified_490_owner_authorized');
  const updateClaim=latest('etsy_existing_draft_486_update_claimed'),updateOk=latest('etsy_existing_draft_486_update_confirmed');
  const createClaim=latest('etsy_product_editor_draft_claimed'),createOk=latest('etsy_product_editor_draft_created');
  const claimedAt=e=>Number(e?.admin_action_audit_id||0),updateConfirmed=claimedAt(updateOk)>=claimedAt(updateClaim)&&!!updateClaim;
  const createConfirmed=claimedAt(createOk)>=claimedAt(createClaim)&&!!createClaim;
  let field_state='not_attempted',field_receipt_id=null;
  if(updateClaim||createClaim){const currentUpdate=claimedAt(updateClaim)>claimedAt(createClaim);
   field_state=currentUpdate?(updateConfirmed?'confirmed':'uncertain_hold'):(createConfirmed?'confirmed':'uncertain_hold');
   field_receipt_id=claimedAt(currentUpdate?(updateConfirmed?updateOk:updateClaim):(createConfirmed?createOk:createClaim));}
  const claims=new Map(),accepted=new Map();
  for(const event of [...events].reverse()){
   if(event.action_type==='etsy_product_editor_image_443_claimed'){
    const imageId=Number(String(event.target_key).split(':')[1]);if(valid(imageId))claims.set(imageId,event);}
   if(event.action_type==='etsy_product_editor_image_443_accepted'){
    const d=parsed(event),imageId=Number(d.product_image_id);if(valid(imageId))accepted.set(imageId,event);}
  }
  const ids=[...new Set([...claims.keys(),...accepted.keys()])].sort((a,b)=>a-b).slice(0,30);
  const images=ids.map(imageId=>{const claim=claims.get(imageId),ok=accepted.get(imageId),confirmed=!!claim&&claimedAt(ok)>claimedAt(claim);
   return {product_image_id:imageId,state:confirmed?'confirmed':'uncertain_hold',claim_receipt_id:claimedAt(claim)||null,confirmation_receipt_id:confirmed?claimedAt(ok):null};});
  const uncertain=field_state==='uncertain_hold'||images.some(i=>i.state==='uncertain_hold');
  return respond({product_id:Number(id),linked_listing_id:valid(draft?.external_reference)?String(draft.external_reference):null,
   approval:approval?{receipt_id:claimedAt(approval),mode:parsed(approval).mode||'unknown',created_at:approval.created_at}:null,
   fields:{state:field_state,receipt_id:field_receipt_id,kind:!updateClaim&&!createClaim?'none':claimedAt(updateClaim)>claimedAt(createClaim)?'existing_update':'new_draft'},
   images,counts:{confirmed:images.filter(i=>i.state==='confirmed').length,uncertain:images.filter(i=>i.state==='uncertain_hold').length},
   hold:uncertain,media_source_scoring_separate:true,
   note:'This is a bounded local audit replay, not a new Etsy verification. Current listing state and remote photos require separate owner-initiated live reads.'});
 }catch{return respond({error:'Local Etsy outcome ledger unavailable. Do not treat unverified transfers as complete.'},503)}
}
