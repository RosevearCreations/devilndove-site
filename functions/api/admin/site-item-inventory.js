// File: /functions/api/admin/site-item-inventory.js
// Build 244: D1 catalog authority, editable tool/supply classification, fractional usage and log-only material tracking.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { recordInventoryCostHistory } from "./_inventoryCostHistory.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

function normalizeInventoryKind(value, fallback = 'other') {
  const kind = normalizeText(value).toLowerCase();
  return ['tool', 'supply', 'product', 'other'].includes(kind) ? kind : fallback;
}
function normalizeUsageTrackingMode(value, fallback = 'exact') {
  const mode = normalizeText(value).toLowerCase();
  return ['exact', 'estimated', 'log_only', 'reusable'].includes(mode) ? mode : fallback;
}
async function saveUsageProfile(db, siteItemInventoryId, { usage_tracking_mode = 'exact', minimum_usage_increment = 0.001, notes = '', user_id = null } = {}) {
  const id = Number(siteItemInventoryId || 0);
  if (!id) return;
  const mode = normalizeUsageTrackingMode(usage_tracking_mode, 'exact');
  const increment = Math.max(0.0001, Number(minimum_usage_increment || 0.001) || 0.001);
  await db.prepare(`
    INSERT INTO site_inventory_usage_profiles (
      site_item_inventory_id, usage_tracking_mode, minimum_usage_increment, notes, updated_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(site_item_inventory_id) DO UPDATE SET
      usage_tracking_mode=excluded.usage_tracking_mode,
      minimum_usage_increment=excluded.minimum_usage_increment,
      notes=excluded.notes,
      updated_by_user_id=excluded.updated_by_user_id,
      updated_at=CURRENT_TIMESTAMP
  `).bind(id, mode, increment, normalizeText(notes) || null, Number(user_id || 0) || null).run();
}
async function logUsageMovement(db, payload = {}) {
  await db.prepare(`
    INSERT INTO site_inventory_usage_movements (
      site_inventory_movement_id, site_item_inventory_id, usage_quantity_delta, usage_unit_label,
      stock_quantity_delta, stock_unit_label, tracking_mode, is_estimated, note, actor_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    Number(payload.site_inventory_movement_id || 0) || null,
    Number(payload.site_item_inventory_id || 0),
    Number(payload.usage_quantity_delta || 0),
    normalizeText(payload.usage_unit_label).toLowerCase() || 'unit',
    Number(payload.stock_quantity_delta || 0),
    normalizeText(payload.stock_unit_label).toLowerCase() || 'unit',
    normalizeUsageTrackingMode(payload.tracking_mode, 'exact'),
    Number(payload.is_estimated) === 1 ? 1 : 0,
    normalizeText(payload.note) || null,
    Number(payload.actor_user_id || 0) || null
  ).run().catch(() => null);
}

async function saveInventoryProfile(db, siteItemInventoryId, body = {}, userId = null, sourceType = 'other') {
  const id = Number(siteItemInventoryId || 0); if (!id) return;
  const allowedClass = new Set(['raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other']);
  const requestedClass = normalizeText(body.inventory_class).toLowerCase();
  const inventoryClass = allowedClass.has(requestedClass) ? requestedClass : (sourceType === 'tool' ? 'reusable_equipment' : 'consumable');
  const allowedLifecycle = new Set(['stocked','consumable','reusable','kit','nonstock','retired']);
  const requestedLifecycle = normalizeText(body.lifecycle_mode).toLowerCase();
  const lifecycleMode = allowedLifecycle.has(requestedLifecycle) ? requestedLifecycle : (inventoryClass === 'kit' ? 'kit' : (sourceType === 'tool' ? 'reusable' : 'consumable'));
  await db.prepare(`INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,lot_tracking_recommended,expiry_tracking_recommended,source_material_recommended,notes,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET inventory_class=excluded.inventory_class,lifecycle_mode=excluded.lifecycle_mode,lot_tracking_recommended=excluded.lot_tracking_recommended,expiry_tracking_recommended=excluded.expiry_tracking_recommended,source_material_recommended=excluded.source_material_recommended,notes=excluded.notes,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(id,inventoryClass,lifecycleMode,Number(body.lot_tracking_recommended)===1?1:0,Number(body.expiry_tracking_recommended)===1?1:0,Number(body.source_material_recommended)===1?1:0,normalizeText(body.inventory_profile_notes)||null,Number(userId||0)||null).run().catch(()=>null);
}

async function saveItemDescription(db, siteItemInventoryId, description, userId = null) {
  const clean = normalizeText(description).slice(0, 600);
  if (!siteItemInventoryId) return;
  await db.prepare(`
    INSERT INTO site_inventory_item_descriptions (
      site_item_inventory_id, item_description, updated_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(site_item_inventory_id) DO UPDATE SET
      item_description = excluded.item_description,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(Number(siteItemInventoryId), clean, Number(userId || 0) || null).run().catch(() => null);
}


function packagingKeyPart(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'source';
}

async function persistPackagingSourceDraft(db, siteItemInventoryId, body = {}, userId = null) {
  const inventoryId = Number(siteItemInventoryId || 0);
  const draft = body?.packaging_source_draft;
  if (!inventoryId || Number(body?.source_material_recommended) !== 1 || !draft || typeof draft !== 'object') return null;
  const materialName = normalizeText(draft.material_name || draft.supplier_product_name || body.item_name).slice(0, 220);
  if (!materialName) return null;

  // Never overwrite a source record that may already contain owner/supplier-reviewed INCI data.
  const linked = await db.prepare(`SELECT packaging_source_material_template_id FROM inventory_source_material_links WHERE site_item_inventory_id=? ORDER BY inventory_source_material_link_id LIMIT 1`).bind(inventoryId).first().catch(() => null);
  if (linked?.packaging_source_material_template_id) return Number(linked.packaging_source_material_template_id);

  const subtype = normalizeText(draft.material_subtype || 'other').toLowerCase() || 'other';
  const productFamily = normalizeText(draft.product_family || 'general').toLowerCase() || 'general';
  const coreType = subtype === 'soap_base' ? 'soap_base' : (['fragrance_oil','essential_oil_blend'].includes(subtype) ? 'fragrance_oil' : (['colourant','colourant_dye','mica','mica_pigment'].includes(subtype) ? 'colourant' : 'additive'));
  const defaultRole = ['soap_base','candle_wax','wax_blend'].includes(subtype) ? 'base' : (['fragrance_oil','essential_oil_blend'].includes(subtype) ? 'fragrance' : (['colourant','colourant_dye','mica','mica_pigment'].includes(subtype) ? 'colourant' : 'additive'));
  const linkRole = subtype === 'soap_base' ? 'soap_base' : (defaultRole === 'base' ? 'source_material' : defaultRole);
  const intended = ['rinse_off','leave_on','both','not_applicable'].includes(normalizeText(draft.intended_use).toLowerCase()) ? normalizeText(draft.intended_use).toLowerCase() : 'not_applicable';
  const fragranceReview = ['not_applicable','needs_supplier_data','needs_review','reviewed'].includes(normalizeText(draft.fragrance_allergen_review_status).toLowerCase()) ? normalizeText(draft.fragrance_allergen_review_status).toLowerCase() : 'not_applicable';
  const materialKey = `inventory-${inventoryId}-${packagingKeyPart(materialName)}`;
  const masterInci = Array.isArray(draft.master_inci) ? draft.master_inci.slice(0, 120) : [];
  const benefits = Array.isArray(draft.benefits) ? draft.benefits.slice(0, 30) : [];
  const supplierClaims = Array.isArray(draft.supplier_claims) ? draft.supplier_claims.slice(0, 30) : [];
  const fragranceAllergens = Array.isArray(draft.fragrance_allergens) ? draft.fragrance_allergens.slice(0, 120) : [];

  const inserted = await db.prepare(`INSERT INTO packaging_source_material_templates (
      material_key,material_name,material_type,supplier_name,supplier_sku,supplier_product_name,source_url,source_image_url,supplier_document_url,source_reference,intended_use,
      ingredient_declaration_raw,master_inci_json,allergen_statement,fragrance_allergens_json,fragrance_allergen_review_status,benefits_json,supplier_claims_json,usage_notes,compliance_notes,
      verification_status,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(materialKey,materialName,coreType,normalizeText(draft.supplier_name || body.supplier_name)||null,normalizeText(draft.supplier_sku || body.supplier_sku)||null,normalizeText(draft.supplier_product_name || materialName)||null,normalizeText(draft.source_url || body.source_url || body.amazon_url)||null,normalizeText(draft.source_image_url || body.image_url)||null,normalizeText(draft.supplier_document_url)||null,'Captured during Inventory source review; reuse in Packaging Studio before any external re-import.',intended,normalizeText(draft.ingredient_declaration_raw)||null,JSON.stringify(masterInci),normalizeText(draft.allergen_statement)||null,JSON.stringify(fragranceAllergens),fragranceReview,JSON.stringify(benefits),JSON.stringify(supplierClaims),normalizeText(draft.usage_notes)||null,normalizeText(draft.compliance_notes)||null,'needs_review',Number(userId||0)||null,Number(userId||0)||null).run().catch(() => null);
  const sourceId = Number(inserted?.meta?.last_row_id || 0);
  if (!sourceId) return null;
  await db.prepare(`INSERT INTO packaging_source_material_metadata(packaging_source_material_template_id,product_family,material_subtype,default_role,colour_hex,created_at,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_source_material_template_id) DO UPDATE SET product_family=excluded.product_family,material_subtype=excluded.material_subtype,default_role=excluded.default_role,colour_hex=excluded.colour_hex,updated_at=CURRENT_TIMESTAMP`).bind(sourceId,productFamily,subtype,defaultRole,normalizeText(draft.colour_hex)||null).run().catch(()=>null);
  await db.prepare(`INSERT INTO inventory_source_material_links(site_item_inventory_id,packaging_source_material_template_id,link_role,notes,created_by_user_id,created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id,packaging_source_material_template_id,link_role) DO UPDATE SET notes=excluded.notes`).bind(inventoryId,sourceId,linkRole,'Created from source metadata already reviewed during Inventory entry.',Number(userId||0)||null).run().catch(()=>null);
  return sourceId;
}

function shape(row = {}) {
  const onHand = Number(row.on_hand_quantity || 0);
  const reserved = Number(row.reserved_quantity || 0);
  const incoming = Number(row.incoming_quantity || 0);
  const reorder = Number(row.reorder_level || 0);

  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: row.source_type || '',
    external_key: row.external_key || '',
    item_name: row.item_name || '',
    item_description: row.item_description || '',
    category: row.category || '',
    source_url: row.source_url || '',
    amazon_url: row.amazon_url || '',
    image_url: row.image_url || '',
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: Math.max(0, onHand - reserved),
    reorder_level: reorder,
    unit_cost_cents: Number(row.unit_cost_cents || 0),
    unit_cost_dollars: (Number(row.unit_cost_cents || 0) / 100).toFixed(2),
    stock_unit_label: row.stock_unit_label || 'unit',
    usage_unit_label: row.usage_unit_label || 'unit',
    usage_units_per_stock_unit: Math.max(0.001, Number(row.usage_units_per_stock_unit || 1) || 1),
    usage_tracking_mode: normalizeUsageTrackingMode(row.usage_tracking_mode, normalizeInventoryKind(row.source_type) === 'tool' ? 'reusable' : 'exact'),
    minimum_usage_increment: Math.max(0.0001, Number(row.minimum_usage_increment || 0.001) || 0.001),
    supplier_name: row.supplier_name || '',
    supplier_sku: row.supplier_sku || '',
    supplier_contact: row.supplier_contact || '',
    reorder_notes: row.reorder_notes || '',
    preferred_reorder_quantity: Number(row.preferred_reorder_quantity || 0),
    is_on_reorder_list: Number(row.is_on_reorder_list || 0),
    do_not_reorder: Number(row.do_not_reorder || 0),
    do_not_reuse: Number(row.do_not_reuse || 0),
    reuse_status: row.reuse_status || '',
    reservation_notes: row.reservation_notes || '',
    last_reorder_requested_at: row.last_reorder_requested_at || null,
    last_counted_at: row.last_counted_at || null,
    needs_reorder: reorder > 0 && (onHand + incoming) <= reorder ? 1 : 0,
    is_active: Number(row.is_active || 0),
    linked_product_count: Number(row.linked_product_count || 0),
    linked_product_names: row.linked_product_names || '',
    inventory_class: row.inventory_class || (normalizeInventoryKind(row.source_type) === 'tool' ? 'reusable_equipment' : 'consumable'),
    lifecycle_mode: row.lifecycle_mode || (normalizeInventoryKind(row.source_type) === 'tool' ? 'reusable' : 'consumable'),
    lot_tracking_recommended: Number(row.lot_tracking_recommended || 0),
    expiry_tracking_recommended: Number(row.expiry_tracking_recommended || 0),
    source_material_recommended: Number(row.source_material_recommended || 0),
    inventory_profile_notes: row.inventory_profile_notes || '',
    updated_at: row.updated_at || null
  };
}

function normalizeMovementType(value) {
  const raw = normalizeText(value).toLowerCase();
  const map = {
    receive: 'incoming',
    received: 'incoming',
    reorder_request: 'incoming',
    reservation_add: 'reserve',
    reservation_release: 'release',
    consume: 'adjustment',
    update: 'adjustment',
    sync: 'adjustment'
  };
  const mapped = map[raw] || raw || 'adjustment';
  return ['create', 'adjustment', 'reserve', 'release', 'incoming', 'delete', 'correction'].includes(mapped) ? mapped : 'adjustment';
}

async function logMovement(db, payload = {}) {
  const originalMovementType = normalizeText(payload.movement_type || 'adjustment').toLowerCase();
  const movementType = normalizeMovementType(originalMovementType);
  const note = [
    payload.note || null,
    movementType !== originalMovementType ? `Original action: ${originalMovementType}.` : null
  ].filter(Boolean).join(' ');

  const result = await db.prepare(`
    INSERT INTO site_inventory_movements (
      site_item_inventory_id, source_type, external_key, item_name, movement_type,
      quantity_delta, previous_on_hand_quantity, new_on_hand_quantity,
      previous_reserved_quantity, new_reserved_quantity,
      previous_incoming_quantity, new_incoming_quantity,
      note, actor_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    payload.site_item_inventory_id || null,
    payload.source_type || null,
    payload.external_key || null,
    payload.item_name || null,
    movementType,
    Number(payload.quantity_delta || 0),
    Number(payload.previous_on_hand_quantity || 0),
    Number(payload.new_on_hand_quantity || 0),
    Number(payload.previous_reserved_quantity || 0),
    Number(payload.new_reserved_quantity || 0),
    Number(payload.previous_incoming_quantity || 0),
    Number(payload.new_incoming_quantity || 0),
    note || null,
    payload.actor_user_id || null
  ).run().catch(() => null);
  return Number(result?.meta?.last_row_id || 0);
}

async function getItems(db, { q = '', stockView = '', includeHistory = false, page = 1, pageSize = 80 } = {}) {
  const safePage = Math.max(1, Number(page || 1) || 1);
  const safePageSize = Math.max(25, Math.min(150, Number(pageSize || 80) || 80));
  const offset = (safePage - 1) * safePageSize;
  const like = `%${q}%`;
  const filterBinds = [q, like, like, like, like, like, stockView, stockView, stockView, stockView, stockView, stockView, stockView];
  const filterSql = `
    (
      ? = ''
      OR LOWER(COALESCE(sii.item_name, '')) LIKE ?
      OR LOWER(COALESCE(sii.category, '')) LIKE ?
      OR LOWER(COALESCE(siid.item_description, '')) LIKE ?
      OR LOWER(COALESCE(sii.supplier_name, '')) LIKE ?
      OR LOWER(COALESCE(sii.supplier_sku, '')) LIKE ?
    )
    AND (
      ? = ''
      OR (? = 'low' AND (COALESCE(sii.on_hand_quantity, 0) + COALESCE(sii.incoming_quantity, 0)) <= COALESCE(sii.reorder_level, 0))
      OR (? = 'reorder' AND COALESCE(sii.is_on_reorder_list, 0) = 1)
      OR (? = 'no_reuse' AND COALESCE(sii.do_not_reuse, 0) = 1)
      OR (? = 'inactive' AND COALESCE(sii.is_active, 1) = 0)
      OR (? = 'tool' AND LOWER(TRIM(COALESCE(sii.source_type,''))) = 'tool')
      OR (? = 'supply' AND LOWER(TRIM(COALESCE(sii.source_type,''))) = 'supply')
    )`;

  const summaryRow = await db.prepare(`
    SELECT
      COUNT(*) AS total_items,
      SUM(CASE WHEN COALESCE(sii.is_active,1)=1 THEN 1 ELSE 0 END) AS active_items,
      SUM(CASE WHEN (COALESCE(sii.on_hand_quantity,0)+COALESCE(sii.incoming_quantity,0)) <= COALESCE(sii.reorder_level,0) THEN 1 ELSE 0 END) AS low_stock_items,
      COALESCE(SUM(COALESCE(sii.reserved_quantity,0)),0) AS total_reserved,
      COALESCE(SUM(COALESCE(sii.incoming_quantity,0)),0) AS total_incoming,
      SUM(CASE WHEN COALESCE(sii.is_on_reorder_list,0)=1 THEN 1 ELSE 0 END) AS reorder_list_items
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_item_descriptions siid ON siid.site_item_inventory_id=sii.site_item_inventory_id
    WHERE ${filterSql}
  `).bind(...filterBinds).first().catch(() => null);

  const items = normalizeResults(await db.prepare(`
    WITH link_stats AS (
      SELECT prl.resource_kind, prl.source_key,
             COUNT(DISTINCT prl.product_id) AS linked_product_count,
             GROUP_CONCAT(DISTINCT p.name) AS linked_product_names
      FROM product_resource_links prl
      LEFT JOIN products p ON p.product_id=prl.product_id
      GROUP BY prl.resource_kind,prl.source_key
    )
    SELECT sii.*,COALESCE(siid.item_description,'') AS item_description,
           COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
           COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
           COALESCE(ls.linked_product_count,0) AS linked_product_count,
           COALESCE(ls.linked_product_names,'') AS linked_product_names,
           COALESCE(iip.inventory_class,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable_equipment' ELSE 'consumable' END) AS inventory_class,
           COALESCE(iip.lifecycle_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'consumable' END) AS lifecycle_mode,
           COALESCE(iip.lot_tracking_recommended,0) AS lot_tracking_recommended,COALESCE(iip.expiry_tracking_recommended,0) AS expiry_tracking_recommended,COALESCE(iip.source_material_recommended,0) AS source_material_recommended,COALESCE(iip.notes,'') AS inventory_profile_notes
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_item_descriptions siid ON siid.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN link_stats ls ON ls.resource_kind=sii.source_type AND ls.source_key=sii.external_key
    WHERE ${filterSql}
    ORDER BY LOWER(COALESCE(sii.item_name,'')) ASC,sii.site_item_inventory_id ASC
    LIMIT ? OFFSET ?
  `).bind(...filterBinds, safePageSize, offset).all().catch(() => ({ results: [] })));

  const totalItems = Number(summaryRow?.total_items || 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const summary = {
    total_items: totalItems,
    active_items: Number(summaryRow?.active_items || 0),
    low_stock_items: Number(summaryRow?.low_stock_items || 0),
    total_reserved: Number(summaryRow?.total_reserved || 0),
    total_incoming: Number(summaryRow?.total_incoming || 0),
    reorder_list_items: Number(summaryRow?.reorder_list_items || 0)
  };

  const movements = includeHistory
    ? normalizeResults(await db.prepare(`
        SELECT site_inventory_movement_id,site_item_inventory_id,source_type,external_key,item_name,movement_type,
               quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
               previous_incoming_quantity,new_incoming_quantity,note,created_at
        FROM site_inventory_movements
        ORDER BY created_at DESC,site_inventory_movement_id DESC LIMIT 50
      `).all().catch(() => ({ results: [] }))) : [];

  return {
    items: items.map(shape),
    summary,
    movements,
    supplier_reorder_groups: [],
    pagination: {
      page: Math.min(safePage,totalPages),
      page_size: safePageSize,
      total_items: totalItems,
      total_pages: totalPages,
      has_previous: safePage > 1,
      has_next: safePage < totalPages
    }
  };
}

async function adjustProductResourceReservations(db, { productId = 0, quantityMultiplier = 1, release = false, note = '', actorUserId = null } = {}) {
  const links = normalizeResults(await db.prepare(`
    SELECT
      prl.product_resource_link_id,
      prl.resource_kind,
      prl.source_key,
      COALESCE(prl.quantity_used, 0) AS quantity_used,
      COALESCE(prl.consumption_mode, 'per_unit') AS consumption_mode,
      COALESCE(prl.lot_size_units, 1) AS lot_size_units,
      sii.site_item_inventory_id,
      sii.item_name,
      sii.source_type,
      sii.external_key,
      COALESCE(sii.on_hand_quantity, 0) AS on_hand_quantity,
      COALESCE(sii.reserved_quantity, 0) AS reserved_quantity,
      COALESCE(sii.incoming_quantity, 0) AS incoming_quantity,
      COALESCE(sii.reservation_notes, '') AS reservation_notes,
      COALESCE(NULLIF(sii.usage_unit_label, ''), 'unit') AS usage_unit_label,
      COALESCE(NULLIF(sii.usage_units_per_stock_unit, 0), 1) AS usage_units_per_stock_unit,
      COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii
      ON sii.source_type = prl.resource_kind
     AND sii.external_key = prl.source_key
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id = sii.site_item_inventory_id
    WHERE prl.product_id = ?
    ORDER BY prl.sort_order ASC, prl.product_resource_link_id ASC
  `).bind(productId).all().catch(() => ({ results: [] })));

  const results = [];

  for (const link of links) {
    const requiredQty = Math.max(0, Number(link.quantity_used || 0) * Math.max(1, Number(quantityMultiplier || 1)));
    const usagePerStock = Math.max(0.001, Number(link.usage_units_per_stock_unit || 1) || 1);
    const stockRequired = requiredQty / usagePerStock;
    const trackingMode = normalizeUsageTrackingMode(link.usage_tracking_mode, link.resource_kind === 'tool' ? 'reusable' : 'exact');
    const consumptionMode = String(link.consumption_mode || 'per_unit').toLowerCase();

    if (!link.site_item_inventory_id) {
      results.push({
        ok: false,
        missing_inventory: true,
        resource_kind: link.resource_kind,
        source_key: link.source_key,
        required_quantity: requiredQty,
        note: 'Inventory item not linked.'
      });
      continue;
    }

    if (consumptionMode === 'story_only' || consumptionMode === 'end_of_lot' || ['log_only','reusable'].includes(trackingMode)) {
      results.push({
        ok: true,
        skipped_reservation: true,
        site_item_inventory_id: Number(link.site_item_inventory_id || 0),
        source_type: link.source_type || link.resource_kind || '',
        external_key: link.external_key || link.source_key || '',
        item_name: link.item_name || '',
        required_quantity: requiredQty,
        stock_quantity_required: stockRequired,
        usage_unit_label: link.usage_unit_label || 'unit',
        usage_units_per_stock_unit: Math.max(0.001, Number(link.usage_units_per_stock_unit || 1) || 1),
        consumption_mode: consumptionMode
      });
      continue;
    }

    const previousReserved = Number(link.reserved_quantity || 0);
    const newReserved = Math.max(0, previousReserved + (release ? -stockRequired : stockRequired));

    await db.prepare(`
      UPDATE site_item_inventory
      SET reserved_quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(newReserved, Number(link.site_item_inventory_id || 0)).run();

    await logMovement(db, {
      site_item_inventory_id: Number(link.site_item_inventory_id || 0),
      source_type: link.source_type || link.resource_kind || '',
      external_key: link.external_key || link.source_key || '',
      item_name: link.item_name || '',
      movement_type: release ? 'reservation_release' : 'reservation_add',
      quantity_delta: 0,
      previous_on_hand_quantity: Number(link.on_hand_quantity || 0),
      new_on_hand_quantity: Number(link.on_hand_quantity || 0),
      previous_reserved_quantity: previousReserved,
      new_reserved_quantity: newReserved,
      previous_incoming_quantity: Number(link.incoming_quantity || 0),
      new_incoming_quantity: Number(link.incoming_quantity || 0),
      note: note || (release ? `Released reservation for product ${productId}.` : `Reserved for product ${productId}.`),
      actor_user_id: actorUserId || null
    });

    results.push({
      ok: true,
      skipped_reservation: false,
      site_item_inventory_id: Number(link.site_item_inventory_id || 0),
      source_type: link.source_type || link.resource_kind || '',
      external_key: link.external_key || link.source_key || '',
      item_name: link.item_name || '',
      required_quantity: requiredQty,
      stock_quantity_required: stockRequired,
      previous_reserved_quantity: previousReserved,
      new_reserved_quantity: newReserved,
      consumption_mode: consumptionMode
    });
  }

  return results;
}


async function runInventoryItemAction(db, { siteItemInventoryId = 0, action = '', quantity = 0, note = '', actorUserId = null } = {}) {
  const id = Number(siteItemInventoryId || 0);
  const qty = Math.max(0, Number(quantity || 0));
  if (!id) throw new Error('site_item_inventory_id is required.');
  if (!qty) throw new Error('A quantity greater than zero is required.');

  const existing = await db.prepare(`
    SELECT sii.*, COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id = ? LIMIT 1
  `).bind(id).first();
  if (!existing) throw new Error('Inventory item not found.');

  const previousOnHand = Number(existing.on_hand_quantity || 0);
  const previousReserved = Number(existing.reserved_quantity || 0);
  const previousIncoming = Number(existing.incoming_quantity || 0);
  let newOnHand = previousOnHand;
  let newReserved = previousReserved;
  let newIncoming = previousIncoming;
  let movementType = action || 'adjustment';
  let quantityDelta = 0;
  let auditDetails = { quantity: qty };

  switch (String(action || '').toLowerCase()) {
    case 'receive':
      newOnHand = previousOnHand + qty;
      newIncoming = Math.max(0, previousIncoming - qty);
      movementType = 'receive';
      quantityDelta = qty;
      break;
    case 'reserve':
      newReserved = previousReserved + qty;
      movementType = 'reserve';
      quantityDelta = 0;
      break;
    case 'release':
      newReserved = Math.max(0, previousReserved - qty);
      movementType = 'release';
      quantityDelta = 0;
      break;
    case 'consume_usage': {
      const trackingMode = normalizeUsageTrackingMode(existing.usage_tracking_mode, normalizeInventoryKind(existing.source_type) === 'tool' ? 'reusable' : 'exact');
      const perStock = Math.max(0.001, Number(existing.usage_units_per_stock_unit || 1) || 1);
      const stockQty = qty / perStock;
      if (trackingMode === 'reusable' || trackingMode === 'log_only') {
        newOnHand = previousOnHand;
        quantityDelta = 0;
      } else {
        newOnHand = Math.max(0, previousOnHand - stockQty);
        quantityDelta = newOnHand - previousOnHand;
      }
      movementType = 'consume';
      auditDetails = { quantity: qty, usage_quantity: qty, usage_unit_label: existing.usage_unit_label || 'unit', stock_quantity_delta: quantityDelta, stock_unit_label: existing.stock_unit_label || 'unit', tracking_mode: trackingMode, estimated: trackingMode === 'estimated' };
      break;
    }
    case 'consume':
      newOnHand = Math.max(0, previousOnHand - qty);
      movementType = 'consume';
      quantityDelta = -qty;
      break;
    case 'reorder_request':
      newIncoming = previousIncoming + qty;
      movementType = 'reorder_request';
      quantityDelta = 0;
      auditDetails.requested_incoming_quantity = qty;
      break;
    default:
      throw new Error('Unsupported inventory action.');
  }

  await db.prepare(`
    UPDATE site_item_inventory
    SET on_hand_quantity = ?, reserved_quantity = ?, incoming_quantity = ?,
        is_on_reorder_list = CASE WHEN ? = 'reorder_request' THEN 1 ELSE is_on_reorder_list END,
        last_reorder_requested_at = CASE WHEN ? = 'reorder_request' THEN CURRENT_TIMESTAMP ELSE last_reorder_requested_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE site_item_inventory_id = ?
  `).bind(
    newOnHand,
    newReserved,
    newIncoming,
    String(action || '').toLowerCase(),
    String(action || '').toLowerCase(),
    id
  ).run();

  const movementId = await logMovement(db, {
    site_item_inventory_id: id,
    source_type: existing.source_type || null,
    external_key: existing.external_key || null,
    item_name: existing.item_name || null,
    movement_type: movementType,
    quantity_delta: quantityDelta,
    previous_on_hand_quantity: previousOnHand,
    new_on_hand_quantity: newOnHand,
    previous_reserved_quantity: previousReserved,
    new_reserved_quantity: newReserved,
    previous_incoming_quantity: previousIncoming,
    new_incoming_quantity: newIncoming,
    note: note || `Inventory ${movementType}.`,
    actor_user_id: actorUserId || null
  });

  if (String(action || '').toLowerCase() === 'consume_usage') {
    await logUsageMovement(db, {
      site_inventory_movement_id: movementId,
      site_item_inventory_id: id,
      usage_quantity_delta: -qty,
      usage_unit_label: existing.usage_unit_label || 'unit',
      stock_quantity_delta: quantityDelta,
      stock_unit_label: existing.stock_unit_label || 'unit',
      tracking_mode: auditDetails.tracking_mode || 'exact',
      is_estimated: auditDetails.estimated ? 1 : 0,
      note: note || `Recorded ${qty} ${existing.usage_unit_label || 'unit'} used.`,
      actor_user_id: actorUserId
    });
  }

  const saved = await db.prepare(`
    SELECT sii.*,
           COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
           COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=? LIMIT 1
  `).bind(id).first();
  return {
    item: shape(saved || {}),
    audit_details: {
      ...auditDetails,
      previous_on_hand_quantity: previousOnHand,
      new_on_hand_quantity: newOnHand,
      previous_reserved_quantity: previousReserved,
      new_reserved_quantity: newReserved,
      previous_incoming_quantity: previousIncoming,
      new_incoming_quantity: newIncoming
    },
    existing
  };
}

async function handleGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const payload = await getItems(db, {
    q: normalizeText(url.searchParams.get('q')).toLowerCase(),
    stockView: normalizeText(url.searchParams.get('stock_view')).toLowerCase(),
    includeHistory: ['1', 'true', 'yes'].includes(String(url.searchParams.get('include_history') || '').toLowerCase()),
    page: Math.max(1, Number(url.searchParams.get('page') || 1) || 1),
    pageSize: Math.max(25, Math.min(150, Number(url.searchParams.get('page_size') || 80) || 80))
  });

  return json({ ok: true, ...payload });
}



async function syncCatalogItemsIntoInventory(db, { sourceTypes = [], cursor = 0, limit = 80, actorUserId = null } = {}) {
  // Build 244: D1 catalog_items is the authority. Reconciliation is intentionally
  // lightweight and bounded; Amazon enrichment belongs to the one-item preview path.
  const normalizedTypes = [...new Set((Array.isArray(sourceTypes) ? sourceTypes : [])
    .map((value) => normalizeInventoryKind(value, ''))
    .filter((value) => ['tool', 'supply'].includes(value))
  )];
  const requestedTypes = normalizedTypes.length ? normalizedTypes : ['tool', 'supply'];
  const placeholders = requestedTypes.map(() => '?').join(', ');
  const safeCursor = Math.max(0, Number(cursor || 0) || 0);
  const safeLimit = Math.max(10, Math.min(100, Number(limit || 80) || 80));

  const rows = normalizeResults(await db.prepare(`
    SELECT catalog_item_id,item_kind,source_key,name,category,subcategory,image_url,amazon_url,
           quantity_on_hand,reorder_point,notes
    FROM catalog_items
    WHERE item_kind IN (${placeholders})
      AND COALESCE(status,'active') != 'archived'
    ORDER BY item_kind ASC, catalog_item_id ASC
    LIMIT ? OFFSET ?
  `).bind(...requestedTypes, safeLimit, safeCursor).all());

  const summary = {
    requested_types: requestedTypes,
    scanned: rows.length,
    synced: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    with_amazon_url: 0,
    with_unit_cost: 0,
    cost_history_added: 0,
    defaulted_on_hand_to_one: 0,
    errors: [],
    cursor: safeCursor,
    next_cursor: rows.length === safeLimit ? safeCursor + rows.length : null,
    done: rows.length < safeLimit
  };

  for (const row of rows) {
    const sourceType = normalizeInventoryKind(row.item_kind, '');
    const externalKey = normalizeText(row.source_key);
    const itemName = normalizeText(row.name) || externalKey;
    if (!['tool','supply'].includes(sourceType) || !externalKey || !itemName) { summary.skipped += 1; continue; }
    if (normalizeText(row.amazon_url)) summary.with_amazon_url += 1;
    try {
      const existing = await db.prepare(`
        SELECT site_item_inventory_id,item_name,category,source_url,amazon_url,image_url,on_hand_quantity,reorder_level,is_active
        FROM site_item_inventory WHERE LOWER(TRIM(source_type))=? AND external_key=? ORDER BY COALESCE(is_active,1) DESC, site_item_inventory_id ASC LIMIT 1
      `).bind(sourceType, externalKey).first();

      if (existing?.site_item_inventory_id && Number(existing.is_active ?? 1) === 0) {
        // An owner/archive decision must not be silently reversed by maintenance reconciliation.
        summary.skipped += 1;
        continue;
      }
      if (existing?.site_item_inventory_id) {
        await db.prepare(`
          UPDATE site_item_inventory
          SET item_name=COALESCE(NULLIF(?,''),item_name),
              category=COALESCE(NULLIF(?,''),category),
              source_url=CASE WHEN COALESCE(source_url,'')='' THEN ? ELSE source_url END,
              amazon_url=CASE WHEN COALESCE(amazon_url,'')='' THEN ? ELSE amazon_url END,
              image_url=CASE WHEN COALESCE(image_url,'')='' THEN ? ELSE image_url END,
              is_active=1,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
          WHERE site_item_inventory_id=?
        `).bind(
          itemName,
          normalizeText(row.category || row.subcategory).toLowerCase() || null,
          normalizeText(row.amazon_url) || null,
          normalizeText(row.amazon_url) || null,
          normalizeText(row.image_url) || null,
          Number(existing.site_item_inventory_id)
        ).run();
        summary.updated += 1;
      } else {
        const initialOnHand = Math.max(0, Number(row.quantity_on_hand || 0) || 0);
        const initialReorder = Math.max(0, Number(row.reorder_point || 0) || 0);
        const insert = await db.prepare(`
          INSERT INTO site_item_inventory (
            source_type,external_key,item_name,category,source_url,amazon_url,image_url,
            on_hand_quantity,reserved_quantity,incoming_quantity,reorder_level,unit_cost_cents,
            stock_unit_label,usage_unit_label,usage_units_per_stock_unit,reorder_notes,is_active,
            last_seen_at,created_at,updated_at
          ) VALUES (?,?,?,?,?,?,?, ?,0,0,?,0, ?,?,1,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        `).bind(
          sourceType, externalKey, itemName,
          normalizeText(row.category || row.subcategory).toLowerCase() || null,
          normalizeText(row.amazon_url) || null,
          normalizeText(row.amazon_url) || null,
          normalizeText(row.image_url) || null,
          initialOnHand, initialReorder,
          sourceType === 'tool' ? 'tool' : 'package',
          sourceType === 'tool' ? 'use' : 'unit',
          normalizeText(row.notes) || null
        ).run();
        const newId = Number(insert?.meta?.last_row_id || 0);
        if (newId) await saveUsageProfile(db,newId,{ usage_tracking_mode: sourceType === 'tool' ? 'reusable' : 'log_only', minimum_usage_increment: 0.001, notes: sourceType === 'tool' ? 'D1 catalog reconciliation: reusable default.' : 'D1 catalog reconciliation: log-only until unit conversion is reviewed.', user_id: actorUserId });
        summary.inserted += 1;
      }
      summary.synced += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ source_type:sourceType,external_key:externalKey,item_name:itemName,error:String(error?.message||error||'Reconciliation failed') });
    }
  }
  return summary;
}

