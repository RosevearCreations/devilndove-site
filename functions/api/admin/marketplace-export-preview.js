// File: /functions/api/admin/marketplace-export-preview.js
// Brief description: Admin marketplace export preview, image selection persistence, channel validation, CSV download, history replay, and rollback.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function csvEscape(value) { const text = String(value ?? ''); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function csv(data, filename) { return new Response(data, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } }); }
const RULES = {
  etsy: { minImages: 3, needsPrice: true, needsSku: true, needsTags: true, minAlt: 10, label: 'Etsy', maxImages: 10, fields: ['title','description','price','quantity','sku','materials','tags','image_1','image_2','image_3'] },
  facebook: { minImages: 1, needsPrice: true, needsSku: false, needsTags: false, minAlt: 8, label: 'Facebook Marketplace', maxImages: 10, fields: ['title','description','price','category','condition','image_1'] },
  pinterest: { minImages: 1, needsPrice: false, needsSku: false, needsTags: true, minAlt: 10, label: 'Pinterest', maxImages: 5, fields: ['title','description','link','board','tags','image_1'] },
  manual: { minImages: 1, needsPrice: false, needsSku: false, needsTags: false, minAlt: 8, label: 'Manual listing', maxImages: 10, fields: ['title','description','price','notes','image_1'] }
};
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, product_id INTEGER NOT NULL, selected_image_urls_json TEXT, selected_product_image_ids_json TEXT, notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(channel, product_id))`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_marketplace_export_image_selections_channel ON marketplace_export_image_selections(channel, product_id)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_history (marketplace_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, export_format TEXT NOT NULL DEFAULT 'csv', product_count INTEGER NOT NULL DEFAULT 0, ready_count INTEGER NOT NULL DEFAULT 0, blocked_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  for (const sql of [
    `ALTER TABLE marketplace_export_history ADD COLUMN snapshot_json TEXT`,
    `ALTER TABLE marketplace_export_history ADD COLUMN replayed_from_history_id INTEGER`,
    `ALTER TABLE marketplace_export_history ADD COLUMN rollback_note TEXT`
  ]) await db.prepare(sql).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_replay_events (marketplace_export_replay_event_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, source_history_id INTEGER, action_kind TEXT NOT NULL DEFAULT 'replay', affected_count INTEGER NOT NULL DEFAULT 0, notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, product_id INTEGER, validation_status TEXT NOT NULL DEFAULT 'needs_review', blocker_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, missing_fields_json TEXT NOT NULL DEFAULT '[]', row_payload_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, export_history_id INTEGER, validation_run_id INTEGER, gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation', hard_blocker_count INTEGER NOT NULL DEFAULT 0, manual_override_required INTEGER NOT NULL DEFAULT 0, override_by_user_id INTEGER, override_at TEXT, gate_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(channel, export_history_id))`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_download_block_events (marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, gate_status TEXT NOT NULL, hard_blocker_count INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 1, requested_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run().catch(() => null);
}
function issuesFor(product, imgs, channel, selectedUrls = []) {
  const rule = RULES[channel] || RULES.manual;
  const publicImgs = imgs.filter((img) => ['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status || '').toLowerCase()));
  const chosen = selectedUrls.length ? selectedUrls.map((url) => publicImgs.find((img) => img.image_url === url)).filter(Boolean) : publicImgs;
  const tags = String(product.keywords || product.product_category || '').split(',').map((x) => x.trim()).filter(Boolean);
  const issues = [];
  if (chosen.length < rule.minImages) issues.push(`Needs at least ${rule.minImages} selected public image(s)`);
  if (!publicImgs.length) issues.push('No public-use-cleared image');
  if (rule.needsPrice && Number(product.price_cents || 0) <= 0) issues.push('Missing price');
  if (rule.needsSku && !clean(product.sku, 100)) issues.push('Missing SKU');
  if (rule.needsTags && tags.length < 3) issues.push('Needs at least 3 tags/keywords');
  if (chosen.some((img) => clean(img?.image_url, 1200) && clean(img?.alt_text, 500).length < rule.minAlt)) issues.push(`Selected image alt text is under ${rule.minAlt} characters`);
  if (channel === 'etsy' && String(product.description || product.short_description || '').length < 40) issues.push('Etsy export needs a fuller description');
  return { issues, publicImgs, selectedPublicImgs: chosen.slice(0, rule.maxImages), tags };
}
function fieldPreview(product, validated, channel) {
  const images = validated.selectedPublicImgs.map((img) => img.image_url).concat(['','','','','','','','','','']).slice(0, RULES[channel].maxImages || 10);
  const price = Number(product.price_cents || 0) > 0 ? (Number(product.price_cents || 0) / 100).toFixed(2) : '';
  return {
    title: clean(product.name || '', 140),
    description: clean(product.description || product.short_description || '', 4000),
    price,
    currency: product.currency || 'CAD',
    sku: product.sku || '',
    category: product.product_category || '',
    tags: validated.tags.slice(0, 13),
    image_1: images[0] || '', image_2: images[1] || '', image_3: images[2] || '', image_4: images[3] || '', image_5: images[4] || '',
    link: product.slug ? `/shop/product/?slug=${product.slug}` : ''
  };
}
async function loadSelections(db, channel) {
  const selectionRows = rows(await db.prepare(`SELECT * FROM marketplace_export_image_selections WHERE channel = ?`).bind(channel).all().catch(() => ({ results: [] })));
  const map = new Map();
  for (const row of selectionRows) {
    let urls = [];
    try { urls = JSON.parse(row.selected_image_urls_json || '[]'); } catch { urls = []; }
    map.set(Number(row.product_id || 0), { urls: Array.isArray(urls) ? urls : [], notes: row.notes || '', updated_at: row.updated_at || '' });
  }
  return map;
}
async function buildPreview(db, channel) {
  await ensureSchema(db);
  const selections = await loadSelections(db, channel);
  const products = rows(await db.prepare(`SELECT p.product_id, p.name, p.slug, p.sku, p.featured_image_url, p.status, p.review_status, p.price_cents, p.currency, p.product_category, p.short_description, p.description, ps.keywords FROM products p LEFT JOIN product_seo ps ON ps.product_id = p.product_id WHERE COALESCE(p.status,'') != 'archived' ORDER BY p.product_id DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const imageRows = rows(await db.prepare(`SELECT product_image_id, product_id, image_url, alt_text, image_role, public_use_status, width_px, height_px, merchandising_score FROM product_images ORDER BY product_id, sort_order ASC, product_image_id ASC`).all().catch(() => ({ results: [] })));
  const grouped = new Map();
  imageRows.forEach((row) => { const id = Number(row.product_id || 0); if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(row); });
  return products.map((product) => {
    const id = Number(product.product_id || 0);
    const imgs = grouped.get(id) || [];
    const selected = selections.get(id) || { urls: [], notes: '' };
    const validated = issuesFor(product, imgs, channel, selected.urls || []);
    const preview = fieldPreview(product, validated, channel);
    return { product_id: id, name: product.name || '', slug: product.slug || '', sku: product.sku || '', channel, ok: validated.issues.length === 0, image_count: imgs.length, public_ready_images: validated.publicImgs.length, available_images: validated.publicImgs.map((img) => ({ product_image_id: Number(img.product_image_id || 0), image_url: img.image_url || '', alt_text: img.alt_text || '', image_role: img.image_role || '', width_px: Number(img.width_px || 0), height_px: Number(img.height_px || 0) })).slice(0, 20), selected_image_urls: validated.selectedPublicImgs.map((img) => img.image_url), export_image_urls: validated.selectedPublicImgs.map((img) => img.image_url), tags: validated.tags.slice(0, 13), price_cents: Number(product.price_cents || 0), currency: product.currency || 'CAD', category: product.product_category || '', description: product.description || product.short_description || '', issues: validated.issues, selection_notes: selected.notes || '', selection_saved_at: selected.updated_at || '', field_preview: preview, required_fields: RULES[channel].fields };
  });
}

function validatePreviewRows(previews, channel) {
  const required = (RULES[channel]?.fields || []).filter((field) => !/^image_\d+$/.test(field) || ['image_1','image_2','image_3'].includes(field));
  return previews.map((row) => {
    const payload = row.field_preview || {};
    const missing = required.filter((field) => {
      if (field === 'quantity') return false;
      if (field === 'materials') return false;
      if (field === 'condition') return false;
      if (field === 'board') return false;
      if (field === 'notes') return false;
      const value = payload[field];
      return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
    });
    const blockers = missing.length + (row.ok ? 0 : Math.max(1, (row.issues || []).length));
    return { product_id: row.product_id, channel, validation_status: blockers ? 'blocked' : 'passed', blocker_count: blockers, warning_count: row.ok ? 0 : (row.issues || []).length, missing_fields: missing, row_payload: payload };
  });
}

function urlsOf(row) { return Array.isArray(row.selected_image_urls) ? row.selected_image_urls : (Array.isArray(row.export_image_urls) ? row.export_image_urls : []); }
function marketplaceSnapshotDiff(currentRows, snapshotRows) {
  const current = new Map((currentRows || []).map((row) => [Number(row.product_id || 0), urlsOf(row)]));
  const old = new Map((snapshotRows || []).map((row) => [Number(row.product_id || 0), Array.isArray(row.selected_image_urls) ? row.selected_image_urls : []]));
  const ids = Array.from(new Set([...current.keys(), ...old.keys()])).filter(Boolean).sort((a,b)=>a-b);
  return ids.map((id) => {
    const now = current.get(id) || [];
    const then = old.get(id) || [];
    const added = now.filter((url) => !then.includes(url));
    const removed = then.filter((url) => !now.includes(url));
    return { product_id: id, changed: added.length > 0 || removed.length > 0, current_count: now.length, snapshot_count: then.length, added_urls: added, removed_urls: removed };
  });
}

async function saveHistory(db, channel, previews, userId, notes, replayedFrom = null) {
  await db.prepare(`INSERT INTO marketplace_export_history (channel, export_format, product_count, ready_count, blocked_count, created_by_user_id, created_at, notes, snapshot_json, replayed_from_history_id) VALUES (?, 'csv', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`).bind(channel, previews.length, previews.filter((row) => row.ok).length, previews.filter((row) => !row.ok).length, userId || null, notes || '', JSON.stringify(previews.map((row) => ({ product_id: row.product_id, selected_image_urls: row.export_image_urls, field_preview: row.field_preview, ok: row.ok, issues: row.issues }))), replayedFrom).run().catch(() => null);
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(request.url);
  const channel = clean(url.searchParams.get('channel') || 'etsy', 40).toLowerCase();
  if (!RULES[channel]) return json({ ok: false, error: 'Supported channels: etsy, facebook, pinterest, manual.' }, 400);
  const previews = await buildPreview(db, channel);
  const diffHistoryId = Number(url.searchParams.get('diff_history_id') || 0);
  if (diffHistoryId) {
    const historyRow = await db.prepare(`SELECT * FROM marketplace_export_history WHERE marketplace_export_history_id=? AND channel=? LIMIT 1`).bind(diffHistoryId, channel).first().catch(() => null);
    if (!historyRow) return json({ ok: false, error: 'Marketplace history snapshot was not found.' }, 404);
    let snapshot = []; try { snapshot = JSON.parse(historyRow.snapshot_json || '[]'); } catch { snapshot = []; }
    const diff = marketplaceSnapshotDiff(previews, Array.isArray(snapshot) ? snapshot : []);
    return json({ ok: true, channel, marketplace_export_history_id: diffHistoryId, diff, summary: { changed: diff.filter((row) => row.changed).length, total: diff.length }, history: historyRow });
  }
  if (url.searchParams.get('format') === 'csv') {
    const marginChannel = channel === 'facebook' ? 'facebook_meta' : channel === 'manual' ? 'manual_local' : channel;
    const marginWarnings = rows(await db.prepare(`SELECT product_id,warning_status,marketplace_export_status,estimated_margin_cents,estimated_margin_percent
      FROM product_margin_warning_rows WHERE marketplace_export_status <> 'allowed' OR warning_status <> 'healthy_margin'`).all().catch(() => ({ results: [] })));
    const overrideRows = rows(await db.prepare(`SELECT product_id,channel_key,approval_status,expires_at
      FROM marketplace_margin_override_history
      WHERE approval_status='approved' AND channel_key=? AND (expires_at IS NULL OR date(expires_at) >= date('now'))`)
      .bind(marginChannel).all().catch(() => ({ results: [] })));
    const overrideIds = new Set(overrideRows.map((row) => Number(row.product_id || 0)));
    const previewIds = new Set(previews.map((row) => Number(row.product_id || 0)));
    const marginBlocked = marginWarnings.filter((row) => previewIds.has(Number(row.product_id || 0)) && !overrideIds.has(Number(row.product_id || 0)));
    if (marginBlocked.length) {
      await db.prepare(`INSERT INTO marketplace_download_block_events
        (channel,gate_status,hard_blocker_count,blocked,requested_by_user_id,created_at,notes)
        VALUES (?,'blocked_margin',?,1,?,CURRENT_TIMESTAMP,?)`)
        .bind(channel,marginBlocked.length,Number(adminUser.user_id || 0) || null,
          `Build 191 blocked CSV: ${marginBlocked.length} product(s) have unknown/low/negative margin without an active approved channel override.`)
        .run().catch(() => null);
      return json({ ok:false, error:`CSV download is blocked: ${marginBlocked.length} product(s) need configured costs/channel fees, a healthy margin, or an approved temporary override.`, channel, margin_channel:marginChannel, margin_blockers:marginBlocked },409);
    }
    const gate = await db.prepare(`SELECT gate_status, hard_blocker_count, manual_override_required FROM marketplace_export_download_gates WHERE channel=? ORDER BY updated_at DESC LIMIT 1`).bind(channel).first().catch(() => null);
    const gateBlocked = gate && ['blocked','blocked_pending_validation'].includes(String(gate.gate_status || '').toLowerCase()) && Number(gate.hard_blocker_count || 0) > 0 && !Number(gate.manual_override_required || 0);
    if (gateBlocked) {
      await db.prepare(`INSERT INTO marketplace_download_block_events (channel, gate_status, hard_blocker_count, blocked, requested_by_user_id, created_at, notes) VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, 'CSV download blocked by Build 180 marketplace_export_download_gates hard blocker.')`).bind(channel, gate.gate_status || 'blocked', Number(gate.hard_blocker_count || 0), Number(adminUser.user_id || 0) || null).run().catch(() => null);
      return json({ ok: false, error: `CSV download is blocked for ${channel} until marketplace validation hard blockers are resolved or overridden.`, gate }, 409);
    }
    await saveHistory(db, channel, previews, Number(adminUser.user_id || 0) || null, 'CSV generated after Build 191 margin gate plus existing marketplace validation gate.');
    const headers = ['channel','ready','product_id','sku','title','slug','price_cents','currency','category','tags','description','image_1','image_2','image_3','image_4','image_5','issues'];
    const lines = [headers.join(',')];
    previews.forEach((row) => {
      const images = row.export_image_urls.concat(['','','','','']).slice(0,5);
      lines.push([channel, row.ok ? 'yes' : 'no', row.product_id, row.sku, row.name, row.slug, row.price_cents, row.currency, row.category, row.tags.join('|'), row.description, ...images, row.issues.join('|')].map(csvEscape).join(','));
    });
    return csv(lines.join('\n'), `devilndove-${channel}-marketplace-preview.csv`);
  }
  const history = rows(await db.prepare(`SELECT marketplace_export_history_id, channel, export_format, product_count, ready_count, blocked_count, created_at, notes, replayed_from_history_id FROM marketplace_export_history WHERE channel = ? ORDER BY datetime(created_at) DESC LIMIT 30`).bind(channel).all().catch(() => ({ results: [] })));
  return json({ ok: true, channel, rules: RULES[channel], summary: { total: previews.length, ready: previews.filter((row) => row.ok).length, blocked: previews.filter((row) => !row.ok).length, selected_products: previews.filter((row) => row.selected_image_urls.length > 0).length }, previews, history });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const channel = clean(body.channel || 'etsy', 40).toLowerCase();
  const action = clean(body.action || 'save_selection', 80);
  const productId = Number(body.product_id || 0);
  if (!RULES[channel]) return json({ ok: false, error: 'Supported channels: etsy, facebook, pinterest, manual.' }, 400);
  if (action === 'validate_export_rows') {
    const previewRows = await buildPreview(db, channel);
    const validations = validatePreviewRows(previewRows, channel);
    await db.prepare(`DELETE FROM marketplace_export_row_validation_results WHERE channel = ?`).bind(channel).run().catch(() => null);
    for (const row of validations) await db.prepare(`INSERT INTO marketplace_export_row_validation_results (channel, product_id, validation_status, blocker_count, warning_count, missing_fields_json, row_payload_json, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(channel, row.product_id || null, row.validation_status, row.blocker_count, row.warning_count, JSON.stringify(row.missing_fields), JSON.stringify(row.row_payload), Number(adminUser.user_id || 0) || null).run().catch(() => null);
    return json({ ok: true, message: `Validated ${validations.length} ${channel} export row(s).`, channel, summary: { total: validations.length, blocked: validations.filter((row) => row.validation_status === 'blocked').length, passed: validations.filter((row) => row.validation_status === 'passed').length }, validations });
  }
  if (action === 'bulk_apply_role_order') {
    const previewRows = await buildPreview(db, channel);
    let saved = 0;
    for (const row of previewRows) {
      const ordered = (row.available_images || []).filter((img) => ['hero_front','detail_texture','scale_context','process_story','gallery_support'].includes(String(img.image_role || '').toLowerCase())).map((img) => img.image_url).slice(0, RULES[channel].maxImages || 10);
      if (!ordered.length) continue;
      await db.prepare(`INSERT INTO marketplace_export_image_selections (channel, product_id, selected_image_urls_json, selected_product_image_ids_json, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, '[]', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, product_id) DO UPDATE SET selected_image_urls_json = excluded.selected_image_urls_json, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP`).bind(channel, row.product_id, JSON.stringify(ordered), 'Bulk applied from product image role order.', Number(adminUser.user_id || 0) || null).run().catch(() => null);
      saved += 1;
    }
    return json({ ok: true, message: `Bulk-applied image selections for ${saved} product(s).`, channel, saved });
  }
  if (action === 'replay_history') {
    const historyId = Number(body.marketplace_export_history_id || 0);
    const history = historyId ? await db.prepare(`SELECT * FROM marketplace_export_history WHERE marketplace_export_history_id = ? AND channel = ? LIMIT 1`).bind(historyId, channel).first().catch(() => null) : null;
    if (!history) return json({ ok: false, error: 'Marketplace export history row was not found.' }, 404);
    let snapshot = [];
    try { snapshot = JSON.parse(history.snapshot_json || '[]'); } catch { snapshot = []; }
    let saved = 0;
    for (const row of Array.isArray(snapshot) ? snapshot : []) {
      const urls = Array.isArray(row.selected_image_urls) ? row.selected_image_urls.map((u) => clean(u, 1200)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
      if (!Number(row.product_id || 0) || !urls.length) continue;
      await db.prepare(`INSERT INTO marketplace_export_image_selections (channel, product_id, selected_image_urls_json, selected_product_image_ids_json, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, '[]', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, product_id) DO UPDATE SET selected_image_urls_json = excluded.selected_image_urls_json, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP`).bind(channel, Number(row.product_id || 0), JSON.stringify(urls), `Replayed from export history ${historyId}.`, Number(adminUser.user_id || 0) || null).run().catch(() => null);
      saved += 1;
    }
    await db.prepare(`INSERT INTO marketplace_export_replay_events (channel, source_history_id, action_kind, affected_count, notes, created_by_user_id, created_at) VALUES (?, ?, 'replay_history', ?, ?, ?, CURRENT_TIMESTAMP)`).bind(channel, historyId, saved, clean(body.notes || '', 800), Number(adminUser.user_id || 0) || null).run().catch(() => null);
    return json({ ok: true, message: `Replayed ${saved} product image selections from export history.`, channel, saved });
  }
  if (action === 'rollback_channel_export') {
    const historyId = Number(body.marketplace_export_history_id || 0);
    if (historyId) {
      const history = await db.prepare(`SELECT * FROM marketplace_export_history WHERE marketplace_export_history_id = ? AND channel = ? LIMIT 1`).bind(historyId, channel).first().catch(() => null);
      if (!history) return json({ ok: false, error: 'Marketplace export history row was not found.' }, 404);
      let snapshot = []; try { snapshot = JSON.parse(history.snapshot_json || '[]'); } catch { snapshot = []; }
      await db.prepare(`DELETE FROM marketplace_export_image_selections WHERE channel = ?`).bind(channel).run();
      let restored = 0;
      for (const row of Array.isArray(snapshot) ? snapshot : []) {
        const urls = Array.isArray(row.selected_image_urls) ? row.selected_image_urls.map((u) => clean(u, 1200)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
        if (!Number(row.product_id || 0) || !urls.length) continue;
        await db.prepare(`INSERT INTO marketplace_export_image_selections (channel, product_id, selected_image_urls_json, selected_product_image_ids_json, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, '[]', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(channel, Number(row.product_id || 0), JSON.stringify(urls), `Whole-channel rollback from export history ${historyId}.`, Number(adminUser.user_id || 0) || null).run().catch(() => null);
        restored += 1;
      }
      await db.prepare(`INSERT INTO marketplace_export_replay_events (channel, source_history_id, action_kind, affected_count, notes, created_by_user_id, created_at) VALUES (?, ?, 'rollback_channel_export', ?, ?, ?, CURRENT_TIMESTAMP)`).bind(channel, historyId, restored, clean(body.notes || 'Whole channel export rollback.', 800), Number(adminUser.user_id || 0) || null).run().catch(() => null);
      return json({ ok: true, message: `Whole-channel marketplace export rolled back to history ${historyId}.`, channel, restored });
    }
    const deleted = await db.prepare(`DELETE FROM marketplace_export_image_selections WHERE channel = ?`).bind(channel).run().catch(() => null);
    const count = Number(deleted?.meta?.changes || 0) || 0;
    await db.prepare(`INSERT INTO marketplace_export_replay_events (channel, action_kind, affected_count, notes, created_by_user_id, created_at) VALUES (?, 'rollback_channel_export_clear', ?, ?, ?, CURRENT_TIMESTAMP)`).bind(channel, count, clean(body.notes || 'Cleared whole-channel marketplace selections.', 800), Number(adminUser.user_id || 0) || null).run().catch(() => null);
    return json({ ok: true, message: `Cleared ${count} saved image selection(s) for this marketplace channel.`, channel, affected_count: count });
  }
  if (action === 'rollback_selection') {
    if (!productId) return json({ ok: false, error: 'product_id is required for rollback.' }, 400);
    await db.prepare(`DELETE FROM marketplace_export_image_selections WHERE channel = ? AND product_id = ?`).bind(channel, productId).run();
    await db.prepare(`INSERT INTO marketplace_export_replay_events (channel, action_kind, affected_count, notes, created_by_user_id, created_at) VALUES (?, 'rollback_selection', 1, ?, ?, CURRENT_TIMESTAMP)`).bind(channel, clean(body.notes || `Rolled back image selection for product ${productId}.`, 800), Number(adminUser.user_id || 0) || null).run().catch(() => null);
    return json({ ok: true, message: 'Marketplace image selection rolled back to automatic role order.', channel, product_id: productId });
  }
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  const urls = Array.isArray(body.selected_image_urls) ? body.selected_image_urls.map((url) => clean(url, 1200)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
  const ids = Array.isArray(body.selected_product_image_ids) ? body.selected_product_image_ids.map((id) => Number(id || 0)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
  await db.prepare(`INSERT INTO marketplace_export_image_selections (channel, product_id, selected_image_urls_json, selected_product_image_ids_json, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, product_id) DO UPDATE SET selected_image_urls_json = excluded.selected_image_urls_json, selected_product_image_ids_json = excluded.selected_product_image_ids_json, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP`).bind(channel, productId, JSON.stringify(urls), JSON.stringify(ids), clean(body.notes || '', 800), Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: 'Marketplace image selection saved.', channel, product_id: productId, selected_image_urls: urls });
}
