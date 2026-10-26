/* Build 480: private, bounded, read-only latest aftercare follow-up portfolio sample. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {summarizeAftercarePortfolio480} from '../../../public/js/maker-aftercare-portfolio-policy-480.mjs';
const reply=(body,status=200)=>jsonResponse({release:467,build:480,...body},status,{'Cache-Control':'no-store'});
export async function onRequestGet(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return reply({ok:false,error:'Admin sign-in required.'},401);
 const db=getDb(ctx.env);if(!db)return reply({ok:false,error:'D1 binding unavailable.'},503);
 try{
  const table=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_order_fulfillment_evidence'").first();
  if(Number(table?.n)!==1)return reply({ok:false,error:'Build 454 evidence ledger migration 0049 required.'},503);
  const found=await db.prepare("SELECT evidence_id,order_id,event_kind,review_note,created_at FROM maker_order_fulfillment_evidence WHERE event_kind='aftercare_followup' ORDER BY evidence_id DESC LIMIT 251").all();
  const rows=Array.isArray(found?.results)?found.results:[];
  return reply({ok:true,portfolio:summarizeAftercarePortfolio480(rows.slice(0,250),{sampleLimit:250,hasMore:rows.length>250}),
   scope:'latest_250_aftercare_receipts',read_only:true,customer_pii:false,external_actions:false});
 }catch(e){console.error('BUILD480_PORTFOLIO_READ',e?.name);return reply({ok:false,error:'Portfolio evidence unavailable; no data changed.'},503)}
}
