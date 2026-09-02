// File: /functions/api/custom-request-order.js
// Public noindex token endpoint. Schema is Release 461 migration-owned.
// Release 467 Build 16: return a consolidated customer-safe journey and never expose internal production notes.
import { hasCustomRequestOrderSchema } from './_lib/customRequestCommerceSchemaReadiness.js';
import { buildCustomerJourney, customerStageMessage } from './_lib/customRequestJourney.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=200){const text=String(value||'').trim();return text.length>limit?text.slice(0,limit).trim():text;}

export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const token=clean(new URL(context.request.url).searchParams.get('token'),180);if(!token||!token.startsWith('order_'))return json({ok:false,error:'A valid order token is required.'},400);
  if(!(await hasCustomRequestOrderSchema(db)))return json({ok:false,error:'custom_request_order_schema_unavailable',message:'Order status is temporarily unavailable.'},503);

  const link=await db.prepare(`SELECT * FROM custom_request_order_status_links WHERE order_status_token=? AND COALESCE(link_status,'active') NOT IN ('void','expired') AND expired_at IS NULL AND voided_at IS NULL LIMIT 1`).bind(token).first().catch(()=>null);
  if(!link)return json({ok:false,error:'Order status link was not found or is no longer active.'},404);
  await db.prepare(`UPDATE custom_request_order_status_links SET link_status=CASE WHEN link_status='active' THEN 'viewed' ELSE link_status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_order_status_link_id=?`).bind(Number(link.custom_request_order_status_link_id||0)).run().catch(()=>null);

  // Deliberately omit orders.notes and all raw stage_notes from this customer surface.
  const order=await db.prepare(`SELECT order_id, order_number, customer_email, customer_name, order_status, payment_status, payment_method, fulfillment_type, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, created_at, updated_at FROM orders WHERE order_id=? LIMIT 1`).bind(Number(link.order_id||0)).first().catch(()=>null);
  if(!order)return json({ok:false,error:'The connected order record was not found.'},404);

  const request=await db.prepare(`SELECT request_key, request_type, product_interest, status, created_at, updated_at FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(Number(link.custom_request_id||0)).first().catch(()=>null);
  const quote=await db.prepare(`SELECT quote_key, quote_status, updated_at FROM custom_request_quote_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(link.custom_request_id||0)).first().catch(()=>null);
  const items=rows(await db.prepare(`SELECT order_item_id, sku, product_name, product_type, unit_price_cents, quantity, line_subtotal_cents, taxable, requires_shipping, created_at FROM order_items WHERE order_id=? ORDER BY order_item_id ASC`).bind(Number(order.order_id||0)).all().catch(()=>({results:[]})));
  const stageRows=rows(await db.prepare(`SELECT stage_key, stage_label, created_at FROM custom_request_order_stage_events WHERE custom_request_id=? ORDER BY datetime(created_at) ASC`).bind(Number(link.custom_request_id||0)).all().catch(()=>({results:[]})));
  const stages=stageRows.map(stage=>({stage_key:clean(stage.stage_key,80),stage_label:clean(stage.stage_label,120),created_at:stage.created_at||''}));
  const photos=rows(await db.prepare(`SELECT custom_order_stage_photo_id, custom_request_id, order_id, stage_key, image_url, image_caption, public_use_status, moderation_status, created_at FROM custom_order_stage_photos WHERE (custom_request_id=? OR order_id=?) AND COALESCE(public_use_status,'internal_review') IN ('customer_private','product_page_ok','social_ok','all_public_ok') AND COALESCE(moderation_status,'approved') IN ('approved','customer_private') ORDER BY datetime(created_at) DESC LIMIT 40`).bind(Number(link.custom_request_id||0),Number(order.order_id||0)).all().catch(()=>({results:[]})));
  const specs=rows(await db.prepare(`SELECT product_family, scent_profile, wax_or_base, colour_notes, batch_number, ingredient_notes, allergen_safety_notes, cure_ready_date FROM custom_candle_soap_product_specs WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 4`).bind(Number(link.custom_request_id||0)).all().catch(()=>({results:[]})));

  const currentStage=customerStageMessage(link.order_stage||'planning');
  const journey=buildCustomerJourney({requestStatus:request?.status||'',quoteStatus:quote?.quote_status||'',orderStage:currentStage.key,orderStatus:order.order_status||''});
  const proof_consent={status:photos.some(photo=>['product_page_ok','social_ok','all_public_ok'].includes(String(photo.public_use_status||'').toLowerCase()))?'public_photo_permission_available':'private_or_pending',public_ready_count:photos.filter(photo=>['product_page_ok','social_ok','all_public_ok'].includes(String(photo.public_use_status||'').toLowerCase())).length,private_photo_count:photos.filter(photo=>String(photo.public_use_status||'').toLowerCase()==='customer_private').length};

  return json({
    ok:true,
    order,
    request:request?{request_key:request.request_key||'',request_type:request.request_type||'',product_interest:request.product_interest||'',status:request.status||''}:null,
    items,
    stages,
    photos,
    specs,
    proof_consent,
    journey,
    customer_stage:currentStage,
    fulfillment_message:String(order.fulfillment_type||'').toLowerCase().includes('pickup')?'We will use the reviewed local pickup plan for handoff.':'Shipping remains limited to Canada and follows the reviewed order plan.',
    link:{link_status:link.link_status||'active',custom_request_id:Number(link.custom_request_id||0)||null,order_stage:currentStage.key,stage_updated_at:link.stage_updated_at||''}
  });
}
