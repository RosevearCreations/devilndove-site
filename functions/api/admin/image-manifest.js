// File: /functions/api/admin/image-manifest.js
// Build 230 — database-backed visual image manifest with append-only review history.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const STATUS_VALUES = ['missing','placeholder','generated_editorial','needs_real_photo','owner_review','in_progress','approved','blocked'];
const REVIEW_VALUES = ['unchecked','needs_review','passed','failed'];
const APPROVAL_VALUES = ['needs_review','approved','blocked'];
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=1600){const text=normalizeText(value);return text.length>limit?text.slice(0,limit).trim():text;}
function allowed(value,list,fallback){const normalized=clean(value,80);return list.includes(normalized)?normalized:fallback;}

async function ensureSchema(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS image_manifest_items (
    image_manifest_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    manifest_key TEXT NOT NULL UNIQUE,
    manifest_group TEXT NOT NULL DEFAULT 'public_static',
    manifest_title TEXT NOT NULL,
    page_path TEXT NOT NULL,
    slot_key TEXT NOT NULL,
    current_asset_url TEXT,
    final_asset_url TEXT,
    required_asset_kind TEXT NOT NULL DEFAULT 'real_photo_required',
    replacement_status TEXT NOT NULL DEFAULT 'missing',
    rights_status TEXT NOT NULL DEFAULT 'needs_review',
    public_use_status TEXT NOT NULL DEFAULT 'needs_review',
    phone_review_status TEXT NOT NULL DEFAULT 'unchecked',
    desktop_review_status TEXT NOT NULL DEFAULT 'unchecked',
    recommended_width INTEGER,
    recommended_height INTEGER,
    alt_text TEXT,
    owner_name TEXT,
    evidence_url TEXT,
    notes TEXT,
    generated_asset INTEGER NOT NULL DEFAULT 0,
    generated_prompt_summary TEXT,
    is_launch_blocker INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    reviewed_by_user_id INTEGER,
    reviewed_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS image_manifest_history (
    image_manifest_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_manifest_item_id INTEGER NOT NULL,
    previous_status TEXT,
    next_status TEXT NOT NULL,
    previous_asset_url TEXT,
    next_asset_url TEXT,
    rights_status TEXT,
    public_use_status TEXT,
    phone_review_status TEXT,
    desktop_review_status TEXT,
    evidence_url TEXT,
    change_note TEXT,
    changed_by_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(image_manifest_item_id) REFERENCES image_manifest_items(image_manifest_item_id) ON DELETE CASCADE
  )`).run();
}

function summarize(items){
  return {
    total:items.length,
    approved:items.filter((item)=>item.replacement_status==='approved').length,
    generated_editorial:items.filter((item)=>Number(item.generated_asset||0)===1).length,
    open_launch_blockers:items.filter((item)=>Number(item.is_launch_blocker||0)===1&&item.replacement_status!=='approved').length,
    missing_or_placeholder:items.filter((item)=>['missing','placeholder','needs_real_photo','blocked'].includes(item.replacement_status)).length,
    phone_pending:items.filter((item)=>item.phone_review_status!=='passed').length,
    desktop_pending:items.filter((item)=>item.desktop_review_status!=='passed').length
  };
}

export async function onRequestGet(context){
  const db=getDb(context.env);
  if(!db)return json({ok:false,error:'Database binding is missing. Open the built-in manifest fallback and apply the Build 230 migration before saving evidence.'},503);
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return json({ok:false,error:'Unauthorized.'},401);
  try{
    await ensureSchema(db);
    const items=rows(await db.prepare(`SELECT * FROM image_manifest_items WHERE is_active=1 ORDER BY sort_order ASC,image_manifest_item_id ASC`).all());
    const history=rows(await db.prepare(`SELECT h.*,i.manifest_key,i.manifest_title FROM image_manifest_history h INNER JOIN image_manifest_items i ON i.image_manifest_item_id=h.image_manifest_item_id ORDER BY datetime(h.created_at) DESC,h.image_manifest_history_id DESC LIMIT 80`).all().catch(()=>({results:[]})));
    const migrationPending=items.length===0;
    return json({ok:true,build:'230',items,history,summary:summarize(items),migration_pending:migrationPending,message:migrationPending?'The manifest tables exist but have no Build 230 seed rows. Apply database_build230_visual_image_manifest.sql before recording evidence.':''});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'image_manifest',incident_code:'manifest_get_failed',severity:'error',message:'The image manifest could not be loaded.',details:{error:clean(error?.message,400)},related_user_id:user.user_id});
    return json({ok:false,error:'The database image manifest is unavailable. No saved status has been changed; use the visible unsynced fallback and retry.'},503);
  }
}

export async function onRequestPost(context){
  const db=getDb(context.env);
  if(!db)return json({ok:false,error:'Database binding is missing. Nothing was saved.'},503);
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return json({ok:false,error:'Unauthorized.'},401);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body. Nothing was saved.'},400);}
  try{
    await ensureSchema(db);
    const manifestKey=clean(body.manifest_key,120);
    if(!manifestKey)return json({ok:false,error:'manifest_key is required.'},400);
    const existing=await db.prepare(`SELECT * FROM image_manifest_items WHERE manifest_key=? AND is_active=1 LIMIT 1`).bind(manifestKey).first();
    if(!existing)return json({ok:false,error:'Manifest item not found. Apply the current migration before saving.'},404);
    const replacementStatus=allowed(body.replacement_status,STATUS_VALUES,existing.replacement_status||'missing');
    const rightsStatus=allowed(body.rights_status,APPROVAL_VALUES,existing.rights_status||'needs_review');
    const publicUseStatus=allowed(body.public_use_status,APPROVAL_VALUES,existing.public_use_status||'needs_review');
    const phoneReviewStatus=allowed(body.phone_review_status,REVIEW_VALUES,existing.phone_review_status||'unchecked');
    const desktopReviewStatus=allowed(body.desktop_review_status,REVIEW_VALUES,existing.desktop_review_status||'unchecked');
    const finalAssetUrl=clean(body.final_asset_url,1200);
    const evidenceUrl=clean(body.evidence_url,1200);
    const ownerName=clean(body.owner_name,160);
    const altText=clean(body.alt_text,500);
    const notes=clean(body.notes,2000);
    const changeNote=clean(body.change_note,1200);
    if(finalAssetUrl&&!/^\/(?!\/)|^https:\/\//i.test(finalAssetUrl))return json({ok:false,error:'Final asset URL must be a root-relative path or an HTTPS URL.'},400);
    if(evidenceUrl&&!/^\/(?!\/)|^https:\/\//i.test(evidenceUrl))return json({ok:false,error:'Evidence URL must be a root-relative path or an HTTPS URL.'},400);
    if(replacementStatus==='approved'){
      const incomplete=[];
      if(!finalAssetUrl)incomplete.push('final asset URL');
      if(rightsStatus!=='approved')incomplete.push('rights approval');
      if(publicUseStatus!=='approved')incomplete.push('public-use approval');
      if(phoneReviewStatus!=='passed')incomplete.push('phone review');
      if(desktopReviewStatus!=='passed')incomplete.push('desktop review');
      if(!altText)incomplete.push('alternative text');
      if(incomplete.length)return json({ok:false,error:`Approval requires: ${incomplete.join(', ')}.`},400);
    }
    await db.prepare(`UPDATE image_manifest_items SET final_asset_url=?,replacement_status=?,rights_status=?,public_use_status=?,phone_review_status=?,desktop_review_status=?,alt_text=?,owner_name=?,evidence_url=?,notes=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,completed_at=CASE WHEN ?='approved' THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE image_manifest_item_id=?`).bind(finalAssetUrl||null,replacementStatus,rightsStatus,publicUseStatus,phoneReviewStatus,desktopReviewStatus,altText||null,ownerName||null,evidenceUrl||null,notes||null,Number(user.user_id||0)||null,replacementStatus,Number(existing.image_manifest_item_id)).run();
    await db.prepare(`INSERT INTO image_manifest_history (image_manifest_item_id,previous_status,next_status,previous_asset_url,next_asset_url,rights_status,public_use_status,phone_review_status,desktop_review_status,evidence_url,change_note,changed_by_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(Number(existing.image_manifest_item_id),clean(existing.replacement_status,80)||null,replacementStatus,clean(existing.final_asset_url,1200)||clean(existing.current_asset_url,1200)||null,finalAssetUrl||null,rightsStatus,publicUseStatus,phoneReviewStatus,desktopReviewStatus,evidenceUrl||null,changeNote||notes||'Manifest item reviewed.',Number(user.user_id||0)||null).run();
    await auditAdminAction(context.env,context.request,user,{action_type:'image_manifest_update',target_type:'image_manifest_item',target_id:existing.image_manifest_item_id,target_key:manifestKey,details:{previous_status:existing.replacement_status,next_status:replacementStatus,rights_status:rightsStatus,public_use_status:publicUseStatus,phone_review_status:phoneReviewStatus,desktop_review_status:desktopReviewStatus}});
    return json({ok:true,message:'Manifest evidence saved.',manifest_key:manifestKey,replacement_status:replacementStatus});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'image_manifest',incident_code:'manifest_save_failed',severity:'error',message:'The image manifest item could not be saved.',details:{error:clean(error?.message,400)},related_user_id:user.user_id});
    return json({ok:false,error:'The manifest item could not be saved. Nothing should be treated as approved; retry after checking the database and incident log.'},500);
  }
}
