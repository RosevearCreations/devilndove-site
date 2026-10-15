import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import {channelOn,reviewEvidence} from '../_lib/productDistribution406.mjs';

const RELEASE = 449;
const TABLE = 'marketplace_syndication_drafts';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(TABLE).first();
  return Boolean(row?.name);
}

async function requireAdmin(context) {
  const adminUser = verifiedAdminFromModule(context);
  if (!adminUser) return { response: jsonResponse({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { response: jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  if (!(await tableExists(auth.db))) {
    return jsonResponse({ ok: true, release: RELEASE, owner: 'storefront', schema_ready: false, drafts: [], request_time_schema_mutation: false });
  }
  const result = await auth.db.prepare(`
    SELECT id, channel_key, product_id, draft_title, status, external_reference,
           last_validation_error, created_at, updated_at
    FROM marketplace_syndication_drafts
    WHERE channel_key='etsy'
    ORDER BY updated_at DESC
    LIMIT 200
  `).all();
  return jsonResponse({
    ok: true,
    release: RELEASE,
    owner: 'storefront',
    mode: 'draft-first-etsy-syndication',
    schema_ready: true,
    publication_performed: false,
    drafts: rows(result),
  });
}

export async function onRequestPost(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  if (!(await tableExists(auth.db))) {
    return jsonResponse({ ok: false, release: RELEASE, schema_ready: false, error: 'Release 449 Development schema is not ready; no draft was created.' }, 409);
  }

  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Valid JSON body required.' }, 400); }
  // Build 398 — a LOCAL staged draft, never a provider-side Etsy listing.
  if(body?.local_draft_only!==true)
   return jsonResponse({ok:false,error:'Explicit local_draft_only consent required. Remote Etsy writes are disabled.'},422);
  const productId=Number(body?.product_id),title=String(body?.title||body?.draft_title||'').trim(),
        description=String(body?.description||'').trim(),key=String(body?.request_key||'');
  if(!Number.isSafeInteger(productId)||productId<1||productId>2147483647||!title||
     title.length>140||!description||description.length>15000||!key||
     !/^[0-9a-fA-F-]{32,50}$/.test(key))
    return jsonResponse({ok:false,error:'Valid Product, title, description, request identifier and local-only consent are required.'},400);
  try{
    const product=await auth.db.prepare(
      "SELECT product_id,name,description,status,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1"
    ).bind(productId).first();
    if(!product)return jsonResponse({ok:false,error:'Original Product was not found.'},404);
    const [pref,policy,images,selection]=await Promise.all([
     auth.db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(productId)).first(),
     auth.db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')='etsy' ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(productId)).first(),
     auth.db.prepare("SELECT product_image_id,image_url,alt_text,image_role,public_use_status,width_px,height_px FROM product_images WHERE product_id=? LIMIT 60").bind(productId).all(),
     auth.db.prepare("SELECT selected_product_image_ids_json FROM marketplace_export_image_selections WHERE channel='etsy' AND product_id=? LIMIT 1").bind(productId).first()
    ]);
    if(!channelOn(pref,'etsy'))return jsonResponse({ok:false,error:'Single Product Editor Etsy destination is OFF; cannot stage new remote-channel drafts.'},409);
    let selectedIds=[];try{selectedIds=JSON.parse(selection?.selected_product_image_ids_json||'[]')}catch{}
    const gate=reviewEvidence({channel:'etsy',product,images:images?.results||[],selectedIds,preference:pref,policyReceipt:policy});
    if(!gate.ready_for_local_export)return jsonResponse({ok:false,error:'Build 406 canonical image and US-shipping review required before new Etsy staging.',blockers:gate.blockers},409);
    const cents=Number(product.price_cents), currency=String(product.currency||'').toUpperCase();
    if(currency!=='CAD'||!Number.isSafeInteger(cents)||cents<0)
      return jsonResponse({ok:false,error:'Product must have verified CAD cents before staging.'},409);
    // Check signed-off source price at the server rather than trusting client-supplied money.
    if(body.price!=null&&Math.round(Number(body.price)*100)!==cents)
      return jsonResponse({ok:false,code:'stale_product_price',error:'Product price changed; reload it before preparing a draft.'},409);
    const dedupe="SELECT id,draft_title,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' "+
      "AND product_id=? AND json_extract(payload_json,'$.request_key')=? ORDER BY created_at DESC LIMIT 1";
    const previous=await auth.db.prepare(dedupe).bind(String(productId),key).first();
    if(previous)return jsonResponse({ok:true,release:RELEASE,owner:'storefront',already_recorded:true,
      draft:{id:previous.id,product_id:String(productId),title:previous.draft_title,status:previous.status},
      publication_performed:false,provider_called:false},200);
    const id=crypto.randomUUID();
    const payload={title,description,price_cents:cents,currency:'CAD',
      quantity:Math.max(0,Number(product.inventory_quantity||0)),
      request_key:key,local_draft_only:true,remote_etsy_draft_created:false,
      tags:[],image_keys:[],product_name:String(product.name||'').slice(0,160)};
    // D1 single-statement idempotency prevents accidental duplicate submissions.
    const wrote=await auth.db.prepare(
      "INSERT INTO marketplace_syndication_drafts "+
      "(id,channel_key,product_id,draft_title,payload_json,status,publication_requested,created_by,created_at,updated_at) "+
      "SELECT ?,'etsy',?,?,?,?,0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP "+
      "WHERE NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? "+
      "AND json_extract(payload_json,'$.request_key')=?)"
    ).bind(id,String(productId),title,JSON.stringify(payload),'draft',
      String(auth.adminUser.email||'admin'),String(productId),key).run();
    const saved=await auth.db.prepare(dedupe).bind(String(productId),key).first();
    if(!saved)return jsonResponse({ok:false,error:'Draft save outcome unknown; inspect draft history before retrying.',
      retry_automatically:false},409);
    return jsonResponse({ok:true,release:RELEASE,owner:'storefront',
      mode:'draft-first-etsy-syndication',already_recorded:Number(wrote?.meta?.changes||0)===0,
      draft:{id:saved.id,channel_key:'etsy',product_id:String(productId),title:saved.draft_title,status:saved.status},
      publication_requested:false,publication_performed:false,provider_called:false,remote_etsy_draft_created:false,
      note:'Only a local Devil n Dove review draft was staged; no Etsy API call or listing upload occurred.'},201);
  }catch{
    return jsonResponse({ok:false,error:'Local draft could not be confirmed; inspect draft history before retrying.',
      retry_automatically:false},503);
  }

}
