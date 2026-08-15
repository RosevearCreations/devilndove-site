import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

const DEFAULT_PUBLIC_BASE = "https://assets.devilndove.com";
const MEDIA_TYPES = new Set(["photo","artwork","logo","background","banner","packaging","icon","proof","process","technique","evidence","materials","review","blog","other"]);
const SLOT_TYPES = new Set(["image","background","text"]);
const TARGET_ATTRS = new Set(["src","background-image","textContent","href","background-color"]);
const APPROVED_R2_PREFIXES = ["brand/","creations/","social/","uploads/","public/","packaging/","artwork/","backgrounds/","banners/","galleries/","blog/"];
const BLOCKED_MEDIA_PREFIXES = ["products/","inventory/","supplies/","tools/","toolshed/"];
const BLOCKED_PAGE_PREFIXES = ["/admin","/shop/product","/tools","/toolshed","/supplies","/cart","/checkout","/login","/register","/members","/search","/account-help","/bootstrap-admin","/custom-request","/custom-request/order","/custom-request/pay","/custom-request/quote","/custom-request/consent"];
const BLOCKED_SOURCE_TYPES = new Set(["product","products","catalog","finished_product","finished-product","inventory","supply","supplies","tool","tools"]);

function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function n(value, fallback = 0) { const x = Number(value); return Number.isFinite(x) ? x : fallback; }
function bool(value) { return [1,"1",true,"true","yes","on"].includes(value) ? 1 : 0; }
function cleanPath(value) {
  let path = normalizeText(value || "/");
  if (path === "@site") return "@site";
  try { if (/^https?:\/\//i.test(path)) path = new URL(path).pathname; } catch {}
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path.length > 500) path = path.slice(0, 500);
  return path || "/";
}
function isBlockedPagePath(path) {
  if (path === "@site") return false;
  const normalized = cleanPath(path).toLowerCase();
  return BLOCKED_PAGE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}
function isBlockedMediaKey(key) {
  const normalized = normalizeText(key).replace(/^\/+/, "").toLowerCase();
  return BLOCKED_MEDIA_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
function cleanSelector(value) { return normalizeText(value).slice(0, 1000); }
function cleanSlotKey(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 240); }
function safeJson(value, fallback = []) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function publicBase(env) { return normalizeText(env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || DEFAULT_PUBLIC_BASE).replace(/\/$/, ""); }
function publicUrl(env, key) { return `${publicBase(env)}/${String(key || "").replace(/^\/+/, "")}`; }
function versionUrl(url,updatedAt){const value=String(url||'');if(!value)return null;const stamp=String(updatedAt||'').replace(/[^0-9]/g,'').slice(0,14);return stamp?`${value}${value.includes('?')?'&':'?'}v=${stamp}`:value;}
function inferMime(key) {
  const ext = String(key || "").split(".").pop()?.toLowerCase();
  return ({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",svg:"image/svg+xml",avif:"image/avif"})[ext] || "application/octet-stream";
}
function safePrefix(value) {
  const raw = normalizeText(value).replace(/^\/+/, "");
  if (!raw) return "";
  return APPROVED_R2_PREFIXES.some((prefix) => raw === prefix.slice(0,-1) || raw.startsWith(prefix)) ? (raw.endsWith("/") ? raw : `${raw}/`) : null;
}
async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok:false, error:"Admin access required." }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok:false, error:"Database binding is not configured." }, 500) };
  return { adminUser, db };
}
async function changeAudit(db, adminUser, payload = {}) {
  try {
    await db.prepare(`INSERT INTO media_content_change_audit(action_type,media_asset_id,media_content_slot_id,page_path,actor_user_id,old_value_json,new_value_json,reason,created_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(normalizeText(payload.action_type)||"change", payload.media_asset_id||null, payload.media_content_slot_id||null, payload.page_path||null, adminUser.user_id||null, payload.old_value==null?null:JSON.stringify(payload.old_value), payload.new_value==null?null:JSON.stringify(payload.new_value), normalizeText(payload.reason)||null).run();
  } catch {}
}

async function mediaList(db, query = {}) {
  const q = normalizeText(query.q).toLowerCase();
  const mediaType = normalizeText(query.media_type).toLowerCase();
  const includeArchived = bool(query.include_archived);
  const limit = Math.max(1, Math.min(72, n(query.limit, 48)));
  const beforeId = Math.max(0, n(query.before_id, 0));
  // Build 260: keep the picker query intentionally small. Assignment/use details are
  // loaded only for the selected image instead of being correlated across every row.
  const result = await db.prepare(`
    SELECT ma.media_asset_id,ma.product_id,ma.object_key,ma.public_url,ma.original_filename,ma.mime_type,ma.file_size_bytes,
           ma.width_px,ma.height_px,ma.created_at,ma.updated_at,ma.deleted_at,
           mm.display_name,mm.alt_text,mm.image_title,mm.caption,mm.description,mm.tags_json,mm.search_keywords,mm.media_type,
           mm.decorative,mm.focal_x,mm.focal_y,mm.attribution,mm.license_notes,mm.consent_notes,mm.captured_at,mm.source_type,mm.archived_at
    FROM media_assets ma
    LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id
    WHERE ma.deleted_at IS NULL
      AND ma.product_id IS NULL
      AND LOWER(COALESCE(mm.media_type,'photo')) <> 'product'
      AND LOWER(COALESCE(mm.source_type,'')) NOT IN ('product','products','inventory','supply','supplies','tool','tools')
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'products/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'inventory/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'supplies/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'tools/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'toolshed/%'
      AND (?=1 OR mm.archived_at IS NULL)
      AND (?='' OR LOWER(COALESCE(mm.media_type,'photo'))=?)
      AND (?=0 OR ma.media_asset_id < ?)
      AND (?='' OR LOWER(COALESCE(mm.display_name,ma.original_filename,ma.object_key,'')) LIKE ? OR LOWER(COALESCE(mm.alt_text,'')) LIKE ? OR LOWER(COALESCE(mm.tags_json,'')) LIKE ?)
    ORDER BY ma.media_asset_id DESC
    LIMIT ?
  `).bind(includeArchived, mediaType, mediaType, beforeId, beforeId, q, `%${q}%`, `%${q}%`, `%${q}%`, limit + 1).all();
  const found = rows(result);
  const hasMore = found.length > limit;
  const visible = hasMore ? found.slice(0, limit) : found;
  const media = visible.map((r) => ({
    ...r,
    media_asset_id:n(r.media_asset_id), product_id:r.product_id==null?null:n(r.product_id), file_size_bytes:n(r.file_size_bytes), width_px:r.width_px==null?null:n(r.width_px), height_px:r.height_px==null?null:n(r.height_px),
    decorative:bool(r.decorative), focal_x:r.focal_x==null?0.5:n(r.focal_x,0.5), focal_y:r.focal_y==null?0.5:n(r.focal_y,0.5),
    tags:safeJson(r.tags_json,[]), media_type:r.media_type||"photo", display_name:r.display_name||r.original_filename||r.object_key,
    public_url:versionUrl(r.public_url,r.updated_at)
  }));
  return { media, has_more:hasMore, next_before_id:hasMore && media.length ? media[media.length-1].media_asset_id : null };
}

async function pageSlots(db, pagePath) {
  const result = await db.prepare(`
    SELECT s.media_content_slot_id,s.page_path,s.slot_key,s.slot_label,s.slot_type,s.target_selector,s.target_attribute,s.source_snapshot,s.source_alt_snapshot,s.is_required,s.is_active,
           a.media_content_assignment_id,a.media_asset_id,ma.public_url,ma.original_filename,mm.display_name,mm.alt_text,mm.image_title,mm.focal_x,mm.focal_y,mm.decorative,
           cb.managed_content_block_id,cb.draft_text,cb.published_text,cb.published,cb.protected_static
    FROM media_content_slots s
    LEFT JOIN media_content_assignments a ON a.media_content_slot_id=s.media_content_slot_id AND a.active=1
    LEFT JOIN media_assets ma ON ma.media_asset_id=a.media_asset_id AND ma.deleted_at IS NULL
    LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=a.media_asset_id
    LEFT JOIN managed_content_blocks cb ON cb.media_content_slot_id=s.media_content_slot_id
    WHERE s.page_path=? AND s.is_active=1
    ORDER BY CASE s.slot_type WHEN 'image' THEN 1 WHEN 'background' THEN 2 ELSE 3 END,s.media_content_slot_id,s.media_content_slot_id
    LIMIT 350
  `).bind(pagePath).all();
  return rows(result).map((r)=>({...r,media_content_slot_id:n(r.media_content_slot_id),media_asset_id:r.media_asset_id==null?null:n(r.media_asset_id),media_content_assignment_id:r.media_content_assignment_id==null?null:n(r.media_content_assignment_id),published:bool(r.published),protected_static:bool(r.protected_static),decorative:bool(r.decorative),is_required:bool(r.is_required)}));
}

export async function onRequestGet(context) {
  const auth = await access(context); if (auth.error) return auth.error;
  const { db, adminUser } = auth;
  const url = new URL(context.request.url);
  const path = cleanPath(url.searchParams.get("path") || "/");
  const mode = normalizeText(url.searchParams.get("mode") || "page").toLowerCase();
  try {
    // Build 260: the slot-driven Studio no longer bootstraps page slots, the whole
    // media library and media-use details in one request. Each view is bounded and
    // loaded only when the owner opens it.
    if (mode === "media") {
      const result = await mediaList(db, Object.fromEntries(url.searchParams.entries()));
      return json({ok:true,requested_by:adminUser,media:result.media,has_more:result.has_more,next_before_id:result.next_before_id});
    }
    if (mode === "uses") {
      const selectedMediaId = n(url.searchParams.get("media_id"));
      if (selectedMediaId <= 0) return json({ok:false,error:"Select a media item first."},400);
      const usesResult = await db.prepare(`SELECT a.media_content_assignment_id,s.media_content_slot_id,s.page_path,s.slot_key,s.slot_label,s.slot_type FROM media_content_assignments a INNER JOIN media_content_slots s ON s.media_content_slot_id=a.media_content_slot_id WHERE a.media_asset_id=? AND a.active=1 AND s.is_active=1 AND s.page_path NOT LIKE '/shop%' AND s.page_path NOT LIKE '/tools%' AND s.page_path NOT LIKE '/toolshed%' AND s.page_path NOT LIKE '/supplies%' AND s.page_path NOT LIKE '/admin%' AND s.page_path NOT LIKE '/cart%' AND s.page_path NOT LIKE '/checkout%' AND s.page_path NOT LIKE '/members%' AND s.page_path NOT LIKE '/search%' ORDER BY s.page_path,s.slot_label LIMIT 120`).bind(selectedMediaId).all();
      return json({ok:true,requested_by:adminUser,media_uses:rows(usesResult)});
    }
    if (isBlockedPagePath(path)) return json({ok:false,error:"That route is managed by its specialist editor, not Media Studio."},400);
    const slots = await pageSlots(db, path);
    return json({ok:true,requested_by:adminUser,page_path:path,slots});
  } catch (error) {
    return json({ok:false,error:"Media & Content Studio data could not be loaded.",error_code:"media_studio_query_failed",detail:String(error?.message||error),mode},500);
  }
}

export async function onRequestPost(context) {
  const auth = await access(context); if (auth.error) return auth.error;
  const { db, adminUser } = auth;
  let body={}; try { body=await context.request.json(); } catch { return json({ok:false,error:"Invalid JSON body."},400); }
  const action=normalizeText(body.action).toLowerCase();
  try {
    if (action === "register_slots") {
      const pagePath=cleanPath(body.page_path); const incoming=Array.isArray(body.slots)?body.slots.slice(0,300):[];
      if (isBlockedPagePath(pagePath)) return json({ok:false,error:"Media Studio manages public/static site presentation only. Product, inventory, tools, supplies, account and transactional routes use their own editors."},400);
      if (!incoming.length) return json({ok:false,error:"No page slots were supplied."},400);
      const statements=[]; let accepted=0;
      for (const item of incoming) {
        const type=SLOT_TYPES.has(normalizeText(item?.slot_type))?normalizeText(item.slot_type):"image";
        const selector=cleanSelector(item?.target_selector); const key=cleanSlotKey(item?.slot_key); if(!selector||!key) continue;
        const attr=TARGET_ATTRS.has(normalizeText(item?.target_attribute))?normalizeText(item.target_attribute):(type==='text'?'textContent':type==='background'?'background-image':'src');
        statements.push(db.prepare(`INSERT INTO media_content_slots(page_path,slot_key,slot_label,slot_type,target_selector,target_attribute,source_snapshot,source_alt_snapshot,is_required,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(page_path,slot_key) DO UPDATE SET slot_label=excluded.slot_label,slot_type=excluded.slot_type,target_selector=excluded.target_selector,target_attribute=excluded.target_attribute,source_snapshot=excluded.source_snapshot,source_alt_snapshot=excluded.source_alt_snapshot,is_required=excluded.is_required,is_active=1,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`)
          .bind(pagePath,key,normalizeText(item?.slot_label).slice(0,300)||key,type,selector,attr,normalizeText(item?.source_snapshot).slice(0,5000)||null,normalizeText(item?.source_alt_snapshot).slice(0,1000)||null,bool(item?.is_required),adminUser.user_id,adminUser.user_id));
        accepted++;
      }
      if(!statements.length)return json({ok:false,error:"No valid slots were supplied."},400);
      await db.batch(statements);
      const textSlots=await db.prepare(`SELECT media_content_slot_id,page_path,slot_key,source_snapshot FROM media_content_slots WHERE page_path=? AND slot_type='text' AND is_active=1`).bind(pagePath).all();
      const inserts=rows(textSlots).map((r)=>db.prepare(`INSERT INTO managed_content_blocks(media_content_slot_id,page_path,slot_key,block_type,draft_text,published_text,published,protected_static,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES(?,?,?,'text',?,?,0,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(media_content_slot_id) DO NOTHING`).bind(r.media_content_slot_id,r.page_path,r.slot_key,r.source_snapshot||'',r.source_snapshot||'',adminUser.user_id,adminUser.user_id));
      if(inserts.length)await db.batch(inserts);
      await changeAudit(db,adminUser,{action_type:"register_slots",page_path:pagePath,new_value:{count:accepted}});
      await auditAdminAction(context.env,context.request,adminUser,{action_type:"media_content_slots_register",target_type:"page",target_key:pagePath,details:{count:accepted}});
      return json({ok:true,message:`Registered/refreshed ${accepted} editable page slots. Existing public assignments were not changed.`,slots:await pageSlots(db,pagePath)});
    }

    if (action === "save_media_metadata") {
      const mediaId=n(body.media_asset_id); if(mediaId<=0)return json({ok:false,error:"Select a media item first."},400);
      const exists=await db.prepare(`SELECT ma.media_asset_id,ma.product_id,ma.object_key,mm.source_type,mm.media_type FROM media_assets ma LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id WHERE ma.media_asset_id=? AND ma.deleted_at IS NULL`).bind(mediaId).first();
      if(!exists || exists.product_id!=null || isBlockedMediaKey(exists.object_key) || BLOCKED_SOURCE_TYPES.has(normalizeText(exists.source_type).toLowerCase()) || normalizeText(exists.media_type).toLowerCase()==='product') return json({ok:false,error:"That media belongs to a product/inventory specialist workflow and is intentionally excluded from Media Studio."},404);
      const mediaType=MEDIA_TYPES.has(normalizeText(body.media_type).toLowerCase())?normalizeText(body.media_type).toLowerCase():"photo";
      const sourceType=normalizeText(body.source_type).slice(0,100).toLowerCase();
      if (BLOCKED_SOURCE_TYPES.has(sourceType)) return json({ok:false,error:"Product, inventory, supply and tool media must be edited in their specialist admin workspace."},400);
      const tags=Array.isArray(body.tags)?body.tags.slice(0,40).map((v)=>normalizeText(v).slice(0,80)).filter(Boolean):normalizeText(body.tags).split(',').map((v)=>v.trim()).filter(Boolean).slice(0,40);
      await db.prepare(`INSERT INTO managed_media_metadata(media_asset_id,display_name,alt_text,image_title,caption,description,tags_json,search_keywords,media_type,decorative,focal_x,focal_y,attribution,license_notes,consent_notes,captured_at,source_type,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(media_asset_id) DO UPDATE SET display_name=excluded.display_name,alt_text=excluded.alt_text,image_title=excluded.image_title,caption=excluded.caption,description=excluded.description,tags_json=excluded.tags_json,search_keywords=excluded.search_keywords,media_type=excluded.media_type,decorative=excluded.decorative,focal_x=excluded.focal_x,focal_y=excluded.focal_y,attribution=excluded.attribution,license_notes=excluded.license_notes,consent_notes=excluded.consent_notes,captured_at=excluded.captured_at,source_type=excluded.source_type,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`)
        .bind(mediaId,normalizeText(body.display_name).slice(0,300)||null,normalizeText(body.alt_text).slice(0,1000)||null,normalizeText(body.image_title).slice(0,500)||null,normalizeText(body.caption).slice(0,2000)||null,normalizeText(body.description).slice(0,5000)||null,JSON.stringify(tags),normalizeText(body.search_keywords).slice(0,1500)||null,mediaType,bool(body.decorative),Math.max(0,Math.min(1,n(body.focal_x,0.5))),Math.max(0,Math.min(1,n(body.focal_y,0.5))),normalizeText(body.attribution).slice(0,1000)||null,normalizeText(body.license_notes).slice(0,2000)||null,normalizeText(body.consent_notes).slice(0,2000)||null,normalizeText(body.captured_at)||null,sourceType||null,adminUser.user_id,adminUser.user_id).run();
      await changeAudit(db,adminUser,{action_type:"media_metadata_update",media_asset_id:mediaId,new_value:{media_type:mediaType,display_name:body.display_name}});
      return json({ok:true,message:"Media metadata saved."});
    }

    if (action === "assign_media") {
      const slotId=n(body.media_content_slot_id), mediaId=n(body.media_asset_id); if(slotId<=0||mediaId<=0)return json({ok:false,error:"Choose both a page slot and a media item."},400);
      const slot=await db.prepare(`SELECT * FROM media_content_slots WHERE media_content_slot_id=? AND is_active=1`).bind(slotId).first(); if(!slot||slot.slot_type==='text')return json({ok:false,error:"That slot cannot receive an image."},400);
      const media=await db.prepare(`SELECT ma.media_asset_id,ma.product_id,ma.object_key,mm.archived_at,mm.source_type,mm.media_type FROM media_assets ma LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id WHERE ma.media_asset_id=? AND ma.deleted_at IS NULL`).bind(mediaId).first();
      if(!media || media.product_id!=null || isBlockedMediaKey(media.object_key) || BLOCKED_SOURCE_TYPES.has(normalizeText(media.source_type).toLowerCase()) || normalizeText(media.media_type).toLowerCase()==='product') return json({ok:false,error:"That media is managed by the Product/Inventory workflow, not Media Studio."},404); if(media.archived_at)return json({ok:false,error:"Archived media cannot be newly assigned. Restore it first."},409);
      const previous=await db.prepare(`SELECT media_content_assignment_id,media_asset_id FROM media_content_assignments WHERE media_content_slot_id=? AND active=1 LIMIT 1`).bind(slotId).first();
      const batch=[]; if(previous)batch.push(db.prepare(`UPDATE media_content_assignments SET active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE media_content_assignment_id=?`).bind(adminUser.user_id,previous.media_content_assignment_id));
      batch.push(db.prepare(`INSERT INTO media_content_assignments(media_content_slot_id,media_asset_id,active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES(?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(slotId,mediaId,adminUser.user_id,adminUser.user_id));
      await db.batch(batch);
      await changeAudit(db,adminUser,{action_type:"assign_media",media_asset_id:mediaId,media_content_slot_id:slotId,page_path:slot.page_path,old_value:previous||null,new_value:{media_asset_id:mediaId}});
      return json({ok:true,message:previous&&n(previous.media_asset_id)!==mediaId?"Occupied placement replaced. Only this placement was changed; no other use of either image was altered.":"Image assigned to this placement.",slots:await pageSlots(db,slot.page_path)});
    }

    if (action === "remove_assignment") {
      const slotId=n(body.media_content_slot_id); const slot=await db.prepare(`SELECT page_path FROM media_content_slots WHERE media_content_slot_id=?`).bind(slotId).first(); if(!slot)return json({ok:false,error:"Page slot not found."},404);
      await db.prepare(`UPDATE media_content_assignments SET active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE media_content_slot_id=? AND active=1`).bind(adminUser.user_id,slotId).run();
      await changeAudit(db,adminUser,{action_type:"remove_assignment",media_content_slot_id:slotId,page_path:slot.page_path});
      return json({ok:true,message:"Assignment removed. The page falls back to its authored image/content.",slots:await pageSlots(db,slot.page_path)});
    }

    if (action === "save_content_block") {
      const slotId=n(body.media_content_slot_id); const slot=await db.prepare(`SELECT * FROM media_content_slots WHERE media_content_slot_id=? AND is_active=1 AND slot_type='text'`).bind(slotId).first(); if(!slot)return json({ok:false,error:"Editable text slot not found."},404);
      const draft=String(body.draft_text??'').slice(0,12000); const publish=bool(body.publish);
      await db.prepare(`INSERT INTO managed_content_blocks(media_content_slot_id,page_path,slot_key,block_type,draft_text,published_text,published,protected_static,created_by_user_id,updated_by_user_id,created_at,updated_at,published_at) VALUES(?,?,?,?,?,?,?,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END) ON CONFLICT(media_content_slot_id) DO UPDATE SET draft_text=excluded.draft_text,published_text=CASE WHEN excluded.published=1 THEN excluded.published_text ELSE managed_content_blocks.published_text END,published=CASE WHEN excluded.published=1 THEN 1 ELSE managed_content_blocks.published END,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP,published_at=CASE WHEN excluded.published=1 THEN CURRENT_TIMESTAMP ELSE managed_content_blocks.published_at END`)
        .bind(slotId,slot.page_path,slot.slot_key,slot.slot_type||'text',draft,draft,publish,adminUser.user_id,adminUser.user_id,publish).run();
      await changeAudit(db,adminUser,{action_type:publish?"publish_text":"save_text_draft",media_content_slot_id:slotId,page_path:slot.page_path,new_value:{text:draft}});
      return json({ok:true,message:publish?"Text published for this exact page slot.":"Draft saved. The public page is unchanged until Publish is used.",slots:await pageSlots(db,slot.page_path)});
    }

    if (action === "unpublish_content") {
      const slotId=n(body.media_content_slot_id); const slot=await db.prepare(`SELECT page_path FROM media_content_slots WHERE media_content_slot_id=?`).bind(slotId).first(); if(!slot)return json({ok:false,error:"Text slot not found."},404);
      await db.prepare(`UPDATE managed_content_blocks SET published=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE media_content_slot_id=?`).bind(adminUser.user_id,slotId).run();
      return json({ok:true,message:"Published override removed. The authored page text is shown again.",slots:await pageSlots(db,slot.page_path)});
    }

    if (action === "archive_media" || action === "restore_media") {
      const mediaId=n(body.media_asset_id); if(mediaId<=0)return json({ok:false,error:"Select a media item first."},400);
      if(action==='archive_media'){
        const use=await db.prepare(`SELECT COUNT(*) AS c FROM media_content_assignments WHERE media_asset_id=? AND active=1`).bind(mediaId).first();
        if(n(use?.c)>0)return json({ok:false,error:`This image is currently assigned to ${n(use.c)} placement(s). Remove or replace those placements before archiving.`},409);
      }
      await db.prepare(`INSERT INTO managed_media_metadata(media_asset_id,media_type,archived_at,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES(?,'photo',?, ?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(media_asset_id) DO UPDATE SET archived_at=excluded.archived_at,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(mediaId,action==='archive_media'?new Date().toISOString():null,adminUser.user_id,adminUser.user_id).run();
      return json({ok:true,message:action==='archive_media'?"Media archived. It was not deleted from R2.":"Media restored to the active library."});
    }

    if (action === "delete_media") {
      const mediaId=n(body.media_asset_id); if(mediaId<=0)return json({ok:false,error:"Select a media item first."},400);
      const asset=await db.prepare(`SELECT media_asset_id,object_key,public_url FROM media_assets WHERE media_asset_id=? AND deleted_at IS NULL`).bind(mediaId).first(); if(!asset)return json({ok:false,error:"Media item not found."},404);
      const use=await db.prepare(`SELECT COUNT(*) AS c FROM media_content_assignments WHERE media_asset_id=? AND active=1`).bind(mediaId).first();
      if(n(use?.c)>0)return json({ok:false,error:`Cannot delete this image. It is currently used in ${n(use.c)} location(s). Remove or replace those assignments first.`},409);
      if(normalizeText(body.confirm)!==`DELETE ${mediaId}`)return json({ok:false,error:`Type DELETE ${mediaId} to permanently remove this unassigned public asset.`},400);
      const bucket=context.env.PRODUCT_MEDIA_BUCKET||context.env.MEDIA_BUCKET||context.env.R2_PRODUCT_MEDIA;
      if(bucket?.delete&&asset.object_key)await bucket.delete(asset.object_key);
      await db.prepare(`UPDATE media_assets SET deleted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE media_asset_id=?`).bind(mediaId).run();
      await changeAudit(db,adminUser,{action_type:"delete_media",media_asset_id:mediaId,new_value:{object_key:asset.object_key}});
      return json({ok:true,message:"Unassigned public media deleted and retired from the library."});
    }

    if (action === "sync_r2") {
      const bucket=context.env.PRODUCT_MEDIA_BUCKET||context.env.MEDIA_BUCKET||context.env.R2_PRODUCT_MEDIA; if(!bucket?.list)return json({ok:false,error:"Public R2 media binding is not configured."},500);
      const prefix=safePrefix(body.prefix||""); if(prefix===null)return json({ok:false,error:"That R2 prefix is not in the approved public-media prefix list."},400);
      const cursor=normalizeText(body.cursor)||undefined; const limit=Math.max(1,Math.min(250,n(body.limit,100)));
      const listing=await bucket.list({prefix:prefix||undefined,cursor,limit}); const objects=Array.isArray(listing?.objects)?listing.objects:[];
      const statements=[];
      for(const object of objects){const key=normalizeText(object?.key);if(!key||isBlockedMediaKey(key))continue;statements.push(db.prepare(`INSERT INTO media_assets(storage_provider,bucket_name,object_key,public_url,original_filename,mime_type,file_size_bytes,created_by_user_id,created_at,updated_at,variant_role,sort_order,annotation_notes) VALUES('r2',?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'library',0,'media_studio_r2_sync') ON CONFLICT(object_key) DO UPDATE SET public_url=COALESCE(media_assets.public_url,excluded.public_url),file_size_bytes=excluded.file_size_bytes,updated_at=CURRENT_TIMESTAMP`).bind(normalizeText(context.env.PRODUCT_MEDIA_BUCKET_NAME||"devilndove-toolshed-images"),key,publicUrl(context.env,key),key.split('/').pop()||key,inferMime(key),n(object?.size),adminUser.user_id));}
      if(statements.length)await db.batch(statements);
      await auditAdminAction(context.env,context.request,adminUser,{action_type:"media_r2_sync",target_type:"r2_prefix",target_key:prefix||"root",details:{scanned:objects.length,truncated:!!listing?.truncated}});
      return json({ok:true,message:`Scanned ${objects.length} R2 objects. Existing assignments and authored metadata were preserved.`,scanned:objects.length,next_cursor:listing?.truncated?listing.cursor||null:null,truncated:!!listing?.truncated});
    }

    return json({ok:false,error:"Unknown Media Studio action."},400);
  } catch (error) {
    return json({ok:false,error:"Media & Content Studio operation failed.",error_code:"media_studio_update_failed",detail:String(error?.message||error)},500);
  }
}
