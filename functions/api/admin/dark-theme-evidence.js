// File: /functions/api/admin/dark-theme-evidence.js
// Brief description: Store and review dark-theme screenshot/evidence rows for public-page visual regression reviews, including direct R2 uploads.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(d,s=200){return jsonResponse(d,s,{ 'Cache-Control':'no-store' });}
function rows(r){return Array.isArray(r?.results)?r.results:[];}
function clean(v,l=1200){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
async function ensureColumn(db, table, name, sql){const info=rows(await db.prepare(`PRAGMA table_info(${table})`).all().catch(()=>({results:[]})));if(!info.some((r)=>String(r.name||'').toLowerCase()===name.toLowerCase())) await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${sql}`).run().catch(()=>null);}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS dark_theme_screenshot_evidence (dark_theme_screenshot_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,page_path TEXT NOT NULL,evidence_url TEXT,section_label TEXT,review_status TEXT NOT NULL DEFAULT 'needs_review',contrast_status TEXT NOT NULL DEFAULT 'unchecked',notes TEXT,created_by_user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await ensureColumn(db,'dark_theme_screenshot_evidence','object_key','object_key TEXT');
  await ensureColumn(db,'dark_theme_screenshot_evidence','original_filename','original_filename TEXT');
  await ensureColumn(db,'dark_theme_screenshot_evidence','mime_type','mime_type TEXT');
  await ensureColumn(db,'dark_theme_screenshot_evidence','file_size_bytes','file_size_bytes INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db,'dark_theme_screenshot_evidence','checklist_key','checklist_key TEXT');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_dark_theme_evidence_review ON dark_theme_screenshot_evidence(page_path, review_status, contrast_status, updated_at)`).run().catch(()=>null);
}
const checklist = [
  { key:'home', page_path:'/', label:'Home page hero, navigation, cards, forms, and footer.' },
  { key:'shop', page_path:'/shop/', label:'Shop listing, filters, cards, buttons, prices, and empty states.' },
  { key:'creations', page_path:'/creations/', label:'Creations gallery cards and image captions.' },
  { key:'gallery', page_path:'/gallery/', label:'Gallery grid, proof cards, and image treatment.' },
  { key:'gift_cards', page_path:'/gift-cards/', label:'Gift card purchase path, amount cards, and form states.' },
  { key:'custom_request', page_path:'/custom-request/', label:'Custom request intake form, file hints, and consent copy.' },
  { key:'jewelry', page_path:'/handmade-jewelry-ontario/', label:'Local jewelry landing page dark-theme section checks.' },
  { key:'custom_gifts', page_path:'/custom-gifts-southern-ontario/', label:'Custom gifts local landing page dark-theme checks.' },
  { key:'candles', page_path:'/custom-candle-making-ontario/', label:'Candle local landing page proof, cards, and CTAs.' },
  { key:'soaps', page_path:'/custom-soap-making-ontario/', label:'Soap local landing page proof, cards, and CTAs.' }
];
function bucket(env){return env.DARK_THEME_EVIDENCE_BUCKET || env.MEDIA_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;}
function publicUrl(env,key){const base=String(env.R2_PUBLIC_BASE_URL||env.PUBLIC_R2_BASE_URL||env.PRODUCT_MEDIA_PUBLIC_BASE_URL||'').replace(/\/$/,'');return base?`${base}/${key}`:'';}
async function uploadEvidence(context, form, user){
  const file=form.get('file');
  if(!file || typeof file.arrayBuffer!=='function') return json({ok:false,error:'A PDF/image evidence file is required.'},400);
  const mime=clean(file.type||'application/octet-stream',120).toLowerCase();
  if(!(mime==='application/pdf'||mime.startsWith('image/'))) return json({ok:false,error:'Only PDF and image evidence files can be uploaded.'},400);
  const max=12*1024*1024;
  if(Number(file.size||0)>max) return json({ok:false,error:'Evidence file is too large. Keep dark-theme evidence uploads under 12 MB.'},400);
  const b=bucket(context.env);
  if(!b || typeof b.put!=='function') return json({ok:false,error:'R2 evidence bucket binding is not configured.'},500);
  const page=clean(form.get('page_path')||'',400); if(!page) return json({ok:false,error:'page_path is required.'},400);
  const original=clean(file.name||'dark-theme-evidence',220);
  const key=`dark-theme-evidence/${Date.now()}-${original.replace(/[^a-zA-Z0-9._-]+/g,'-')}`;
  const bytes=await file.arrayBuffer();
  await b.put(key, bytes, { httpMetadata:{ contentType:mime }, customMetadata:{ page_path:page, uploaded_by:String(user.user_id||'') } });
  const url=publicUrl(context.env,key);
  const db=getDb(context.env);
  await db.prepare(`INSERT INTO dark_theme_screenshot_evidence (page_path,evidence_url,object_key,original_filename,mime_type,file_size_bytes,section_label,review_status,contrast_status,notes,checklist_key,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(page,url,key,original,mime,Number(file.size||0),clean(form.get('section_label')||'',200),clean(form.get('review_status')||'needs_review',80),clean(form.get('contrast_status')||'unchecked',80),clean(form.get('notes')||'',1200),clean(form.get('checklist_key')||'',120),Number(user.user_id||0)||null).run();
  return json({ok:true,message:'Dark-theme evidence uploaded to R2.',object_key:key,evidence_url:url});
}
export async function onRequestGet(context){const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is missing.'},500);const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,error:'Unauthorized.'},401);await ensure(db);const url=new URL(context.request.url);const page=clean(url.searchParams.get('page_path')||'',400);const items=rows(await db.prepare(`SELECT * FROM dark_theme_screenshot_evidence WHERE (?='' OR page_path=?) ORDER BY datetime(updated_at) DESC LIMIT 300`).bind(page,page).all().catch(()=>({results:[]})));return json({ok:true,items,checklist,summary:{total:items.length,needs_review:items.filter(i=>i.review_status==='needs_review').length,failed:items.filter(i=>i.contrast_status==='failed').length,approved:items.filter(i=>i.review_status==='approved').length}})}
export async function onRequestPost(context){const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is missing.'},500);const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,error:'Unauthorized.'},401);await ensure(db);const type=context.request.headers.get('content-type')||'';if(type.includes('multipart/form-data')) return uploadEvidence(context, await context.request.formData(), user);let body={};try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON body.'},400)}const action=clean(body.action||'create',80);if(action==='update_status'){const id=Number(body.dark_theme_screenshot_evidence_id||0);if(!id)return json({ok:false,error:'Evidence ID is required.'},400);await db.prepare(`UPDATE dark_theme_screenshot_evidence SET review_status=?, contrast_status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE dark_theme_screenshot_evidence_id=?`).bind(clean(body.review_status||'needs_review',80),clean(body.contrast_status||'unchecked',80),clean(body.notes||'',1200),id).run();return json({ok:true,message:'Dark-theme evidence status updated.'})}const page=clean(body.page_path||'',400);if(!page)return json({ok:false,error:'page_path is required.'},400);await db.prepare(`INSERT INTO dark_theme_screenshot_evidence (page_path,evidence_url,section_label,review_status,contrast_status,notes,checklist_key,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(page,clean(body.evidence_url||'',1200),clean(body.section_label||'',200),clean(body.review_status||'needs_review',80),clean(body.contrast_status||'unchecked',80),clean(body.notes||'',1200),clean(body.checklist_key||'',120),Number(user.user_id||0)||null).run();return json({ok:true,message:'Dark-theme screenshot evidence stored.'})}
