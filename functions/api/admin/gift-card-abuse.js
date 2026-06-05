// File: /functions/api/admin/gift-card-abuse.js
// Brief description: Admin dashboard for repeated failed public gift-card balance lookup attempts.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,error:'Unauthorized.'},401);
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT, lookup_email TEXT, code_suffix TEXT, ip_hash TEXT, user_agent TEXT, result_status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(()=>null);
  const attempts=rows(await db.prepare(`SELECT lookup_email, code_suffix, ip_hash, result_status, COUNT(*) AS attempt_count, MAX(created_at) AS last_attempt_at FROM gift_card_lookup_attempts WHERE datetime(created_at) >= datetime('now','-14 days') GROUP BY lookup_email, code_suffix, ip_hash, result_status ORDER BY attempt_count DESC, datetime(last_attempt_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const failed=attempts.filter((row)=>String(row.result_status||'').toLowerCase()!=='ok');
  return json({ok:true,attempts,summary:{groups:attempts.length,failed_groups:failed.length,high_risk:failed.filter((row)=>Number(row.attempt_count||0)>=5).length}});
}
