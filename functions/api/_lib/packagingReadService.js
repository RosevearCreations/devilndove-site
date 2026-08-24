// Build 286 - narrow Packaging-owned GET bootstrap for the active modular runtime.
// Bulk Catalog and Inventory collections are intentionally excluded; those come from owner contracts.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 286;

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function text(value, max = 2000) { return normalizeText(value).slice(0, max); }
function id(value) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeJson(value, fallback) { try { const parsed = JSON.parse(String(value || '')); return parsed ?? fallback; } catch { return fallback; } }

function mapTemplate(row) {
  return {
    ...row,
    packaging_template_id: id(row.packaging_template_id),
    page_width_mm: number(row.page_width_mm),
    page_height_mm: number(row.page_height_mm),
    front_width_mm: number(row.front_width_mm),
    front_height_mm: number(row.front_height_mm),
    rear_width_mm: number(row.rear_width_mm),
    rear_height_mm: number(row.rear_height_mm),
    layout: safeJson(row.layout_json, {}),
    theme: safeJson(row.theme_json, {}),
  };
}
function mapProject(row) {
  return {
    ...row,
    packaging_project_id: id(row.packaging_project_id),
    product_id: id(row.product_id) || null,
    packaging_template_id: id(row.packaging_template_id),
    claims: safeJson(row.claims_json, []),
    icons: safeJson(row.icons_json, []),
    theme: safeJson(row.theme_json, {}),
    artwork: safeJson(row.artwork_json, {}),
  };
}
function mapVersion(row) {
  return {
    ...row,
    packaging_project_version_id: id(row.packaging_project_version_id),
    packaging_project_id: id(row.packaging_project_id),
    version_number: number(row.version_number),
    snapshot: safeJson(row.snapshot_json, {}),
  };
}
function mapReference(row) {
  return {
    ...row,
    packaging_reference_source_id: id(row.packaging_reference_source_id),
    dimensional_summary: safeJson(row.dimensional_summary_json, {}),
  };
}
function mapFormula(row) {
  return {
    ...row,
    packaging_formula_library_id: id(row.packaging_formula_library_id),
    ingredients: safeJson(row.ingredients_json, []),
  };
}
function mapLibraryContent(row) {
  return {
    ...row,
    packaging_content_library_id: id(row.packaging_content_library_id),
    metadata: safeJson(row.metadata_json, {}),
  };
}
function mapSourceMaterial(row) {
  return {
    ...row,
    packaging_source_material_template_id: id(row.packaging_source_material_template_id),
    product_family: text(row.product_family || 'general', 80) || 'general',
    material_subtype: text(row.material_subtype || row.material_type || 'other', 80) || 'other',
    default_role: text(row.default_role || '', 40) || null,
    colour_hex: text(row.colour_hex || '', 20) || null,
    master_inci: safeJson(row.master_inci_json, []),
    fragrance_allergens: safeJson(row.fragrance_allergens_json, []),
    benefits: safeJson(row.benefits_json, []),
    supplier_claims: safeJson(row.supplier_claims_json, []),
    source_snapshot: safeJson(row.source_snapshot_json, {}),
  };
}
function mapPrinterProfile(row = {}) {
  return {
    ...row,
    packaging_printer_profile_id: id(row.packaging_printer_profile_id),
    name: text(row.profile_name, 180),
    paper: text(row.paper_stock, 180) || 'Letter 8.5 × 11 in',
    margin_mm: Math.max(0, number(row.margin_mm, 0)),
    gap_mm: Math.max(0, number(row.gap_mm, 0)),
    scale_percent: Math.max(1, number(row.scale_percent, 100)),
    auto_rotate: Number(row.auto_rotate) !== 0,
    is_default_label: Number(row.is_default_label) === 1,
    is_active: Number(row.is_active) !== 0,
    settings_note: text(row.settings_note, 1000) || '',
  };
}

