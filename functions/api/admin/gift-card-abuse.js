// File: /functions/api/admin/gift-card-abuse.js
// Brief description: Admin dashboard and lockout controls for repeated failed public gift-card balance lookup attempts.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];} function clean(v,l=240){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
async function ensure(db){await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT, lookup_email TEXT, code_suffix TEXT, ip_hash TEXT, user_agent TEXT, result_status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(()=>null);await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts (gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT, lookup_email TEXT, code_suffix TEXT, ip_hash TEXT, lockout_status TEXT NOT NULL DEFAULT 'active', lockout_reason TEXT, locked_by_user_id INTEGER, locked_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT, released_at TEXT, notes TEXT)`).run().catch(()=>null)}
export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,error:'Unauthorized.'},401);await ensure(db);
  const attempts=rows(await db.prepare(`SELECT lookup_email, code_suffix, ip_hash, result_status, COUNT(*) AS attempt_count, MAX(created_at) AS last_attempt_at FROM gift_card_lookup_attempts WHERE datetime(created_at) >= datetime('now','-14 days') GROUP BY lookup_email, code_suffix, ip_hash, result_status ORDER BY attempt_count DESC, datetime(last_attempt_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const lockouts=rows(await db.prepare(`SELECT * FROM gift_card_lookup_lockouts WHERE lockout_status='active' ORDER BY datetime(locked_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const scored=attempts.map((row)=>{const count=Number(row.attempt_count||0);const failedStatus=String(row.result_status||'').toLowerCase()!=='ok';const severity_score=failedStatus?Math.min(100,count*18):Math.min(30,count*4);const locked=lockouts.some((lock)=>String(lock.lookup_email||'').toLowerCase()===String(row.lookup_email||'').toLowerCase()||String(lock.ip_hash||'')===String(row.ip_hash||''));return {...row,severity_score,severity_label:severity_score>=75?'high':severity_score>=40?'medium':'low',is_locked:locked?1:0};});
  const failed=scored.filter((row)=>String(row.result_status||'').toLowerCase()!=='ok');
  return json({ok:true,attempts:scored,lockouts,summary:{groups:scored.length,failed_groups:failed.length,high_risk:failed.filter((row)=>Number(row.severity_score||0)>=75).length,active_lockouts:lockouts.length}});
}
export async function onRequestPost(context){
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,error:'Unauthorized.'},401);await ensure(db);let body={};try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'lock',40);
  if(action==='unlock'){const id=Number(body.gift_card_lookup_lockout_id||0);if(!id)return json({ok:false,error:'gift_card_lookup_lockout_id is required.'},400);await db.prepare(`UPDATE gift_card_lookup_lockouts SET lockout_status='released', released_at=CURRENT_TIMESTAMP, notes=COALESCE(notes,'') || ? WHERE gift_card_lookup_lockout_id=?`).bind(`\nReleased by admin: ${clean(body.notes||'',600)}`,id).run();return json({ok:true,message:'Gift-card lookup lockout released.'})}
  await db.prepare(`INSERT INTO gift_card_lookup_lockouts (lookup_email,code_suffix,ip_hash,lockout_status,lockout_reason,locked_by_user_id,locked_at,expires_at,notes) VALUES (?,?,?,'active',?,?,CURRENT_TIMESTAMP,datetime('now',?),?)`).bind(clean(body.lookup_email||'',240),clean(body.code_suffix||'',24),clean(body.ip_hash||'',120),clean(body.lockout_reason||'Repeated failed lookup attempts.',800),Number(user.user_id||0)||null,clean(body.expires_in||'+7 days',40),clean(body.notes||'',800)).run();
  return json({ok:true,message:'Gift-card lookup lockout created.'});
}
