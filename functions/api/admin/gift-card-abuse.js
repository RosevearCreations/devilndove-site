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
  const scored=attempts.map((row)=>{const count=Number(row.attempt_count||0);const failedStatus=String(row.result_status||'').toLowerCase()!=='ok';const severity_score=failedStatus?Math.min(100,count*18):Math.min(30,count*4);return {...row,severity_score,severity_label:severity_score>=75?'high':severity_score>=40?'medium':'low'};});
  const failed=scored.filter((row)=>String(row.result_status||'').toLowerCase()!=='ok');
  return json({ok:true,attempts:scored,summary:{groups:scored.length,failed_groups:failed.length,high_risk:failed.filter((row)=>Number(row.severity_score||0)>=75).length}});
}
