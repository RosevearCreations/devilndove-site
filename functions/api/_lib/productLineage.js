// Release 448 — Product origin/material/tool lineage readiness over existing Inventory authority.
// This helper never creates schema and never changes inventory quantities.
import { normalizeText } from './adminAudit.js';

export const PRODUCT_LINEAGE_TABLES = Object.freeze([
  'product_lineage_profiles',
  'product_resource_lineage_reviews',
  'inventory_vendor_reviews',
]);

const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const id = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };

export async function productLineageSchemaReadiness(db) {
  if (!db) return { ok: false, missing_tables: [...PRODUCT_LINEAGE_TABLES] };
  const placeholders = PRODUCT_LINEAGE_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...PRODUCT_LINEAGE_TABLES).all().catch(() => ({ results: [] }));
  const present = new Set(rows(result).map((row) => String(row.name || '')));
  const missing = PRODUCT_LINEAGE_TABLES.filter((name) => !present.has(name));
  return { ok: missing.length === 0, missing_tables: missing };
}

function fallbackProfile(product = {}) {
  const origin = normalizeText(product.merchandise_origin || 'handmade').toLowerCase();
  if (origin === 'antique') return { origin_kind: 'antiquity', lineage_status: 'exempt', publication_policy: 'exempt', materials_required: 0, compatibility_fallback: 1 };
  if (['vintage', 'collectible', 'oddity'].includes(origin)) return { origin_kind: 'resale', lineage_status: 'exempt', publication_policy: 'exempt', materials_required: 0, compatibility_fallback: 1 };
  if (origin === 'prebuilt') return { origin_kind: 'external_finished_good', lineage_status: 'exempt', publication_policy: 'exempt', materials_required: 0, compatibility_fallback: 1 };
  return { origin_kind: 'legacy_pending', lineage_status: 'legacy_pending', publication_policy: 'legacy_nonblocking', materials_required: 1, compatibility_fallback: 1 };
}

