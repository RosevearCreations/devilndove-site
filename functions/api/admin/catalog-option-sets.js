import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import {
  CATALOG_OPTION_SETTING_KEYS,
  saveCatalogOptionSet,
  uniqueSortedOptions,
} from "./_catalog-options.js";
import {
  CATALOG_AUTHORITY_VERSION,
  invalidateCatalogOptionAuthority,
  loadCatalogOptionAuthority,
} from "./_catalog-option-authority.js";

function json(data, status = 200) { return jsonResponse(data, status); }

const OPTION_KEY_MAP = Object.freeze({
  categories: CATALOG_OPTION_SETTING_KEYS.categories,
  colors: CATALOG_OPTION_SETTING_KEYS.colors,
  shipping_codes: CATALOG_OPTION_SETTING_KEYS.shipping_codes,
});

function authorityPayload(authority) {
  const optionSets = authority?.option_sets || {};
  return {
    ok: true,
    authority_version: authority?.authority_version || CATALOG_AUTHORITY_VERSION,
    authority_source: authority?.source || 'catalog-option-authority',
    generated_at: authority?.generated_at || null,
    cache: authority?.cache || null,
    warning: authority?.warning || '',
    d1_read_contract: authority?.d1_read_contract || null,
    option_sets: optionSets,
    tax_classes: Array.isArray(authority?.tax_classes) ? authority.tax_classes : [],
    // Compatibility aliases for existing Product editor/bootstrap consumers.
    category_options: optionSets.category_options || [],
    color_options: optionSets.color_options || [],
    shipping_code_options: optionSets.shipping_code_options || [],
    product_type_options: optionSets.product_type_options || [],
    product_status_options: optionSets.product_status_options || [],
    product_review_status_options: optionSets.product_review_status_options || [],
    merchandise_origin_options: optionSets.merchandise_origin_options || [],
    sale_channel_options: optionSets.sale_channel_options || [],
  };
}

async function freshAuthority(db) {
  return loadCatalogOptionAuthority(db, {
    includeInactiveTaxClasses: true,
    forceFresh: true,
    allowStale: false,
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const authority = await loadCatalogOptionAuthority(db, { includeInactiveTaxClasses: true });
  return json(authorityPayload(authority));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();

  if (action === 'save_option_set') {
    const optionSetName = normalizeText(body.option_set).toLowerCase();
    const key = OPTION_KEY_MAP[optionSetName];
    if (!key) return json({ ok: false, error: 'Unknown or non-editable option_set.' }, 400);
    const values = uniqueSortedOptions(Array.isArray(body.values) ? body.values : []);
    if (!values.length) return json({ ok: false, error: 'At least one dropdown value is required.' }, 400);

    let saved;
    try {
      saved = await saveCatalogOptionSet(db, key, values, adminUser.user_id);
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Unable to save catalog option set.' }, 400);
    }
    invalidateCatalogOptionAuthority();

    await auditAdminAction(env, request, adminUser, {
      action_type: 'catalog_option_set_save',
      target_type: 'app_setting',
      target_key: key,
      details: { option_set: optionSetName, value_count: saved.length, authority_version: CATALOG_AUTHORITY_VERSION }
    });

    return json({
      ...authorityPayload(await freshAuthority(db)),
      saved_option_set: optionSetName,
    });
  }

  if (action === 'save_tax_class') {
    const taxClassId = Number(body.tax_class_id || 0);
    const code = normalizeText(body.code).toUpperCase();
    const name = normalizeText(body.name);
    const description = normalizeText(body.description);
    const rawTaxRate = Number(body.tax_rate || 0);
    const taxRate = Number.isFinite(rawTaxRate) && rawTaxRate > 1 ? rawTaxRate / 100 : rawTaxRate;
    const isActive = Number(body.is_active) === 0 ? 0 : 1;

    if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(code)) {
      return json({ ok: false, error: 'Tax code must be 1–32 letters, numbers, hyphens, or underscores.' }, 400);
    }
    if (!name || name.length > 120) return json({ ok: false, error: 'Tax class name is required and must be 120 characters or less.' }, 400);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) return json({ ok: false, error: 'Tax rate must be between 0% and 100%.' }, 400);

    try {
      if (taxClassId > 0) {
        const result = await db.prepare(`
          UPDATE tax_classes
          SET code = ?, name = ?, description = ?, tax_rate = ?, is_active = ?
          WHERE tax_class_id = ?
        `).bind(code, name, description || null, taxRate, isActive, taxClassId).run();
        if (Number(result?.meta?.changes || 0) === 0) return json({ ok: false, error: 'Tax class was not found.' }, 404);
      } else {
        await db.prepare(`
          INSERT INTO tax_classes (code, name, description, tax_rate, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(code, name, description || null, taxRate, isActive).run();
      }
    } catch (error) {
      const message = String(error?.message || 'Unable to save tax class.');
      return json({ ok: false, error: /unique|constraint/i.test(message) ? 'Tax class code must be unique.' : message }, 400);
    }

    invalidateCatalogOptionAuthority();
    await auditAdminAction(env, request, adminUser, {
      action_type: taxClassId > 0 ? 'tax_class_update' : 'tax_class_create',
      target_type: 'tax_class',
      target_id: taxClassId || null,
      target_key: code,
      details: { code, name, tax_rate: taxRate, is_active: isActive, authority_version: CATALOG_AUTHORITY_VERSION }
    });

    return json(authorityPayload(await freshAuthority(db)));
  }

  if (action === 'delete_tax_class') {
    const taxClassId = Number(body.tax_class_id || 0);
    if (!taxClassId) return json({ ok: false, error: 'tax_class_id is required.' }, 400);

    const usage = await db.prepare(`SELECT COUNT(*) AS usage_count FROM products WHERE tax_class_id = ?`)
      .bind(taxClassId)
      .first()
      .catch(() => ({ usage_count: 0 }));
    const usageCount = Number(usage?.usage_count || 0);
    if (usageCount > 0) {
      await db.prepare(`UPDATE tax_classes SET is_active = 0 WHERE tax_class_id = ?`).bind(taxClassId).run();
    } else {
      await db.prepare(`DELETE FROM tax_classes WHERE tax_class_id = ?`).bind(taxClassId).run();
    }

    invalidateCatalogOptionAuthority();
    await auditAdminAction(env, request, adminUser, {
      action_type: 'tax_class_delete_or_disable',
      target_type: 'tax_class',
      target_id: taxClassId,
      details: { usage_count: usageCount, authority_version: CATALOG_AUTHORITY_VERSION }
    });
    return json(authorityPayload(await freshAuthority(db)));
  }

  return json({ ok: false, error: 'Unknown action.' }, 400);
}
