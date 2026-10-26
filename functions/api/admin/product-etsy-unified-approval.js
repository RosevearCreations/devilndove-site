/* Build 490: owner-directed approval receipt for one Etsy draft field action.
   An approval receipt is evidence, NOT a remote publish or provider write. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:490,publication_performed:false,provider_contacted:false,...v},status,{'Cache-Control':'no-store'});
const positive=value=>/^[1-9]\d{0,14}$/.test(String(value??''))&&Number.isSafeInteger(Number(value));
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return reply({error:'Verified Admin required.'},401);
 if(!db)return reply({error:'D1 unavailable.'},503);
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return reply({error:'Same-origin required.'},403);
 let body;try{body=await c.request.json()}catch{return reply({error:'Valid JSON required.'},400)}
 const id=body?.product_id,mode=body?.mode,key=String(body?.request_key||'');
 if(!positive(id)||!['new','existing'].includes(mode)||!/^[a-f0-9-]{36}$/i.test(key)||body?.owner_authorized!==true)
  return reply({error:'Saved Product, selected draft mode, unique request and explicit owner approval required.'},400);
 try{
  const product=await db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(Number(id)).first();
  if(!product)return reply({error:'Product missing.'},404);
  const linked=await db.prepare("SELECT external_reference FROM marketplace_syndication_drafts WHERE product_id=? AND channel_key='etsy' AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(Number(id)).first();
  if(mode==='existing'&&!positive(linked?.external_reference))return reply({error:'No verified existing Etsy draft is linked; inspect and link it first.'},409);
  if(mode==='new'&&positive(linked?.external_reference))return reply({error:'This Product already links to an Etsy draft. Select UPDATE to prevent duplicates.'},409);
  const previous=await db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='etsy_unified_490_owner_authorized' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(String(id),key).first();
  if(previous)return reply({error:'This owner approval key has already been used. Inspect the draft; do not retry.'},409);
  const detail=JSON.stringify({build:490,mode,request_key:key,linked_draft_id:mode==='existing'?String(linked.external_reference):null,local_approval_only:true,dispatch_requires_existing_provider_guards:true,media_transfer_separately_authorized:true});
  const inserted=await db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (?,'etsy_unified_490_owner_authorized','product',?,'POST','/api/admin/product-etsy-unified-approval',?,CURRENT_TIMESTAMP)").bind(Number(admin.user_id)||null,String(id),detail).run();
  const receiptId=Number(inserted.meta?.last_row_id||0);if(!receiptId)return reply({error:'Owner approval receipt not confirmed; no dispatch permitted.'},503);
  return reply({receipt_id:receiptId,mode,product_id:Number(id),linked_draft_id:mode==='existing'?String(linked.external_reference):null,dispatch_authorized:true,remote_dispatch_performed:false});
 }catch{return reply({error:'Owner approval could not be recorded. No Etsy action is authorized.'},503)}
}