async function handlePost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const action = normalizeText(body.action).toLowerCase();

  if (action === 'sync_catalog') {
    const sourceTypes = Array.isArray(body.source_types) ? body.source_types : [];
    const summary = await syncCatalogItemsIntoInventory(db, { sourceTypes, cursor: body.cursor, limit: body.limit, actorUserId: adminUser.user_id });

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_sync_catalog',
      target_type: 'site_item_inventory',
      details: summary
    });

    return json({ ok: true, ...summary });
  }

  if (action === 'reserve_product_resources') {
    const productId = Number(body.product_id || 0);
    if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);

    const results = await adjustProductResourceReservations(db, {
      productId,
      quantityMultiplier: Math.max(1, Number(body.quantity_multiplier || 1) || 1),
      release: false,
      note: normalizeText(body.note) || '',
      actorUserId: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_reserve_product_resources',
      target_type: 'product',
      target_id: productId,
      details: { results }
    });

    const summary = {
      affected_items: results.filter((row) => row && row.ok && !row.skipped_reservation).length,
      skipped_items: results.filter((row) => row && row.skipped_reservation).length,
      missing_inventory_count: results.filter((row) => row && row.missing_inventory).length,
      failed_items: results.filter((row) => row && row.ok === false).length
    };
    const product = await db.prepare(`SELECT product_id, name FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first().catch(() => null);
    return json({ ok: true, results, summary, product });
  }

  if (action === 'release_product_resources') {
    const productId = Number(body.product_id || 0);
    if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);

    const results = await adjustProductResourceReservations(db, {
      productId,
      quantityMultiplier: Math.max(1, Number(body.quantity_multiplier || 1) || 1),
      release: true,
      note: normalizeText(body.note) || '',
      actorUserId: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_release_product_resources',
      target_type: 'product',
      target_id: productId,
      details: { results }
    });

    const summary = {
      affected_items: results.filter((row) => row && row.ok && !row.skipped_reservation).length,
      skipped_items: results.filter((row) => row && row.skipped_reservation).length,
      missing_inventory_count: results.filter((row) => row && row.missing_inventory).length,
      failed_items: results.filter((row) => row && row.ok === false).length
    };
    const product = await db.prepare(`SELECT product_id, name FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first().catch(() => null);
    return json({ ok: true, results, summary, product });
  }

  if (['receive', 'reserve', 'release', 'consume', 'consume_usage', 'reorder_request'].includes(action)) {
    const siteItemInventoryId = Number(body.site_item_inventory_id || 0);
    const quantity = Math.max(0, Number(body.quantity || 0));
    const note = normalizeText(body.note) || '';
    const result = await runInventoryItemAction(db, {
      siteItemInventoryId,
      action,
      quantity,
      note,
      actorUserId: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, {
      action_type: `inventory_${action}`,
      target_type: 'inventory_item',
      target_id: siteItemInventoryId,
      target_key: `${result.existing?.source_type || ''}:${result.existing?.external_key || ''}`,
      details: result.audit_details
    });

    return json({ ok: true, item: result.item, action, details: result.audit_details });
  }

  const sourceType = normalizeInventoryKind(body.source_type, 'other');
  const externalKey = normalizeText(body.external_key);
  const itemName = normalizeText(body.item_name);

  if (!sourceType || !externalKey || !itemName) {
    return json({ ok: false, error: 'source_type, external_key, and item_name are required.' }, 400);
  }

  try {
    const existingIdentity = await db.prepare(`
      SELECT site_item_inventory_id, item_name, source_type, external_key
      FROM site_item_inventory
      WHERE COALESCE(is_active, 1) = 1
        AND LOWER(TRIM(source_type)) = ?
        AND external_key = ?
      LIMIT 1
    `).bind(sourceType, externalKey).first();
    if (existingIdentity) {
      return json({
        ok: false,
        error: `An active inventory record already exists for ${sourceType}:${externalKey}. Open inventory #${Number(existingIdentity.site_item_inventory_id || 0)} and update it instead of creating a duplicate.`,
        code: 'inventory_identity_exists',
        existing_item: existingIdentity
      }, 409);
    }

    const insert = await db.prepare(`
      INSERT INTO site_item_inventory (
        source_type, external_key, item_name, category, source_url, amazon_url, image_url,
        on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
        stock_unit_label, usage_unit_label, usage_units_per_stock_unit,
        supplier_name, supplier_sku, supplier_contact, reorder_notes, preferred_reorder_quantity,
        is_on_reorder_list, do_not_reorder, do_not_reuse, reuse_status, reservation_notes,
        is_active, last_counted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      sourceType,
      externalKey,
      itemName,
      normalizeText(body.category).toLowerCase() || null,
      normalizeText(body.source_url) || null,
      normalizeText(body.amazon_url) || null,
      normalizeText(body.image_url) || null,
      Math.max(0, Number(body.on_hand_quantity || 0) || 0),
      Number(body.reserved_quantity || 0),
      Number(body.incoming_quantity || 0),
      Number(body.reorder_level || 0),
      Number(body.unit_cost_cents || 0),
      normalizeText(body.stock_unit_label).toLowerCase() || 'unit',
      normalizeText(body.usage_unit_label).toLowerCase() || 'unit',
      Math.max(0.001, Number(body.usage_units_per_stock_unit || 1) || 1),
      normalizeText(body.supplier_name) || null,
      normalizeText(body.supplier_sku) || null,
      normalizeText(body.supplier_contact) || null,
      normalizeText(body.reorder_notes) || null,
      Number(body.preferred_reorder_quantity || 0),
      Number(body.is_on_reorder_list) === 1 ? 1 : 0,
      Number(body.do_not_reorder) === 1 ? 1 : 0,
      Number(body.do_not_reuse) === 1 ? 1 : 0,
      normalizeText(body.reuse_status).toLowerCase() || null,
      normalizeText(body.reservation_notes) || null,
      Number(body.is_active) === 0 ? 0 : 1,
      normalizeText(body.last_counted_at) || null
    ).run();

    const newId = Number(insert?.meta?.last_row_id || 0);
    await saveUsageProfile(db, newId, {
      usage_tracking_mode: body.usage_tracking_mode || (sourceType === 'tool' ? 'reusable' : 'exact'),
      minimum_usage_increment: body.minimum_usage_increment || 0.001,
      notes: body.usage_profile_notes || '',
      user_id: adminUser.user_id
    });
    await saveInventoryProfile(db, newId, body, adminUser.user_id, sourceType);
    const catalogItemId = Number(body.catalog_item_id || 0);
    if (catalogItemId && ['tool','supply'].includes(sourceType)) {
      const catalogRow = await db.prepare(`SELECT catalog_item_id,item_kind,source_key FROM catalog_items WHERE catalog_item_id=? LIMIT 1`).bind(catalogItemId).first().catch(() => null);
      if (catalogRow && catalogRow.item_kind !== sourceType) {
        const conflict = await db.prepare(`SELECT catalog_item_id FROM catalog_items WHERE item_kind=? AND source_key=? AND catalog_item_id<>? LIMIT 1`).bind(sourceType,catalogRow.source_key,catalogItemId).first().catch(() => null);
        if (conflict?.catalog_item_id) {
          await db.prepare(`UPDATE catalog_items SET name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE catalog_item_id=?`).bind(itemName,normalizeText(body.category).toLowerCase() || null,Number(conflict.catalog_item_id)).run().catch(()=>null);
          await db.prepare(`UPDATE catalog_items SET status='archived',visible_public=0,updated_at=CURRENT_TIMESTAMP WHERE catalog_item_id=?`).bind(catalogItemId).run().catch(()=>null);
        } else {
          await db.prepare(`UPDATE catalog_items SET item_kind=?,name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE catalog_item_id=?`).bind(sourceType,itemName,normalizeText(body.category).toLowerCase() || null,catalogItemId).run();
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'item_description')) {
      await saveItemDescription(db, newId, body.item_description, adminUser.user_id);
    }
    await persistPackagingSourceDraft(db, newId, body, adminUser.user_id).catch(() => null);
    const saved = await db.prepare(`
      SELECT sii.*, COALESCE(siid.item_description, '') AS item_description,
             COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
             COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
             COALESCE(iip.inventory_class,CASE WHEN sii.source_type='tool' THEN 'reusable_equipment' ELSE 'consumable' END) AS inventory_class,
             COALESCE(iip.lifecycle_mode,CASE WHEN sii.source_type='tool' THEN 'reusable' ELSE 'consumable' END) AS lifecycle_mode,
             COALESCE(iip.lot_tracking_recommended,0) AS lot_tracking_recommended,COALESCE(iip.expiry_tracking_recommended,0) AS expiry_tracking_recommended,COALESCE(iip.source_material_recommended,0) AS source_material_recommended,COALESCE(iip.notes,'') AS inventory_profile_notes
      FROM site_item_inventory sii
      LEFT JOIN site_inventory_item_descriptions siid
        ON siid.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN site_inventory_usage_profiles siup
        ON siup.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
      WHERE sii.site_item_inventory_id = ?
      LIMIT 1
    `).bind(newId).first();

    await recordInventoryCostHistory(db, {
      site_item_inventory_id: newId,
      source_type: sourceType,
      external_key: externalKey,
      item_name: itemName,
      previous_unit_cost_cents: 0,
      new_unit_cost_cents: Number(body.unit_cost_cents || 0),
      source_kind: 'manual_inventory_create',
      source_id: `${sourceType}:${externalKey}`,
      reason_note: normalizeText(body.movement_note) || 'Inventory item created with unit cost.',
      changed_by_user_id: adminUser.user_id
    }).catch(() => null);

    await logMovement(db, {
      site_item_inventory_id: newId,
      source_type: sourceType,
      external_key: externalKey,
      item_name: itemName,
      movement_type: 'create',
      quantity_delta: Number(body.on_hand_quantity || 0),
      previous_on_hand_quantity: 0,
      new_on_hand_quantity: Number(body.on_hand_quantity || 0),
      previous_reserved_quantity: 0,
      new_reserved_quantity: Number(body.reserved_quantity || 0),
      previous_incoming_quantity: 0,
      new_incoming_quantity: Number(body.incoming_quantity || 0),
      note: normalizeText(body.movement_note) || 'Inventory item created.',
      actor_user_id: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_create',
      target_type: 'inventory_item',
      target_id: newId,
      target_key: `${sourceType}:${externalKey}`,
      details: { item_name: itemName }
    });

    return json({ ok: true, item: shape(saved || {}) }, 201);
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'inventory',
      incident_code: 'inventory_create_failed',
      severity: 'error',
      message: 'Manual inventory create failed.',
      details: {
        source_type: sourceType,
        external_key: externalKey,
        item_name: itemName,
        diagnostic: normalizeText(error?.message).slice(0, 300)
      },
      related_user_id: adminUser.user_id
    });
    return json({
      ok: false,
      error: 'Failed to save the inventory item.',
      code: 'inventory_create_failed',
      diagnostic: normalizeText(error?.message).slice(0, 300)
    }, 500);
  }
}

async function handlePatch(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const id = Number(body.site_item_inventory_id || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);

  try {
    const existing = await db.prepare(`
      SELECT sii.*, COALESCE(siid.item_description, '') AS item_description,
             COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
             COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
             COALESCE(iip.inventory_class,CASE WHEN sii.source_type='tool' THEN 'reusable_equipment' ELSE 'consumable' END) AS inventory_class,COALESCE(iip.lifecycle_mode,CASE WHEN sii.source_type='tool' THEN 'reusable' ELSE 'consumable' END) AS lifecycle_mode,COALESCE(iip.lot_tracking_recommended,0) AS lot_tracking_recommended,COALESCE(iip.expiry_tracking_recommended,0) AS expiry_tracking_recommended,COALESCE(iip.source_material_recommended,0) AS source_material_recommended,COALESCE(iip.notes,'') AS inventory_profile_notes
      FROM site_item_inventory sii
      LEFT JOIN site_inventory_item_descriptions siid ON siid.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
      WHERE sii.site_item_inventory_id = ?
      LIMIT 1
    `).bind(id).first();

    if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);

    const merged = {
      ...existing,
      ...body,
      source_type: normalizeInventoryKind(body.source_type ?? existing.source_type, existing.source_type || 'other'),
      item_name: normalizeText(body.item_name || existing.item_name),
      item_description: normalizeText(body.item_description ?? existing.item_description),
      category: normalizeText(body.category ?? existing.category).toLowerCase(),
      source_url: normalizeText(body.source_url ?? existing.source_url),
      amazon_url: normalizeText(body.amazon_url ?? existing.amazon_url),
      image_url: normalizeText(body.image_url ?? existing.image_url),
      supplier_name: normalizeText(body.supplier_name ?? existing.supplier_name),
      supplier_sku: normalizeText(body.supplier_sku ?? existing.supplier_sku),
      supplier_contact: normalizeText(body.supplier_contact ?? existing.supplier_contact),
      reorder_notes: normalizeText(body.reorder_notes ?? existing.reorder_notes),
      reuse_status: normalizeText(body.reuse_status ?? existing.reuse_status).toLowerCase(),
      reservation_notes: normalizeText(body.reservation_notes ?? existing.reservation_notes),
      stock_unit_label: normalizeText(body.stock_unit_label ?? existing.stock_unit_label).toLowerCase() || 'unit',
      usage_unit_label: normalizeText(body.usage_unit_label ?? existing.usage_unit_label).toLowerCase() || 'unit',
      usage_units_per_stock_unit: Math.max(
        0.001,
        Number((body.usage_units_per_stock_unit ?? existing.usage_units_per_stock_unit) || 1) || 1
      ),
      usage_tracking_mode: normalizeUsageTrackingMode(body.usage_tracking_mode ?? existing.usage_tracking_mode, normalizeInventoryKind(body.source_type ?? existing.source_type) === 'tool' ? 'reusable' : 'exact'),
      minimum_usage_increment: Math.max(0.0001, Number(body.minimum_usage_increment ?? existing.minimum_usage_increment ?? 0.001) || 0.001)
    };

    if (merged.source_type !== existing.source_type) {
      if (![existing.source_type, merged.source_type].every((value) => ['tool','supply'].includes(normalizeInventoryKind(value)))) {
        return json({ ok:false, error:'Existing inventory classification may only be changed between tool and supply.' },400);
      }
      const identityConflict = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id<>? AND COALESCE(is_active,1)=1 AND LOWER(TRIM(source_type))=? AND external_key=? LIMIT 1`).bind(id,merged.source_type,existing.external_key).first();
      if (identityConflict?.site_item_inventory_id) {
        // Build 244: a legacy item can exist twice only because it was classified once as a tool
        // and once as a supply. Reclassification consolidates onto the already-canonical target
        // instead of blocking. Use MAX for stock counters so duplicate legacy rows do not double
        // the same physical stock merely because both used an old default quantity of 1.
        const targetId = Number(identityConflict.site_item_inventory_id || 0);
        const targetOnHand = Math.max(Number(identityConflict.on_hand_quantity || 0), Number(merged.on_hand_quantity || 0));
        const targetReserved = Math.max(Number(identityConflict.reserved_quantity || 0), Number(merged.reserved_quantity || 0));
        const targetIncoming = Math.max(Number(identityConflict.incoming_quantity || 0), Number(merged.incoming_quantity || 0));
        const targetReorder = Math.max(Number(identityConflict.reorder_level || 0), Number(merged.reorder_level || 0));
        await db.prepare(`UPDATE site_item_inventory SET item_name=?,category=?,source_url=COALESCE(NULLIF(?,''),source_url),amazon_url=COALESCE(NULLIF(?,''),amazon_url),image_url=COALESCE(NULLIF(?,''),image_url),on_hand_quantity=?,reserved_quantity=?,incoming_quantity=?,reorder_level=?,unit_cost_cents=CASE WHEN ?>0 THEN ? ELSE unit_cost_cents END,stock_unit_label=?,usage_unit_label=?,usage_units_per_stock_unit=?,supplier_name=COALESCE(NULLIF(?,''),supplier_name),supplier_sku=COALESCE(NULLIF(?,''),supplier_sku),updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`)
          .bind(merged.item_name,merged.category||null,merged.source_url||'',merged.amazon_url||'',merged.image_url||'',targetOnHand,targetReserved,targetIncoming,targetReorder,Number(merged.unit_cost_cents||0),Number(merged.unit_cost_cents||0),merged.stock_unit_label||'unit',merged.usage_unit_label||'unit',Math.max(0.001,Number(merged.usage_units_per_stock_unit||1)||1),merged.supplier_name||'',merged.supplier_sku||'',targetId).run();
        await saveUsageProfile(db,targetId,{ usage_tracking_mode: merged.usage_tracking_mode, minimum_usage_increment: merged.minimum_usage_increment, notes: body.usage_profile_notes || 'Build 244 classification duplicate consolidated.', user_id: adminUser.user_id });
        await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=0,reserved_quantity=0,incoming_quantity=0,is_active=0,reservation_notes=TRIM(COALESCE(reservation_notes,'') || ' Build 244: consolidated into inventory #' || ?),updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(targetId,id).run();
        await db.prepare(`UPDATE product_resource_links SET resource_kind=?,updated_at=CURRENT_TIMESTAMP WHERE resource_kind=? AND source_key=?`).bind(merged.source_type,existing.source_type,existing.external_key).run().catch(()=>null);
        const catalogConflict = await db.prepare(`SELECT catalog_item_id FROM catalog_items WHERE item_kind=? AND source_key=? LIMIT 1`).bind(merged.source_type,existing.external_key).first().catch(()=>null);
        if (catalogConflict?.catalog_item_id) {
          await db.prepare(`UPDATE catalog_items SET name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE catalog_item_id=?`).bind(merged.item_name,merged.category||null,Number(catalogConflict.catalog_item_id)).run().catch(()=>null);
          await db.prepare(`UPDATE catalog_items SET status='archived',visible_public=0,updated_at=CURRENT_TIMESTAMP WHERE item_kind=? AND source_key=?`).bind(existing.source_type,existing.external_key).run().catch(()=>null);
        } else {
          await db.prepare(`UPDATE catalog_items SET item_kind=?,name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE item_kind=? AND source_key=?`).bind(merged.source_type,merged.item_name,merged.category||null,existing.source_type,existing.external_key).run().catch(()=>null);
        }
        await logMovement(db,{site_item_inventory_id:targetId,source_type:merged.source_type,external_key:existing.external_key,item_name:merged.item_name,movement_type:'sync',quantity_delta:targetOnHand-Number(identityConflict.on_hand_quantity||0),previous_on_hand_quantity:Number(identityConflict.on_hand_quantity||0),new_on_hand_quantity:targetOnHand,previous_reserved_quantity:Number(identityConflict.reserved_quantity||0),new_reserved_quantity:targetReserved,previous_incoming_quantity:Number(identityConflict.incoming_quantity||0),new_incoming_quantity:targetIncoming,note:`Build 244: consolidated misclassified inventory #${id} into this ${merged.source_type} record without double-counting duplicate default stock.`,actor_user_id:adminUser.user_id});
        await logMovement(db,{site_item_inventory_id:id,source_type:existing.source_type,external_key:existing.external_key,item_name:existing.item_name,movement_type:'correction',quantity_delta:-Number(existing.on_hand_quantity||0),previous_on_hand_quantity:Number(existing.on_hand_quantity||0),new_on_hand_quantity:0,previous_reserved_quantity:Number(existing.reserved_quantity||0),new_reserved_quantity:0,previous_incoming_quantity:Number(existing.incoming_quantity||0),new_incoming_quantity:0,note:`Build 244: archived after classification merge into inventory #${targetId}.`,actor_user_id:adminUser.user_id});
        const canonical = await db.prepare(`SELECT sii.*,COALESCE(siid.item_description,'') item_description,COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(siup.minimum_usage_increment,0.001) minimum_usage_increment FROM site_item_inventory sii LEFT JOIN site_inventory_item_descriptions siid ON siid.site_item_inventory_id=sii.site_item_inventory_id LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id WHERE sii.site_item_inventory_id=? LIMIT 1`).bind(targetId).first();
        return json({ok:true,item:shape(canonical||{}),classification_merge:{archived_inventory_id:id,canonical_inventory_id:targetId,stock_merge_policy:'max_to_avoid_legacy_duplicate_double_count'} });
      }
      const catalogConflict = await db.prepare(`SELECT catalog_item_id FROM catalog_items WHERE item_kind=? AND source_key=? LIMIT 1`).bind(merged.source_type,existing.external_key).first().catch(()=>null);
      await db.prepare(`UPDATE product_resource_links SET resource_kind=?,updated_at=CURRENT_TIMESTAMP WHERE resource_kind=? AND source_key=?`).bind(merged.source_type,existing.source_type,existing.external_key).run().catch(()=>null);
      if (catalogConflict?.catalog_item_id) {
        // Build 244: capitalization/type duplicates can legitimately leave the same source key
        // in both catalog kinds. Keep the target-kind row canonical and archive the old-kind row.
        await db.prepare(`UPDATE catalog_items SET name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE catalog_item_id=?`)
          .bind(merged.item_name, merged.category || null, Number(catalogConflict.catalog_item_id)).run().catch(()=>null);
        await db.prepare(`UPDATE catalog_items SET status='archived',visible_public=0,updated_at=CURRENT_TIMESTAMP WHERE item_kind=? AND source_key=?`)
          .bind(existing.source_type,existing.external_key).run().catch(()=>null);
      } else {
        await db.prepare(`UPDATE catalog_items SET item_kind=?,name=COALESCE(NULLIF(?,''),name),category=COALESCE(NULLIF(?,''),category),updated_at=CURRENT_TIMESTAMP WHERE item_kind=? AND source_key=?`)
          .bind(merged.source_type,merged.item_name,merged.category || null,existing.source_type,existing.external_key).run().catch(()=>null);
      }
    }

    await db.prepare(`
      UPDATE site_item_inventory
      SET source_type = ?, item_name = ?, category = ?, source_url = ?, amazon_url = ?, image_url = ?,
          stock_unit_label = ?, usage_unit_label = ?, usage_units_per_stock_unit = ?,
          on_hand_quantity = ?, reserved_quantity = ?, incoming_quantity = ?, reorder_level = ?, unit_cost_cents = ?,
          supplier_name = ?, supplier_sku = ?, supplier_contact = ?, reorder_notes = ?,
          is_active = ?, preferred_reorder_quantity = ?, is_on_reorder_list = ?, do_not_reorder = ?,
          do_not_reuse = ?, reuse_status = ?, reservation_notes = ?, last_counted_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(
      merged.source_type,
      merged.item_name,
      merged.category || null,
      merged.source_url || null,
      merged.amazon_url || null,
      merged.image_url || null,
      merged.stock_unit_label || 'unit',
      merged.usage_unit_label || 'unit',
      Math.max(0.001, Number(merged.usage_units_per_stock_unit || 1) || 1),
      Number(merged.on_hand_quantity || 0),
      Number(merged.reserved_quantity || 0),
      Number(merged.incoming_quantity || 0),
      Number(merged.reorder_level || 0),
      Number(merged.unit_cost_cents || 0),
      merged.supplier_name || null,
      merged.supplier_sku || null,
      merged.supplier_contact || null,
      merged.reorder_notes || null,
      Number(merged.is_active) === 0 ? 0 : 1,
      Number(merged.preferred_reorder_quantity || 0),
      Number(merged.is_on_reorder_list) === 1 ? 1 : 0,
      Number(merged.do_not_reorder) === 1 ? 1 : 0,
      Number(merged.do_not_reuse) === 1 ? 1 : 0,
      merged.reuse_status || null,
      merged.reservation_notes || null,
      normalizeText(body.last_counted_at) || existing.last_counted_at || null,
      id
    ).run();

    await saveUsageProfile(db, id, { usage_tracking_mode: merged.usage_tracking_mode, minimum_usage_increment: merged.minimum_usage_increment, notes: body.usage_profile_notes || '', user_id: adminUser.user_id });
    await saveInventoryProfile(db, id, {...existing,...body}, adminUser.user_id, merged.source_type);

    await logMovement(db, {
      site_item_inventory_id: id,
      source_type: merged.source_type,
      external_key: existing.external_key,
      item_name: merged.item_name,
      movement_type: 'update',
      quantity_delta: Number(merged.on_hand_quantity || 0) - Number(existing.on_hand_quantity || 0),
      previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
      new_on_hand_quantity: Number(merged.on_hand_quantity || 0),
      previous_reserved_quantity: Number(existing.reserved_quantity || 0),
      new_reserved_quantity: Number(merged.reserved_quantity || 0),
      previous_incoming_quantity: Number(existing.incoming_quantity || 0),
      new_incoming_quantity: Number(merged.incoming_quantity || 0),
      note: normalizeText(body.movement_note) || 'Inventory item updated.',
      actor_user_id: adminUser.user_id
    });

    if (Object.prototype.hasOwnProperty.call(body, 'item_description')) {
      await saveItemDescription(db, id, merged.item_description, adminUser.user_id);
    }
    await persistPackagingSourceDraft(db, id, {...body,item_name:merged.item_name,supplier_name:merged.supplier_name,supplier_sku:merged.supplier_sku,source_url:merged.source_url,amazon_url:merged.amazon_url,image_url:merged.image_url}, adminUser.user_id).catch(() => null);

    const saved = await db.prepare(`
      SELECT sii.*, COALESCE(siid.item_description, '') AS item_description,
             COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
             COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
             COALESCE(iip.inventory_class,CASE WHEN sii.source_type='tool' THEN 'reusable_equipment' ELSE 'consumable' END) AS inventory_class,COALESCE(iip.lifecycle_mode,CASE WHEN sii.source_type='tool' THEN 'reusable' ELSE 'consumable' END) AS lifecycle_mode,COALESCE(iip.lot_tracking_recommended,0) AS lot_tracking_recommended,COALESCE(iip.expiry_tracking_recommended,0) AS expiry_tracking_recommended,COALESCE(iip.source_material_recommended,0) AS source_material_recommended,COALESCE(iip.notes,'') AS inventory_profile_notes
      FROM site_item_inventory sii
      LEFT JOIN site_inventory_item_descriptions siid ON siid.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id = sii.site_item_inventory_id
      LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
      WHERE sii.site_item_inventory_id = ?
      LIMIT 1
    `).bind(id).first();

    await recordInventoryCostHistory(db, {
      site_item_inventory_id: id,
      source_type: merged.source_type,
      external_key: existing.external_key,
      item_name: merged.item_name,
      previous_unit_cost_cents: Number(existing.unit_cost_cents || 0),
      new_unit_cost_cents: Number(merged.unit_cost_cents || 0),
      source_kind: 'manual_inventory_update',
      source_id: `${merged.source_type || ''}:${existing.external_key || ''}`,
      reason_note: normalizeText(body.movement_note) || 'Manual inventory cost update.',
      changed_by_user_id: adminUser.user_id
    }).catch(() => null);

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_update',
      target_type: 'inventory_item',
      target_id: id,
      target_key: `${existing.source_type}:${existing.external_key}`,
      details: {
        item_name: merged.item_name,
        previous_source_type: existing.source_type,
        new_source_type: merged.source_type,
        previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
        new_on_hand_quantity: Number(merged.on_hand_quantity || 0),
        previous_reserved_quantity: Number(existing.reserved_quantity || 0),
        new_reserved_quantity: Number(merged.reserved_quantity || 0),
        previous_incoming_quantity: Number(existing.incoming_quantity || 0),
        new_incoming_quantity: Number(merged.incoming_quantity || 0)
      }
    });

    return json({ ok: true, item: shape(saved || {}) });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Failed to update inventory item.' }, 500);
  }
}

async function handleDelete(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const id = Number(new URL(request.url).searchParams.get('site_item_inventory_id') || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);

  try {
    const existing = await db.prepare(`
      SELECT *
      FROM site_item_inventory
      WHERE site_item_inventory_id = ?
      LIMIT 1
    `).bind(id).first();

    if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);

    await db.prepare(`
      DELETE FROM site_item_inventory
      WHERE site_item_inventory_id = ?
    `).bind(id).run();

    await logMovement(db, {
      site_item_inventory_id: id,
      source_type: existing.source_type,
      external_key: existing.external_key,
      item_name: existing.item_name,
      movement_type: 'delete',
      quantity_delta: 0,
      previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
      new_on_hand_quantity: 0,
      previous_reserved_quantity: Number(existing.reserved_quantity || 0),
      new_reserved_quantity: 0,
      previous_incoming_quantity: Number(existing.incoming_quantity || 0),
      new_incoming_quantity: 0,
      note: 'Inventory item deleted.',
      actor_user_id: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_delete',
      target_type: 'inventory_item',
      target_id: id,
      target_key: `${existing.source_type}:${existing.external_key}`,
      details: {
        item_name: existing.item_name,
        on_hand_quantity: Number(existing.on_hand_quantity || 0)
      }
    });

    return json({ ok: true, message: 'Inventory item removed.' });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Failed to remove inventory item.' }, 500);
  }
}

async function runInventoryBoundary(context, operation, handler) {
  try {
    return await handler(context);
  } catch (error) {
    const { request, env } = context;
    const message = normalizeText(error?.message || error).slice(0, 360);
    const schemaProblem = /no such (table|column)|has no column|database schema|migration/i.test(message);
    await captureRuntimeIncident(env, request, {
      incident_scope: 'inventory',
      incident_code: schemaProblem ? 'inventory_migration_required' : `inventory_${operation}_failed`,
      severity: 'error',
      message: schemaProblem ? 'Inventory request requires the current D1 migration.' : `Inventory ${operation} request failed.`,
      details: { diagnostic: message },
      related_user_id: null
    }).catch(() => null);
    return json({
      ok: false,
      error: schemaProblem
        ? 'Inventory storage needs the current D1 migration before this operation can continue.'
        : 'Inventory services are temporarily unavailable. Your browser can retain unsaved form data while you retry.',
      code: schemaProblem ? 'inventory_migration_required' : `inventory_${operation}_failed`,
      diagnostic: message,
      retryable: !schemaProblem
    }, schemaProblem ? 503 : 500);
  }
}

export function onRequestGet(context) { return runInventoryBoundary(context, 'read', handleGet); }
export function onRequestPost(context) { return runInventoryBoundary(context, 'write', handlePost); }
export function onRequestPatch(context) { return runInventoryBoundary(context, 'update', handlePatch); }
export function onRequestDelete(context) { return runInventoryBoundary(context, 'delete', handleDelete); }

