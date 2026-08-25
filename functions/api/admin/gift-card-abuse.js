// Devil n Dove Build 407 — Gift Card lookup abuse review and stable lockout-ID controls.
// Schema authority: database_gift_card_runtime_parity.sql.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { requireGiftCardSchema } from '../_lib/giftCardSchemaReadiness.js';

const BUILD = 407;
const CONTRACT_ID = 'operations-gift-card-abuse-write';
function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(v,l=240){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
async function requireAbuseSchema(db){return requireGiftCardSchema(db,{requiredTables:['gift_card_lookup_attempts','gift_card_lookup_lockouts']});}

export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,build:BUILD,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,build:BUILD,error:'Unauthorized.'},401);
  const schema=await requireAbuseSchema(db); if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  const attempts=rows(await db.prepare(`SELECT lookup_email, code_suffix, ip_hash, result_status, COUNT(*) AS attempt_count, MAX(created_at) AS last_attempt_at FROM gift_card_lookup_attempts WHERE datetime(created_at) >= datetime('now','-14 days') GROUP BY lookup_email, code_suffix, ip_hash, result_status ORDER BY attempt_count DESC, datetime(last_attempt_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const lockouts=rows(await db.prepare(`SELECT * FROM gift_card_lookup_lockouts WHERE lockout_status='active' ORDER BY datetime(locked_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  const scored=attempts.map((row)=>{const count=Number(row.attempt_count||0);const failedStatus=String(row.result_status||'').toLowerCase()!=='ok';const severity_score=failedStatus?Math.min(100,count*18):Math.min(30,count*4);const locked=lockouts.some((lock)=>String(lock.lookup_email||'').toLowerCase()===String(row.lookup_email||'').toLowerCase()||String(lock.ip_hash||'')===String(row.ip_hash||''));return {...row,severity_score,severity_label:severity_score>=75?'high':severity_score>=40?'medium':'low',is_locked:locked?1:0};});
  const failed=scored.filter((row)=>String(row.result_status||'').toLowerCase()!=='ok');
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',attempts:scored,lockouts,summary:{groups:scored.length,failed_groups:failed.length,high_risk:failed.filter((row)=>Number(row.severity_score||0)>=75).length,active_lockouts:lockouts.length},request_time_schema_mutation:false,migration_authority:'database_gift_card_runtime_parity.sql'});
}

export async function onRequestPost(context){
  const db=getDb(context.env); if(!db)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Unauthorized.'},401);
  const schema=await requireAbuseSchema(db); if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  let body={};try{body=await context.request.json()}catch{return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'lock',40).toLowerCase();

  if(action==='unlock'){
    const id=Number(body.gift_card_lookup_lockout_id||0);
    if(!id)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'gift_card_lookup_lockout_id is required.'},400);
    const existing=await db.prepare(`SELECT gift_card_lookup_lockout_id, lockout_status FROM gift_card_lookup_lockouts WHERE gift_card_lookup_lockout_id=? LIMIT 1`).bind(id).first().catch(()=>null);
    if(!existing)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Gift-card lookup lockout was not found.'},404);
    if(String(existing.lockout_status||'').toLowerCase()!=='active')return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card lookup lockout is already released.',gift_card_lookup_lockout_id:id,request_time_schema_mutation:false});
    await db.prepare(`UPDATE gift_card_lookup_lockouts SET lockout_status='released', released_at=CURRENT_TIMESTAMP, notes=COALESCE(notes,'') || ? WHERE gift_card_lookup_lockout_id=?`).bind(`\nReleased by admin #${Number(user.user_id||0)||0}: ${clean(body.notes||'',600)}`,id).run();
    return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card lookup lockout released.',gift_card_lookup_lockout_id:id,request_time_schema_mutation:false});
  }

  if(action!=='lock')return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Supported actions: lock, unlock.'},400);
  const lookupEmail=clean(body.lookup_email||'',240).toLowerCase();
  const codeSuffix=clean(body.code_suffix||'',24);
  const ipHash=clean(body.ip_hash||'',120);
  if(!lookupEmail&&!codeSuffix&&!ipHash)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'At least one lookup identifier is required.'},400);
  const result=await db.prepare(`INSERT INTO gift_card_lookup_lockouts (lookup_email,code_suffix,ip_hash,lockout_status,lockout_reason,locked_by_user_id,locked_at,expires_at,notes) VALUES (?,?,?,'active',?,?,CURRENT_TIMESTAMP,datetime('now',?),?)`).bind(lookupEmail||null,codeSuffix||null,ipHash||null,clean(body.lockout_reason||'Repeated failed lookup attempts.',800),Number(user.user_id||0)||null,clean(body.expires_in||'+7 days',40),clean(body.notes||'',800)).run();
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card lookup lockout created.',gift_card_lookup_lockout_id:Number(result?.meta?.last_row_id||0),request_time_schema_mutation:false});
}
