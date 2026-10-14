// Build390: bounded admin-only review of zero-dollar Products following the client parsing regression.
// Read-only: ZERO historical price reconstruction or automatic rewrites.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
const json=(v,status=200)=>jsonResponse(v,status,{'Cache-Control':'no-store'});
const admin=context=>{const user=context?.data?.ddModuleAccess?.user;return user&&String(user.role||'').toLowerCase()==='admin';};
export async function onRequestGet(context){
 if(!admin(context))return json({ok:false,error:'Admin access required'},401);
 const db=getDb(context.env);if(!db)return json({ok:false,error:'Database unavailable'},503);
 try{
  const r=await db.prepare(`SELECT product_id,product_number,name,sku,status,price_cents,updated_at
  FROM products WHERE COALESCE(price_cents,0)=0
  ORDER BY product_id DESC LIMIT 26`).all();
  const rows=Array.isArray(r?.results)?r.results:[];
  return json({ok:true,items:rows.slice(0,25).map((item)=>({...item,
   price_review_state:'source_evidence_required',drift_confirmed:false,valid_zero_price_possible:true})),has_more:rows.length>25,read_only:true,
   price_monitoring_mode:'manual_source_review_only',verified_source_baseline_available:false,
   no_automatic_price_repair:true,evidence_required:true,source_acceptance:'operator_approval_required',historical_price_inferred:false,reason:'Zero-priced items may be intentional or may have been affected by an earlier faulty decimal parser. Verify each against original pricing evidence before correcting.'});
 }catch{return json({ok:false,error:'Zero-price source review could not be verified; no prices were changed.'},503);}
}