export async function loadProductLineageReadiness(db, productId) {
  const productIdValue = id(productId);
  if (!productIdValue) return { ok: false, product_id: 0, blockers: ['A valid product is required.'], publish_blocked: 0 };

  const product = await db.prepare(`SELECT product_id,name,status,review_status,merchandise_origin,created_at FROM products WHERE product_id=? LIMIT 1`).bind(productIdValue).first().catch(() => null);
  if (!product) return { ok: false, product_id: productIdValue, blockers: ['Product not found.'], publish_blocked: 0 };

  const schema = await productLineageSchemaReadiness(db);
  if (!schema.ok) {
    return {
      ok: true,
      product,
      profile: fallbackProfile(product),
      schema_ready: 0,
      missing_tables: schema.missing_tables,
      materials: [],
      tools: [],
      blockers: [],
      warnings: [`Release 448 lineage schema is not ready (${schema.missing_tables.join(', ')}). Existing publication behavior is preserved until the migration is applied.`],
      publish_blocked: 0,
      enforcement_active: 0,
    };
  }

  const profile = await db.prepare(`SELECT product_id,origin_kind,lineage_status,publication_policy,materials_required,evidence_reference,review_notes,reviewed_by_user_id,reviewed_at,created_at,updated_at FROM product_lineage_profiles WHERE product_id=? LIMIT 1`).bind(productIdValue).first().catch(() => null) || fallbackProfile(product);

  const result = await db.prepare(`
    SELECT prl.product_resource_link_id,prl.product_id,LOWER(TRIM(COALESCE(prl.resource_kind,''))) AS resource_kind,
           prl.source_key,prl.quantity_used,COALESCE(prl.consumption_mode,'per_unit') AS consumption_mode,
           COALESCE(prl.lot_size_units,1) AS lot_size_units,COALESCE(prl.usage_notes,'') AS usage_notes,
           sii.site_item_inventory_id,COALESCE(sii.item_name,prl.source_key) AS item_name,
           COALESCE(sii.is_active,0) AS inventory_active,COALESCE(sii.on_hand_quantity,0) AS on_hand_quantity,
           COALESCE(sii.stock_unit_label,'unit') AS stock_unit_label,COALESCE(sii.supplier_name,'') AS supplier_name,
           COALESCE(sii.supplier_sku,'') AS supplier_sku,COALESCE(sii.amazon_url,'') AS amazon_url,
           COALESCE(plr.resource_role,CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'tool' ELSE 'material' END) AS resource_role,
           COALESCE(plr.verification_status,'unverified') AS verification_status,
           COALESCE(plr.evidence_reference,'') AS evidence_reference,
           COALESCE(plr.review_note,'') AS review_note,plr.reviewed_by_user_id,plr.reviewed_at
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=(
      SELECT sii2.site_item_inventory_id
      FROM site_item_inventory sii2
      WHERE COALESCE(sii2.is_active,1)=1
        AND LOWER(TRIM(COALESCE(sii2.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
        AND LOWER(TRIM(COALESCE(sii2.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
      ORDER BY sii2.site_item_inventory_id DESC LIMIT 1
    )
    LEFT JOIN product_resource_lineage_reviews plr ON plr.product_resource_link_id=prl.product_resource_link_id
    WHERE prl.product_id=?
    ORDER BY prl.sort_order,prl.product_resource_link_id
  `).bind(productIdValue).all();

  const resources = rows(result).map((row) => ({
    ...row,
    product_resource_link_id: id(row.product_resource_link_id),
    product_id: id(row.product_id),
    site_item_inventory_id: id(row.site_item_inventory_id) || null,
    quantity_used: Number(row.quantity_used || 0),
    lot_size_units: Number(row.lot_size_units || 1),
    inventory_active: Number(row.inventory_active || 0) === 1 ? 1 : 0,
    on_hand_quantity: Number(row.on_hand_quantity || 0),
  }));
  const materials = resources.filter((row) => row.resource_kind === 'supply');
  const tools = resources.filter((row) => row.resource_kind === 'tool');
  const consumingMaterials = materials.filter((row) => String(row.consumption_mode || 'per_unit').toLowerCase() !== 'story_only');
  const unresolvedMaterials = consumingMaterials.filter((row) => !row.site_item_inventory_id || row.inventory_active !== 1);
  const unverifiedMaterials = consumingMaterials.filter((row) => String(row.verification_status || '').toLowerCase() !== 'verified');
  const blockers = [];
  const warnings = [];
  const policy = String(profile.publication_policy || 'legacy_nonblocking').toLowerCase();
  const required = policy === 'required' && Number(profile.materials_required || 0) === 1;

  if (required && consumingMaterials.length === 0) blockers.push('New in-house product has no consuming raw-material Supply links.');
  if (required && unresolvedMaterials.length) blockers.push(`${unresolvedMaterials.length} raw-material link(s) do not resolve to active Inventory.`);
  if (required && unverifiedMaterials.length) blockers.push(`${unverifiedMaterials.length} raw-material link(s) still require lineage verification.`);
  if (required && String(profile.lineage_status || '').toLowerCase() !== 'verified') blockers.push('Product lineage profile is not verified.');
  if (policy === 'legacy_nonblocking' && String(profile.lineage_status || '').toLowerCase() !== 'verified') warnings.push('Historical product lineage remains legacy_pending; reconstruct it when evidence is available.');
  if (policy === 'exempt') warnings.push('Product is explicitly exempt from raw-material consumption lineage.');

  return {
    ok: true,
    product,
    profile,
    schema_ready: 1,
    missing_tables: [],
    materials,
    tools,
    summary: {
      material_links: materials.length,
      consuming_material_links: consumingMaterials.length,
      resolved_material_links: consumingMaterials.length - unresolvedMaterials.length,
      unresolved_material_links: unresolvedMaterials.length,
      verified_material_links: consumingMaterials.length - unverifiedMaterials.length,
      tool_links: tools.length,
      verified_tool_links: tools.filter((row) => String(row.verification_status || '').toLowerCase() === 'verified').length,
    },
    blockers,
    warnings,
    publish_blocked: required && blockers.length ? 1 : 0,
    enforcement_active: required ? 1 : 0,
  };
}
