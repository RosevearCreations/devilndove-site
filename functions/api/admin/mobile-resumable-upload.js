// File: /functions/api/admin/mobile-resumable-upload.js
// Build 193: Admin-only R2 multipart image upload for unreliable mobile connections.
// The client may need to re-select the same file after a browser reload; completed R2 parts are retained
// and uploaded parts are not repeated. This endpoint never exposes bucket credentials.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const FALLBACK_PUBLIC_MEDIA_BASE = 'https://assets.devilndove.com';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, values = []) { try { return rows(await db.prepare(sql).bind(...values).all()); } catch { return []; } }
async function safeFirst(db, sql, values = [], fallback = null) { try { return (await db.prepare(sql).bind(...values).first()) || fallback; } catch { return fallback; } }
async function safeRun(db, sql, values = []) { try { return await db.prepare(sql).bind(...values).run(); } catch { return null; } }

function cleanFileName(value) {
  const result = String(value || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return result || 'upload';
}
function extension(fileName, mime) {
  const fromName = String(fileName || '').match(/\.([a-z0-9]{1,10})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  return ({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','image/gif':'gif' })[String(mime || '').toLowerCase()] || 'bin';
}
function publicBase(env) {
  return normalizeText(env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || FALLBACK_PUBLIC_MEDIA_BASE).replace(/\/$/, '');
}
function publicUrl(env, objectKey) {
  const base = publicBase(env);
  return base && objectKey ? `${base}/${String(objectKey).replace(/^\/+/, '')}` : '';
}
function bucketFor(env) { return env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA || null; }
function isImage(mime) { return String(mime || '').toLowerCase().startsWith('image/'); }
function integer(value, fallback = 0) {
  const n = Number(value); return Number.isInteger(n) ? n : fallback;
}
function safeText(value, max = 1000) { return normalizeText(value).slice(0, max); }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS mobile_resumable_upload_sessions (mobile_resumable_upload_session_id INTEGER PRIMARY KEY AUTOINCREMENT,upload_key TEXT NOT NULL UNIQUE,draft_key TEXT,user_id INTEGER,product_id INTEGER,device_key TEXT,file_name TEXT,mime_type TEXT,expected_bytes INTEGER NOT NULL DEFAULT 0,uploaded_bytes INTEGER NOT NULL DEFAULT 0,chunk_count INTEGER NOT NULL DEFAULT 0,upload_status TEXT NOT NULL DEFAULT 'created',conflict_status TEXT NOT NULL DEFAULT 'not_checked',r2_object_key TEXT,client_started_at TEXT,last_client_sync_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_resumable_upload_runtime_rows (mobile_resumable_upload_runtime_row_id INTEGER PRIMARY KEY AUTOINCREMENT,upload_key TEXT NOT NULL UNIQUE,r2_object_key TEXT NOT NULL,multipart_upload_id TEXT NOT NULL,public_url TEXT,attached_product_id INTEGER,alt_text TEXT,created_by_user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,completed_at TEXT,aborted_at TEXT,notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_resumable_upload_parts (mobile_resumable_upload_part_id INTEGER PRIMARY KEY AUTOINCREMENT,upload_key TEXT NOT NULL,part_number INTEGER NOT NULL,part_etag TEXT NOT NULL,byte_count INTEGER NOT NULL DEFAULT 0,uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(upload_key,part_number))`,
    `CREATE TABLE IF NOT EXISTS mobile_resumable_upload_events (mobile_resumable_upload_event_id INTEGER PRIMARY KEY AUTOINCREMENT,upload_key TEXT NOT NULL,event_kind TEXT NOT NULL,event_status TEXT NOT NULL DEFAULT 'recorded',detail_json TEXT NOT NULL DEFAULT '{}',created_by_user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP)`
  ];
  for (const statement of statements) await safeRun(db, statement);
}

async function sessionForUser(db, uploadKey, userId) {
  return safeFirst(db, `SELECT s.*,r.multipart_upload_id,r.public_url,r.attached_product_id,r.alt_text,r.completed_at,r.aborted_at
    FROM mobile_resumable_upload_sessions s
    LEFT JOIN mobile_resumable_upload_runtime_rows r ON r.upload_key=s.upload_key
    WHERE s.upload_key=? AND s.user_id=? LIMIT 1`, [uploadKey, Number(userId || 0)]);
}

async function tableColumns(db, tableName) {
  return new Set((await safeAll(db, `PRAGMA table_info(${tableName})`)).map((row) => String(row.name || '')));
}

async function attachProductImage(db, env, session) {
  const productId = integer(session.product_id, 0);
  if (!productId) return { attached:false };
  const product = await safeFirst(db, `SELECT product_id,featured_image_url FROM products WHERE product_id=? LIMIT 1`, [productId]);
  if (!product) return { attached:false, warning:'Product no longer exists.' };

  const imageUrl = publicUrl(env, session.r2_object_key);
  const cols = await tableColumns(db, 'product_images');
  if (cols.has('product_id') && cols.has('image_url')) {
    const existing = await safeFirst(db, `SELECT product_image_id FROM product_images WHERE product_id=? AND image_url=? LIMIT 1`, [productId, imageUrl]);
    if (!existing) {
      const sort = await safeFirst(db, `SELECT COALESCE(MAX(sort_order),-1)+1 AS next_sort FROM product_images WHERE product_id=?`, [productId], {next_sort:0});
      const fields=['product_id','image_url']; const values=[productId,imageUrl]; const marks=['?','?'];
      if (cols.has('alt_text')) { fields.push('alt_text'); values.push(safeText(session.alt_text || '', 300)); marks.push('?'); }
      if (cols.has('sort_order')) { fields.push('sort_order'); values.push(integer(sort?.next_sort,0)); marks.push('?'); }
      if (cols.has('created_at')) { fields.push('created_at'); marks.push('CURRENT_TIMESTAMP'); }
      await safeRun(db, `INSERT INTO product_images (${fields.join(',')}) VALUES (${marks.join(',')})`, values);
    }
  }
  if (!normalizeText(product.featured_image_url)) {
    await safeRun(db, `UPDATE products SET featured_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?`, [imageUrl, productId]);
  }
  return { attached:true, image_url:imageUrl };
}

function details(session, parts) {
  return {
    upload_key: session.upload_key,
    product_id: integer(session.product_id, 0) || null,
    file_name: session.file_name || '',
    mime_type: session.mime_type || '',
    expected_bytes: Number(session.expected_bytes || 0),
    uploaded_bytes: Number(session.uploaded_bytes || 0),
    chunk_count: Number(session.chunk_count || 0),
    upload_status: session.upload_status || 'created',
    conflict_status: session.conflict_status || 'not_checked',
    r2_object_key: session.r2_object_key || '',
    public_url: session.public_url || '',
    completed_at: session.completed_at || null,
    parts: parts.map((part) => ({ part_number:Number(part.part_number || 0), byte_count:Number(part.byte_count || 0), uploaded_at:part.uploaded_at || null }))
  };
}

async function event(db, session, kind, status, detail, admin) {
  await safeRun(db, `INSERT INTO mobile_resumable_upload_events (upload_key,event_kind,event_status,detail_json,created_by_user_id) VALUES (?,?,?,?,?)`,
    [session.upload_key,kind,status,JSON.stringify(detail || {}),Number(admin.user_id || 0) || null]);
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ok:false,error:'Database binding is not configured.'},500);
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return json({ok:false,error:'Unauthorized.'},401);
  await ensureTables(db);
  const url = new URL(context.request.url);
  const uploadKey = safeText(url.searchParams.get('upload_key'), 120);
  if (!uploadKey) {
    const sessions = await safeAll(db, `SELECT upload_key,product_id,file_name,mime_type,expected_bytes,uploaded_bytes,chunk_count,upload_status,conflict_status,r2_object_key,updated_at FROM mobile_resumable_upload_sessions WHERE user_id=? ORDER BY updated_at DESC LIMIT 30`, [Number(admin.user_id || 0)]);
    return json({ok:true,sessions});
  }
  const session = await sessionForUser(db, uploadKey, admin.user_id);
  if (!session) return json({ok:false,error:'Upload session not found.'},404);
  const parts = await safeAll(db, `SELECT part_number,byte_count,uploaded_at FROM mobile_resumable_upload_parts WHERE upload_key=? ORDER BY part_number ASC`, [uploadKey]);
  return json({ok:true,session:details(session,parts)});
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ok:false,error:'Database binding is not configured.'},500);
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return json({ok:false,error:'Unauthorized.'},401);
  await ensureTables(db);

  const contentType = context.request.headers.get('content-type') || '';
  let form = null, body = {};
  if (contentType.includes('multipart/form-data')) {
    try { form = await context.request.formData(); } catch { return json({ok:false,error:'Could not read upload form data.'},400); }
    body = Object.fromEntries(form.entries());
  } else {
    try { body = await context.request.json(); } catch { return json({ok:false,error:'Expected JSON or multipart form data.'},400); }
  }
  const action = safeText(body.action, 80).toLowerCase();
  const bucket = bucketFor(context.env);

  if (action === 'create') {
    if (!bucket || typeof bucket.createMultipartUpload !== 'function') return json({ok:false,error:'PRODUCT_MEDIA_BUCKET R2 multipart support is not configured.'},500);
    const fileName = cleanFileName(body.file_name);
    const mimeType = safeText(body.mime_type, 120).toLowerCase();
    const expectedBytes = Number(body.expected_bytes || 0);
    const productId = integer(body.product_id, 0);
    if (!isImage(mimeType)) return json({ok:false,error:'Only image files are supported.'},400);
    if (!Number.isFinite(expectedBytes) || expectedBytes <= 0 || expectedBytes > MAX_IMAGE_BYTES) return json({ok:false,error:'Image must be between 1 byte and 50 MB.'},400);
    if (!productId) return json({ok:false,error:'Save and reopen a product draft before starting a resumable image upload.'},400);
    const product = await safeFirst(db, `SELECT product_id FROM products WHERE product_id=? LIMIT 1`, [productId]);
    if (!product) return json({ok:false,error:'Product draft was not found.'},404);
    const uploadKey = `mru_${crypto.randomUUID()}`;
    const objectKey = `products/${productId}/mobile-resumable/${Date.now()}-${crypto.randomUUID()}.${extension(fileName,mimeType)}`;
    let multi;
    try { multi = await bucket.createMultipartUpload(objectKey, { httpMetadata:{contentType:mimeType} }); }
    catch (error) { return json({ok:false,error:`Could not begin R2 multipart upload: ${String(error?.message || error)}`},502); }
    const altText = safeText(body.alt_text, 300);
    const deviceKey = safeText(body.device_key, 200);
    const draftKey = safeText(body.draft_key, 200);
    await safeRun(db, `INSERT INTO mobile_resumable_upload_sessions (upload_key,draft_key,user_id,product_id,device_key,file_name,mime_type,expected_bytes,upload_status,conflict_status,r2_object_key,client_started_at,last_client_sync_at,notes) VALUES (?,?,?,?,?,?,?,?, 'created','not_checked',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)`,
      [uploadKey,draftKey || null,Number(admin.user_id || 0),productId,deviceKey || null,fileName,mimeType,Math.round(expectedBytes),objectKey,'Build 193 multipart mobile upload session']);
    await safeRun(db, `INSERT INTO mobile_resumable_upload_runtime_rows (upload_key,r2_object_key,multipart_upload_id,public_url,attached_product_id,alt_text,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?)`,
      [uploadKey,objectKey,multi.uploadId,publicUrl(context.env,objectKey),productId,altText || null,Number(admin.user_id || 0),'Created from mobile resumable upload endpoint']);
    const session = await sessionForUser(db,uploadKey,admin.user_id);
    await event(db,session,'created','ok',{expected_bytes:expectedBytes,product_id:productId},admin);
    await auditAdminAction(db,admin,'mobile_resumable_upload_created','mobile_resumable_upload_session',null,{upload_key:uploadKey,product_id:productId,expected_bytes:expectedBytes}).catch(()=>null);
    return json({ok:true,message:'Resumable upload session created. Upload parts now.',session:details(session,[])});
  }

  const uploadKey = safeText(body.upload_key, 120);
  if (!uploadKey) return json({ok:false,error:'Upload key is required.'},400);
  const session = await sessionForUser(db, uploadKey, admin.user_id);
  if (!session) return json({ok:false,error:'Upload session not found.'},404);
  if (!bucket) return json({ok:false,error:'PRODUCT_MEDIA_BUCKET binding is missing.'},500);

  if (action === 'upload_part') {
    const partNumber = integer(body.part_number, 0);
    const file = form?.get('file');
    if (!partNumber || partNumber > 10000) return json({ok:false,error:'A valid part number is required.'},400);
    if (!file || typeof file.arrayBuffer !== 'function') return json({ok:false,error:'A binary file part is required.'},400);
    const size = Number(file.size || 0);
    if (size <= 0 || size > 8 * 1024 * 1024) return json({ok:false,error:'Each upload part must be between 1 byte and 8 MB.'},400);
    if (session.upload_status === 'completed') return json({ok:false,error:'This upload is already completed.'},409);
    if (session.upload_status === 'aborted') return json({ok:false,error:'This upload was aborted. Start a new upload.'},409);
    const multipart = bucket.resumeMultipartUpload(session.r2_object_key, session.multipart_upload_id);
    let part;
    try { part = await multipart.uploadPart(partNumber, file.stream()); }
    catch (error) { await event(db,session,'part_upload','failed',{part_number:partNumber,error:String(error?.message || error)},admin); return json({ok:false,error:`Part upload failed: ${String(error?.message || error)}`},502); }
    await safeRun(db, `INSERT INTO mobile_resumable_upload_parts (upload_key,part_number,part_etag,byte_count) VALUES (?,?,?,?) ON CONFLICT(upload_key,part_number) DO UPDATE SET part_etag=excluded.part_etag,byte_count=excluded.byte_count,uploaded_at=CURRENT_TIMESTAMP`,
      [uploadKey,partNumber,String(part.etag || ''),size]);
    const totals = await safeFirst(db, `SELECT COALESCE(SUM(byte_count),0) AS uploaded_bytes,COUNT(*) AS chunk_count FROM mobile_resumable_upload_parts WHERE upload_key=?`, [uploadKey],{uploaded_bytes:0,chunk_count:0});
    await safeRun(db, `UPDATE mobile_resumable_upload_sessions SET uploaded_bytes=?,chunk_count=?,upload_status='uploading',last_client_sync_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE upload_key=?`,
      [Number(totals.uploaded_bytes || 0),Number(totals.chunk_count || 0),uploadKey]);
    const refreshed = await sessionForUser(db,uploadKey,admin.user_id);
    await event(db,refreshed,'part_upload','ok',{part_number:partNumber,byte_count:size},admin);
    const parts = await safeAll(db, `SELECT part_number,byte_count,uploaded_at FROM mobile_resumable_upload_parts WHERE upload_key=? ORDER BY part_number`, [uploadKey]);
    return json({ok:true,message:`Part ${partNumber} uploaded.`,session:details(refreshed,parts)});
  }

  if (action === 'complete') {
    if (session.upload_status === 'completed') {
      const existing = await safeAll(db, `SELECT part_number,byte_count,uploaded_at FROM mobile_resumable_upload_parts WHERE upload_key=? ORDER BY part_number`, [uploadKey]);
      return json({ok:true,message:'Upload was already completed.',session:details(session,existing)});
    }
    const parts = await safeAll(db, `SELECT part_number,part_etag,byte_count,uploaded_at FROM mobile_resumable_upload_parts WHERE upload_key=? ORDER BY part_number ASC`, [uploadKey]);
    if (!parts.length) return json({ok:false,error:'Upload at least one part before completing.'},400);
    const multipart = bucket.resumeMultipartUpload(session.r2_object_key, session.multipart_upload_id);
    try { await multipart.complete(parts.map((part)=>({partNumber:Number(part.part_number),etag:String(part.part_etag)}))); }
    catch (error) { await event(db,session,'complete','failed',{error:String(error?.message || error)},admin); return json({ok:false,error:`Could not complete multipart upload: ${String(error?.message || error)}`},502); }
    const totals = await safeFirst(db,`SELECT COALESCE(SUM(byte_count),0) AS uploaded_bytes,COUNT(*) AS chunk_count FROM mobile_resumable_upload_parts WHERE upload_key=?`,[uploadKey],{uploaded_bytes:0,chunk_count:0});
    await safeRun(db, `UPDATE mobile_resumable_upload_sessions SET uploaded_bytes=?,chunk_count=?,upload_status='completed',last_client_sync_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE upload_key=?`,
      [Number(totals.uploaded_bytes||0),Number(totals.chunk_count||0),uploadKey]);
    await safeRun(db, `UPDATE mobile_resumable_upload_runtime_rows SET completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE upload_key=?`,[uploadKey]);
    const refreshed = await sessionForUser(db,uploadKey,admin.user_id);
    const attach = await attachProductImage(db, context.env, refreshed);
    await event(db,refreshed,'complete','ok',{attached:attach.attached,image_url:attach.image_url || null},admin);
    await auditAdminAction(db,admin,'mobile_resumable_upload_completed','mobile_resumable_upload_session',null,{upload_key:uploadKey,product_id:refreshed.product_id,attached:attach.attached}).catch(()=>null);
    const mapped = await safeAll(db,`SELECT part_number,byte_count,uploaded_at FROM mobile_resumable_upload_parts WHERE upload_key=? ORDER BY part_number`,[uploadKey]);
    return json({ok:true,message:attach.attached ? 'Upload completed and attached to the product draft.' : 'Upload completed. Product attachment needs review.',attachment:attach,session:details(refreshed,mapped)});
  }

  if (action === 'abort') {
    if (session.upload_status === 'completed') return json({ok:false,error:'Completed uploads cannot be aborted.'},409);
    try { await bucket.resumeMultipartUpload(session.r2_object_key, session.multipart_upload_id).abort(); }
    catch (error) { return json({ok:false,error:`Could not abort multipart upload: ${String(error?.message || error)}`},502); }
    await safeRun(db,`UPDATE mobile_resumable_upload_sessions SET upload_status='aborted',updated_at=CURRENT_TIMESTAMP WHERE upload_key=?`,[uploadKey]);
    await safeRun(db,`UPDATE mobile_resumable_upload_runtime_rows SET aborted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE upload_key=?`,[uploadKey]);
    const refreshed=await sessionForUser(db,uploadKey,admin.user_id);
    await event(db,refreshed,'abort','ok',{},admin);
    return json({ok:true,message:'Upload aborted and multipart session cleaned up.'});
  }

  return json({ok:false,error:'Unsupported upload action.'},400);
}