function dimensionReview(template = {}) {
  const layout = template.layout || safeJson(template.layout_json, {});
  const blockers = [];
  const warnings = [];
  const near = (a, b, t = .08) => Math.abs(number(a) - number(b)) <= t;
  if (!near(template.page_width_mm, 279.4, .2)) blockers.push('Overall width must be 279.4 mm (11.00 in).');
  if (!near(layout.band_height_mm, 19.05, .1)) blockers.push('Band height must be 19.05 mm (0.75 in).');
  if (!near(template.front_width_mm, 50.8, .1) || !near(template.front_height_mm, 38.1, .1)) blockers.push('Front oval must be 50.8 × 38.1 mm (2.00 × 1.50 in).');
  if (!near(template.page_height_mm, 38.1, .1)) warnings.push('This profile expands the artboard beyond 1.50 in so a 50 mm rear seal is not clipped.');
  if (!near(template.rear_width_mm, 50, .1)) warnings.push('The photo-fit profile uses a 38.1 mm rear seal because a 50 mm circle cannot physically fit inside a 38.1 mm-high artboard.');
  return { blockers, warnings, profile: layout.dimension_profile || 'unspecified' };
}
function estimatedIngredientLines(values = [], maxChars = 38) {
  const clean = values.map((value) => String(value || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  let lines = 0;
  let current = '';
  clean.forEach((value, index) => {
    const token = `${value}${index < clean.length - 1 ? ',' : ''}`;
    for (const word of token.split(/\s+/).filter(Boolean)) {
      const next = current ? `${current} ${word}` : word;
      if (current && next.length > maxChars) { lines += 1; current = word; }
      else current = next;
    }
  });
  if (current) lines += 1;
  return lines;
}
function packagingRequiredFields(project = {}, ingredients = [], claims = [], template = {}, sourceMaterials = []) {
  const isSoap = String(project.package_type || template.package_type || '') === 'soap_ribbon';
  const isRound = ['candle_top', 'engraved_round'].includes(String(project.package_type || template.package_type || ''));
  const checks = isRound ? [
    ['template', project.packaging_template_id || template.packaging_template_id],
    ['main candle-top wording', project.artwork?.candle_primary_text || template.layout?.default_primary_text],
    ['upper curved brand wording', project.artwork?.top_arc_text || template.layout?.default_top_arc_text],
    ['lower curved origin wording', project.artwork?.bottom_arc_text || template.layout?.default_bottom_arc_text],
  ] : [
    ['English product identity', project.product_identity_en], ['French product identity', project.product_identity_fr],
    ['metric net quantity', project.net_quantity_text],
    ['dealer / business identity', project.dealer_name], ['dealer principal address', project.dealer_address],
    ['consumer contact information', project.contact_text], ['website', project.website_text],
  ];
  if (isSoap) checks.push(['INCI ingredient list', project.ingredients_inci], ['Made in Canada wording', project.made_in_canada_text], ['rose asset', project.artwork?.rose_asset_id || project.rose_asset_id]);
  if (String(project.warnings_en || project.warnings_fr || '').trim()) checks.push(['English warning', project.warnings_en], ['French warning', project.warnings_fr]);
  const missing = checks.filter(([, value]) => !String(value || '').trim()).map(([label]) => label);
  if (isSoap && !ingredients.length) missing.push('structured INCI ingredient rows');
  if (isSoap) {
    const baseSources = sourceMaterials.filter((row) => String(row.material_role || '') === 'base');
    const fragranceSources = sourceMaterials.filter((row) => String(row.material_role || '') === 'fragrance');
    for (const source of baseSources) {
      if (!['supplier_verified', 'owner_verified'].includes(String(source.verification_status || ''))) missing.push(`source soap-base verification: ${source.material_name || 'selected base'}`);
      const inci = Array.isArray(source.master_inci) ? source.master_inci : [];
      if (inci.some((row) => String(row.verification_status || 'needs_review') === 'needs_review')) missing.push(`master INCI review for ${source.material_name || 'selected base'}`);
    }
    for (const source of fragranceSources) {
      if (String(source.fragrance_allergen_review_status || 'needs_supplier_data') !== 'reviewed') missing.push(`2026 fragrance-allergen review for ${source.material_name || 'selected fragrance oil'}`);
    }
  }
  if (ingredients.some((row) => Number(row.required_on_label) !== 0 && !String(row.inci_name || '').trim())) missing.push('INCI name for each required ingredient row');
  if (claims.some((row) => !String(row.claim_en || '').trim() || !String(row.claim_fr || '').trim())) missing.push('English and French text for each claim');
  const requiredIngredients = ingredients.filter((row) => Number(row.required_on_label) !== 0);
  if (isSoap && requiredIngredients.some((row) => !String(row.display_name_en || row.inci_name || '').trim())) missing.push('English display name for each required ingredient row');
  if (isSoap && requiredIngredients.some((row) => !String(row.display_name_fr || '').trim())) missing.push('French display name for each required ingredient row');
  const englishLines = estimatedIngredientLines(requiredIngredients.map((row) => row.display_name_en || row.inci_name), 38);
  const frenchLines = estimatedIngredientLines(requiredIngredients.map((row) => row.display_name_fr), 38);
  if (isSoap && (englishLines > 11 || frenchLines > 11)) missing.push(`Complete bilingual ingredient declarations exceed the tested dedicated-panel capacity (English ${englishLines} lines; French ${frenchLines} lines); use an extended/peel-back label or other reviewed extended ingredient presentation rather than clipping either language`);
  const dimensions = isSoap ? dimensionReview(template) : {
    blockers: [],
    warnings: [isRound ? 'Confirm the measured lid/blank diameter, safe margin, material settings and a physical proof before approval.' : 'Confirm the selected template against the physical container/card dieline before approval.'],
    profile: template.layout?.design_profile || template.layout?.dimension_profile || 'general',
  };
  const designProfile = String(template.layout?.design_profile || safeJson(template.layout_json, {}).design_profile || '');
  if (isSoap && !['soap_reference_v2', 'soap_reference_v3'].includes(designProfile)) dimensions.blockers.push('Soap ribbon must use the approved soap_reference_v3 design profile before approval.');
  return {
    missing: [...new Set(missing)],
    dimension_blockers: [...new Set(dimensions.blockers)],
    dimension_warnings: dimensions.warnings,
    dimension_profile: dimensions.profile,
    design_profile: designProfile,
  };
}

async function listPackagingData(db) {
  const templates = rows(await db.prepare(`SELECT * FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 WHEN template_key='soap-ribbon-spec-50mm-seal-v1' THEN 1 ELSE 2 END,is_system DESC,LOWER(template_name)`).all()).map(mapTemplate);

  // Linked Catalog context only: this does not enumerate the Catalog.
  const projects = rows(await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.featured_image_url,sp.print_status AS soap_print_status FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id LEFT JOIN soap_products sp ON sp.packaging_project_id=pp.packaging_project_id ORDER BY pp.updated_at DESC,pp.packaging_project_id DESC`).all()).map(mapProject);

  let printers = [];
  let printers_schema_ready = true;
  try {
    printers = rows(await db.prepare(`SELECT * FROM packaging_printer_profiles WHERE is_active=1 ORDER BY is_default_label DESC,LOWER(profile_name),packaging_printer_profile_id`).all()).map(mapPrinterProfile);
  } catch { printers_schema_ready = false; }

  const reference_sources = rows(await db.prepare(`SELECT * FROM packaging_reference_sources WHERE is_active=1 ORDER BY CASE source_type WHEN 'design_specification' THEN 1 WHEN 'dimension_guide' THEN 2 WHEN 'svg_template' THEN 3 ELSE 4 END,source_key`).all()).map(mapReference);

  let formula_library = [];
  let content_library = [];
  let source_material_library = [];
  let library_schema_ready = true;
  let source_material_schema_ready = true;
  let source_material_metadata_ready = true;

  try {
    formula_library = rows(await db.prepare(`SELECT * FROM packaging_formula_library WHERE is_active=1 ORDER BY is_system DESC,LOWER(formula_name),packaging_formula_library_id`).all()).map(mapFormula);
    content_library = rows(await db.prepare(`SELECT * FROM packaging_content_library WHERE is_active=1 ORDER BY CASE content_type WHEN 'claim' THEN 1 WHEN 'ingredient' THEN 2 WHEN 'fragrance_oil' THEN 3 WHEN 'colourant' THEN 4 ELSE 5 END,is_system DESC,LOWER(item_name),packaging_content_library_id`).all()).map(mapLibraryContent);
  } catch { library_schema_ready = false; }

  try {
    try {
      source_material_library = rows(await db.prepare(`SELECT smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.is_active=1 ORDER BY CASE COALESCE(smm.default_role,'') WHEN 'base' THEN 1 WHEN 'fragrance' THEN 2 WHEN 'colourant' THEN 3 ELSE 4 END,smt.is_system DESC,LOWER(smt.material_name),smt.packaging_source_material_template_id`).all()).map(mapSourceMaterial);
    } catch {
      source_material_metadata_ready = false;
      source_material_library = rows(await db.prepare(`SELECT * FROM packaging_source_material_templates WHERE is_active=1 ORDER BY CASE material_type WHEN 'soap_base' THEN 1 WHEN 'fragrance_oil' THEN 2 WHEN 'colourant' THEN 3 ELSE 4 END,is_system DESC,LOWER(material_name),packaging_source_material_template_id`).all()).map(mapSourceMaterial);
    }
    const links = rows(await db.prepare(`SELECT packaging_formula_library_id,packaging_source_material_template_id,material_role FROM packaging_formula_source_material_links ORDER BY packaging_formula_source_material_link_id`).all());
    for (const formula of formula_library) {
      const link = links.find((row) => Number(row.packaging_formula_library_id) === Number(formula.packaging_formula_library_id) && String(row.material_role) === 'base');
      if (link) formula.source_material_template_id = Number(link.packaging_source_material_template_id);
    }
  } catch { source_material_schema_ready = false; }

  return {
    templates,
    projects,
    printers,
    printers_schema_ready,
    reference_sources,
    formula_library,
    content_library,
    source_material_library,
    library_schema_ready,
    source_material_schema_ready,
    source_material_metadata_ready,
  };
}

async function loadDetail(db, projectId) {
  // Linked Catalog context only for the selected Packaging project.
  const row = await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.product_category,p.short_description,p.description,p.weight_grams,p.featured_image_url,t.template_key,t.template_name,t.package_type AS template_package_type,t.description AS template_description,t.is_system AS template_is_system,t.page_width_mm,t.page_height_mm,t.front_width_mm,t.front_height_mm,t.rear_width_mm,t.rear_height_mm,t.layout_json AS template_layout_json,t.theme_json AS template_theme_json FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id INNER JOIN packaging_templates t ON t.packaging_template_id=pp.packaging_template_id WHERE pp.packaging_project_id=?`).bind(projectId).first();
  if (!row) return null;

  const soapProduct = await db.prepare(`SELECT * FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
  let ingredients = [];
  let claims = [];
  try {
    ingredients = rows(await db.prepare(`SELECT * FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id`).bind(projectId).all());
    claims = rows(await db.prepare(`SELECT * FROM packaging_project_claims WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_claim_id`).bind(projectId).all());
  } catch {}
  if (!ingredients.length && soapProduct) ingredients = rows(await db.prepare(`SELECT * FROM soap_ingredients WHERE soap_product_id=? ORDER BY sort_order,ingredient_id`).bind(soapProduct.soap_product_id).all());
  if (!claims.length && soapProduct) claims = rows(await db.prepare(`SELECT * FROM soap_label_claims WHERE soap_product_id=? ORDER BY sort_order,claim_id`).bind(soapProduct.soap_product_id).all());

  const versions = rows(await db.prepare(`SELECT packaging_project_version_id,packaging_project_id,version_number,version_label,review_status,reviewed_by_user_id,reviewed_at,created_by_user_id,created_at,snapshot_json FROM packaging_project_versions WHERE packaging_project_id=? ORDER BY version_number DESC`).bind(projectId).all()).map(mapVersion);
  const exports = rows(await db.prepare(`SELECT * FROM packaging_export_history WHERE packaging_project_id=? ORDER BY created_at DESC,packaging_export_history_id DESC LIMIT 100`).bind(projectId).all());
  const printTests = rows(await db.prepare(`SELECT * FROM soap_label_print_tests WHERE packaging_project_id=? ORDER BY created_at DESC,print_test_id DESC LIMIT 50`).bind(projectId).all());
  const soapExports = soapProduct ? rows(await db.prepare(`SELECT * FROM soap_label_exports WHERE soap_product_id=? ORDER BY generated_at DESC,export_id DESC LIMIT 100`).bind(soapProduct.soap_product_id).all()) : [];

  // Linked Inventory context only for components already attached to this Packaging project.
  const components = rows(await db.prepare(`SELECT pc.*,sii.item_name AS inventory_item_name,sii.on_hand_quantity,sii.reserved_quantity,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit FROM packaging_components pc LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=pc.site_item_inventory_id WHERE pc.packaging_project_id=? AND pc.is_active=1 ORDER BY pc.packaging_component_id`).bind(projectId).all());

  let sourceMaterials = [];
  try {
    sourceMaterials = rows(await db.prepare(`SELECT psm.packaging_project_source_material_id,psm.material_role,psm.sort_order,psm.source_snapshot_json,psm.review_status AS project_source_review_status,psm.notes AS project_source_notes,smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all()).map(mapSourceMaterial);
  } catch {
    try {
      sourceMaterials = rows(await db.prepare(`SELECT psm.packaging_project_source_material_id,psm.material_role,psm.sort_order,psm.source_snapshot_json,psm.review_status AS project_source_review_status,psm.notes AS project_source_notes,smt.* FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all()).map(mapSourceMaterial);
    } catch {}
  }

  const template = mapTemplate({
    ...row,
    packaging_template_id: row.packaging_template_id,
    package_type: row.template_package_type,
    description: row.template_description,
    is_system: row.template_is_system,
    layout_json: row.template_layout_json,
    theme_json: row.template_theme_json,
  });
  const project = mapProject(row);
  if (soapProduct) {
    project.rose_asset_id = soapProduct.rose_asset_id;
    project.net_weight_oz = soapProduct.net_weight_oz;
    project.net_weight_g = soapProduct.net_weight_g;
  }
  const componentCostCents = components.reduce((sum, item) => sum + Math.round(number(item.unit_cost_cents) * number(item.quantity_per_finished_unit, 1) * (1 + number(item.wastage_percent) / 100)), 0);

  return {
    project,
    template,
    soap_product: soapProduct || null,
    ingredients,
    structured_claims: claims,
    source_materials: sourceMaterials,
    components,
    component_summary: {
      active_count: components.length,
      estimated_unit_cost_cents: componentCostCents,
      lot_tracked_count: components.filter((item) => Number(item.lot_tracking_required) === 1).length,
    },
    versions,
    exports,
    soap_exports: soapExports,
    print_tests: printTests,
    preflight: packagingRequiredFields(project, ingredients, claims, template, sourceMaterials),
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  try {
    const projectId = id(new URL(context.request.url).searchParams.get('packaging_project_id'));
    return json({
      ok: true,
      build: BUILD,
      ...await listPackagingData(db),
      detail: projectId ? await loadDetail(db, projectId) : null,
      mode: 'packaging_owned_bootstrap_contract_boundary',
      module_boundary: {
        build: BUILD,
        bootstrap: 'packaging-owned',
        catalog_read: 'external-contract',
        inventory_read: 'external-contract',
        content_media: 'external-contract',
        bulk_catalog_rows: 0,
        bulk_inventory_rows: 0,
        legacy_broad_get_bypassed: true,
      },
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'packaging_studio',
      incident_code: 'packaging_bootstrap_failed',
      severity: 'error',
      message: error?.message || 'Packaging bootstrap failed to load.',
      related_user_id: adminUser.user_id,
      details: { build: BUILD, error: String(error?.stack || error) },
    }).catch(() => null);
    return json({ ok: false, error: 'Packaging bootstrap could not load. Your browser draft remains available.', build: BUILD }, 500);
  }
}
