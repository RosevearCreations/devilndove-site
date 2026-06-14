// File: /functions/api/admin/gift-card-redemptions.js
// Brief description: Admin gift-card redemption endpoint for order checkout/admin payment screens.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function clean(value, limit = 200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function ensureSchema(db){ await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_redemptions (gift_card_redemption_id INTEGER PRIMARY KEY AUTOINCREMENT, gift_card_id INTEGER NOT NULL, order_id INTEGER, redeemed_amount_cents INTEGER NOT NULL DEFAULT 0, redeemed_by_email TEXT, created_by_user_id INTEGER, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run(); }
export async function onRequestPost(context){
  const db=getDb(context.env); if(!db) return json({ok:false,error:'Database binding is missing.'},500);
  const adminUser=await getAdminUserFromRequest(context.request,context.env); if(!adminUser) return json({ok:false,error:'Unauthorized.'},401);
  await ensureSchema(db); let body={}; try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400)}
  const code=clean(body.code,80).toUpperCase(); const orderId=Number(body.order_id||0)||null; const requested=Math.max(0,Math.round(Number(body.amount_cents||0)||0));
  if(!code) return json({ok:false,error:'Gift-card code is required.'},400);
  const card=await db.prepare(`SELECT * FROM gift_cards WHERE UPPER(code)=? LIMIT 1`).bind(code).first().catch(()=>null);
  if(!card) return json({ok:false,error:'Gift card was not found.'},404);
  if(String(card.status||'').toLowerCase()!=='active') return json({ok:false,error:`Gift card is ${card.status||'not active'}.`},409);
  const remaining=Number(card.remaining_amount_cents||0); if(remaining<=0) return json({ok:false,error:'Gift card has no remaining balance.'},409);
  const amount=requested>0?Math.min(requested,remaining):remaining;
  await db.prepare(`INSERT INTO gift_card_redemptions (gift_card_id, order_id, redeemed_amount_cents, redeemed_by_email, created_by_user_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(Number(card.gift_card_id), orderId, amount, clean(body.redeemed_by_email||card.recipient_email||card.issued_to_email||'',200), Number(adminUser.user_id||0)||null, clean(body.notes||'',800)).run();
  await db.prepare(`UPDATE gift_cards SET remaining_amount_cents=MAX(0, remaining_amount_cents - ?), last_redeemed_at=CURRENT_TIMESTAMP, status=CASE WHEN MAX(0, remaining_amount_cents - ?) <= 0 THEN 'redeemed' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE gift_card_id=?`).bind(amount, amount, Number(card.gift_card_id)).run();
  return json({ok:true,message:`Redeemed ${(amount/100).toFixed(2)} ${card.currency||'CAD'} from gift card.`, redeemed_amount_cents:amount, remaining_amount_cents:Math.max(0,remaining-amount)});
}
