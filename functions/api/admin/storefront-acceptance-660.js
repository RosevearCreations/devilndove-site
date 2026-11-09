/** Build 660: verified Admin read-only original storefront/order/payment/refund
 * acceptance inspector. Actual devices, carrier and provider proof remain HOLD. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decodeOwnerRecord} from '../_lib/moduleAcceptance656.mjs';
const IDS=['customer.desktop.browse','customer.tablet.browse','customer.mobile.browse',
 'customer.desktop.checkout','customer.tablet.checkout','customer.mobile.checkout',
 'storefront.purchase','shipping.fulfillment'];
const respond=(v,status=200)=>jsonResponse({release:467,build:660,read_only:true,...v},status,
 {'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const rows=v=>Array.isArray(v?.results)?v.results:[];
const pick=(row,keys)=>Object.fromEntries(keys.split(' ').map(k=>[k,row[k]]));
const fields={items:'order_item_id product_id product_name product_type unit_price_cents quantity line_subtotal_cents requires_shipping',
 payments:'payment_id provider payment_status amount_cents currency paid_at updated_at',
 refunds:'refund_id payment_id provider amount_cents currency refund_status provider_sync_status created_at updated_at'};
const positive=v=>/^[1-9]\d{0,9}$/.test(String(v??''))?Number(v):0;
const ca=v=>['ca','can','canada'].includes(String(v??'').trim().toLowerCase());
async function hash(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function ownerEvidence(db,id){const row=await db.prepare(`SELECT setting_value,is_public FROM app_settings
 WHERE setting_key=? LIMIT 1`).bind('site.admin.module_acceptance.v656.'+id).first();
 const doc=decodeOwnerRecord(row),latest=new Map();
 for(const r of doc.receipts){if(IDS.includes(r.requirement_id)&&!latest.has(r.requirement_id))
  latest.set(r.requirement_id,r);}
 return {version:doc.version,checkpoints:IDS.map(id=>{const r=latest.get(id);
  return {id,decision:r?.decision||'unreviewed',recorded_at:r?.recorded_at||null,
   observed_at:r?.observed_at||null,device_description:r?.device_description||null,
   evidence_reference:r?.evidence_reference||null,independently_verified:false};}),
  owner_only:true,approved_module_percent:null};}
async function original(db,id){const raw=await db.prepare(`SELECT order_id,order_number,order_status,
  payment_status,payment_method,fulfillment_type,currency,subtotal_cents,discount_cents,
  shipping_cents,tax_cents,total_cents,shipping_country,billing_country,created_at,updated_at
  FROM orders WHERE order_id=? LIMIT 1`).bind(id).first();
 if(!raw)return null;
 const order=pick(raw,'order_id order_number order_status payment_status payment_method fulfillment_type currency subtotal_cents discount_cents shipping_cents tax_cents total_cents shipping_country billing_country created_at updated_at');
 const parts=[['items','order_items',`SELECT order_item_id,product_id,product_name,product_type,
   unit_price_cents,quantity,line_subtotal_cents,requires_shipping FROM order_items
   WHERE order_id=? ORDER BY order_item_id LIMIT 20`],
  ['payments','payments',`SELECT payment_id,provider,payment_status,amount_cents,
   currency,paid_at,updated_at FROM payments WHERE order_id=?
   ORDER BY payment_id DESC LIMIT 20`],
  ['refunds','payment_refunds',`SELECT refund_id,payment_id,provider,amount_cents,currency,
   refund_status,provider_sync_status,created_at,updated_at FROM payment_refunds
   WHERE order_id=? ORDER BY refund_id DESC LIMIT 20`]];
 const detail={};const totals={};
 for(const [label,table,sql] of parts){detail[label]=rows(await db.prepare(sql).bind(id).all()).map(r=>pick(r,fields[label]));
  const total=await db.prepare('SELECT COUNT(*) AS total FROM '+table+' WHERE order_id=?').bind(id).first();
  totals[label]=Number(total?.total||0);}
 const facts={order,...detail,totals},truncated=Object.values(totals).some(v=>v>20);
 const shipping=String(order.fulfillment_type||'').toLowerCase()==='shipping';
 const hold=[...(order.currency!=='CAD'?['ORDER_CURRENCY_NOT_CAD']:[]),
  ...(!ca(order.billing_country)?['BILLING_COUNTRY_NOT_VERIFIED_CA']:[]),
  ...(shipping&&!ca(order.shipping_country)?['SHIPPING_COUNTRY_NOT_CA']:[]),
  ...(truncated?['ORDER_EVIDENCE_TRUNCATED']:[]),
  ...(!detail.payments.some(p=>['paid','completed','captured'].includes(String(p.payment_status).toLowerCase()))?
   ['NO_SAVED_PAID_PAYMENT_IN_SCOPE']:[]),
  ...(detail.refunds.some(r=>['failed','pending','submitted','requested'].includes(String(r.refund_status).toLowerCase())||
   ['failed','pending'].includes(String(r.provider_sync_status).toLowerCase()))?['REFUND_FOLLOWUP_REQUIRED']:[])];
 return {facts,source_revision:await hash(facts),truncated,hold,
  shipping_policy:'CA-only for shipped physical orders; CAD storefront; server validation owned by original Checkout',
  original_route_owners:['/shop/','/cart/','/checkout/','/terms/','/admin/orders/'],
  source_verified_only:true,provider_settlement_independently_verified:false,
  carrier_acceptance_independently_verified:false,return_request_intake_independently_verified:false,
  customer_device_acceptance_independently_verified:false,master_completion_percent:null};}
export async function onRequestGet(ctx){const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return respond({ok:false,error:'Active Storefront Admin grant required.'},401);
 if(!db)return respond({ok:false,error:'Canonical commerce database unavailable.'},503);
 const value=new URL(ctx.request.url).searchParams.get('order_id');
 if(value!==null&&!positive(value))return respond({ok:false,error:'Use one original positive Order ID.'},400);
 try{const owner=await ownerEvidence(db,admin.user_id);
  if(value===null)return respond({ok:true,owner,original_order:null,
    source_records_inspected:false,independent_acceptance:false});
  const inspected=await original(db,positive(value));
  return inspected?respond({ok:true,owner,original_order:inspected,
   source_records_inspected:true,independent_acceptance:false,
   no_checkout_order_created:true,no_payment_or_refund_executed:true}):
   respond({ok:false,error:'Original Order not found.'},404);
 }catch{return respond({ok:false,error:'Original commerce or private owner evidence unavailable. Acceptance HOLD.'},503);}}
