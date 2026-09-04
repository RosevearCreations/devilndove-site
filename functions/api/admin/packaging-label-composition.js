// Release 467 Build 43 — Label Composition & Overrides.
// Persists reviewed per-label ingredient decisions in existing Packaging artwork JSON.
// No schema creation, repair, or request-time DDL is permitted here.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 43;
const DECISIONS = new Set(['inherit', 'print', 'omit']);
const POLICIES = new Set(['required', 'print_default', 'optional', 'internal_only']);
const POLICY_PRIORITY = { internal_only: 0, optional: 1, print_default: 2, required: 3 };
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value, max = 1000) => normalizeText(value).slice(0, max);
const id = (value) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; };
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const safeJson = (value, fallback) => { try { const parsed = JSON.parse(String(value || '')); return parsed ?? fallback; } catch { return fallback; } };
const canonical = (value) => text(value, 500).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 503) };
  return { adminUser, db };
}

function sourcePolicy(row = {}) {
  const requested = String(row.print_policy || '');
  if (POLICIES.has(requested)) return requested;
  return Number(row.required_on_label) === 0 ? 'optional' : 'required';
}

function choosePolicy(current, next) {
  if (!current) return next;
  return POLICY_PRIORITY[next] > POLICY_PRIORITY[current] ? next : current;
}

async function policyMapForProject(db, projectId) {
  const attached = rows(await db.prepare(`SELECT smt.master_inci_json FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all());
  const map = new Map();
  for (const source of attached) {
    for (const row of safeJson(source.master_inci_json, [])) {
      const key = canonical(row?.inci_name || row?.display_name_en || row?.display_name_fr);
      if (!key) continue;
      const policy = sourcePolicy(row);
      map.set(key, choosePolicy(map.get(key), policy));
    }
  }
  return map;
}

function explicitOverrideMap(artwork = {}) {
  const map = new Map();
  const stored = Array.isArray(artwork.label_composition_overrides) ? artwork.label_composition_overrides : [];
  for (const row of stored) {
    const key = canonical(row?.key || row?.inci_name);
    const decision = String(row?.decision || 'inherit');
    if (key && ['print', 'omit'].includes(decision)) map.set(key, decision);
  }
  return map;
}

function inheritedPrint(policy, current) {
  if (policy) return ['required', 'print_default'].includes(policy) ? 1 : 0;
  return Number(current) !== 0 ? 1 : 0;
}

function effectivePrint(policy, current, decision) {
  if (decision === 'print') return 1;
  if (decision === 'omit') return 0;
  return inheritedPrint(policy, current);
}

function enforceDecision(policy, decision, inci) {
  if (decision === 'omit' && policy === 'required') throw new Error(`“${inci}” is inherited as Required and cannot be omitted from this label.`);
  if (decision === 'print' && policy === 'internal_only') throw new Error(`“${inci}” is Internal Only and cannot be forced onto this label.`);
}

async function loadProject(db, projectId) {
  return db.prepare(`SELECT packaging_project_id,project_key,project_name,package_type,project_status,compliance_status,product_identity_en,product_identity_fr,ingredients_inci,ingredients_en,ingredients_fr,net_quantity_text,website_text,dealer_name,dealer_address,contact_text,made_in_canada_text,warnings_en,warnings_fr,artwork_json,updated_at FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();
}

async function compositionPayload(db, projectId) {
  const project = await loadProject(db, projectId);
  if (!project) return null;
  const artwork = safeJson(project.artwork_json, {});
  const policyMap = await policyMapForProject(db, projectId);
  const overrides = explicitOverrideMap(artwork);
  const ingredients = rows(await db.prepare(`SELECT packaging_project_ingredient_id,sort_order,site_item_inventory_id,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id`).bind(projectId).all()).map((row) => {
    const key = canonical(row.inci_name || row.display_name_en || row.display_name_fr);
    const policy = policyMap.get(key) || null;
    const decision = overrides.get(key) || 'inherit';
    return {
      ...row,
      canonical_key: key,
      inherited_policy: policy,
      inherited_print: inheritedPrint(policy, row.required_on_label),
      override_decision: decision,
      effective_print: effectivePrint(policy, row.required_on_label, decision),
      override_allowed: policy === 'required' ? ['inherit', 'print'] : policy === 'internal_only' ? ['inherit', 'omit'] : ['inherit', 'print', 'omit'],
    };
  });
  const claims = rows(await db.prepare(`SELECT packaging_project_claim_id,sort_order,claim_en,claim_fr,icon_name,is_approved,compliance_note FROM packaging_project_claims WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_claim_id`).bind(projectId).all());
  const printable = ingredients.filter((row) => Number(row.effective_print) === 1);
  const blockers = [];
  if (String(project.package_type || '') === 'soap_ribbon') {
    if (printable.some((row) => !text(row.inci_name, 300))) blockers.push('Every printable soap ingredient requires an INCI name.');
    if (printable.some((row) => !text(row.display_name_en || row.inci_name, 500))) blockers.push('Every printable soap ingredient requires English/common display text.');
    if (printable.some((row) => !text(row.display_name_fr || row.inci_name, 500))) blockers.push('Every printable soap ingredient requires French/common display text.');
  }
  if (claims.some((row) => Number(row.is_approved) !== 1)) blockers.push('One or more label claims remain unapproved internally.');
  return {
    release: RELEASE,
    build: BUILD,
    project: {
      packaging_project_id: id(project.packaging_project_id),
      project_key: text(project.project_key, 120),
      project_name: text(project.project_name, 180),
      package_type: text(project.package_type, 80),
      project_status: text(project.project_status, 40),
      compliance_status: text(project.compliance_status, 40),
      product_identity_en: text(project.product_identity_en, 300),
      product_identity_fr: text(project.product_identity_fr, 300),
      net_quantity_text: text(project.net_quantity_text, 100),
      website_text: text(project.website_text, 300),
      dealer_name: text(project.dealer_name, 300),
      dealer_address: text(project.dealer_address, 600),
      contact_text: text(project.contact_text, 600),
      made_in_canada_text: text(project.made_in_canada_text, 300),
      warnings_en: text(project.warnings_en, 1200),
      warnings_fr: text(project.warnings_fr, 1200),
      updated_at: project.updated_at || null,
    },
    ingredients,
    claims,
    artwork: {
      rose_asset_id: text(artwork.rose_asset_id, 180) || null,
      artwork_asset: text(artwork.artwork_asset, 1000) || null,
      has_visible_artwork: Boolean(text(artwork.rose_asset_id, 180) || text(artwork.artwork_asset, 1000)),
    },
    printable_ingredient_count: printable.length,
    omitted_ingredient_count: ingredients.length - printable.length,
    explicit_override_count: overrides.size,
    blockers,
    schema_change: false,
    request_time_ddl: false,
    production_contacted: false,
    authoritative_readback: true,
  };
}

async function saveComposition(db, adminUser, projectId, requestedOverrides) {
  const project = await loadProject(db, projectId);
  if (!project) throw new Error('Packaging project was not found.');
  const artwork = safeJson(project.artwork_json, {});
  const policyMap = await policyMapForProject(db, projectId);
  const projectRows = rows(await db.prepare(`SELECT packaging_project_ingredient_id,sort_order,inci_name,display_name_en,display_name_fr,required_on_label FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id`).bind(projectId).all());
  const ingredientByKey = new Map(projectRows.map((row) => [canonical(row.inci_name || row.display_name_en || row.display_name_fr), row]).filter(([key]) => key));
  const requested = new Map();
  for (const row of (Array.isArray(requestedOverrides) ? requestedOverrides : []).slice(0, 120)) {
    const key = canonical(row?.key || row?.inci_name);
    const decision = String(row?.decision || 'inherit');
    if (!key || !DECISIONS.has(decision) || !ingredientByKey.has(key)) continue;
    const ingredient = ingredientByKey.get(key);
    enforceDecision(policyMap.get(key) || null, decision, ingredient.inci_name || ingredient.display_name_en || key);
    requested.set(key, decision);
  }

  const storedOverrides = [];
  const statements = [];
  const printable = [];
  for (const row of projectRows) {
    const key = canonical(row.inci_name || row.display_name_en || row.display_name_fr);
    const policy = policyMap.get(key) || null;
    const decision = requested.get(key) || 'inherit';
    enforceDecision(policy, decision, row.inci_name || row.display_name_en || key);
    const finalPrint = effectivePrint(policy, row.required_on_label, decision);
    statements.push(db.prepare(`UPDATE packaging_project_ingredients SET required_on_label=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_ingredient_id=? AND packaging_project_id=?`).bind(finalPrint, row.packaging_project_ingredient_id, projectId));
    if (finalPrint) printable.push(row);
    if (decision !== 'inherit') storedOverrides.push({ key, inci_name: text(row.inci_name || row.display_name_en || key, 300), decision });
  }

  artwork.label_composition_overrides = storedOverrides;
  artwork.label_composition_build = BUILD;
  artwork.label_composition_reviewed_at = new Date().toISOString();
  artwork.label_composition_reviewed_by_user_id = Number(adminUser.user_id || 0) || null;
  const inci = printable.map((row) => text(row.inci_name, 300)).filter(Boolean).join(', ');
  const en = printable.map((row) => text(row.display_name_en || row.inci_name, 500)).filter(Boolean).join(', ');
  const fr = printable.map((row) => text(row.display_name_fr || row.inci_name, 500)).filter(Boolean).join(', ');
  statements.push(db.prepare(`UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?,artwork_json=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(inci || null, en || null, fr || null, JSON.stringify(artwork), adminUser.user_id, projectId));
  await db.batch(statements);
}

export async function onRequestGet(context) {
  const a = await access(context); if (a.error) return a.error;
  const url = new URL(context.request.url);
  const projectId = id(url.searchParams.get('project_id'));
  if (!projectId) return json({ ok: false, error: 'project_id is required.' }, 400);
  const composition = await compositionPayload(a.db, projectId);
  if (!composition) return json({ ok: false, error: 'Packaging project was not found.' }, 404);
  return json({ ok: true, ...composition });
}

export async function onRequestPost(context) {
  const a = await access(context); if (a.error) return a.error;
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Valid JSON body is required.' }, 400); }
  const action = text(body.action, 80);
  const projectId = id(body.packaging_project_id);
  if (!projectId) return json({ ok: false, error: 'Packaging project is required.' }, 400);
  try {
    if (action !== 'save_label_composition') return json({ ok: false, error: 'Unsupported Label Composition action.' }, 400);
    await saveComposition(a.db, a.adminUser, projectId, body.ingredient_overrides);
    const composition = await compositionPayload(a.db, projectId);
    if (!composition) throw new Error('Authoritative Packaging read-back failed after saving label composition.');
    return json({ ok: true, message: 'Label composition overrides saved and verified from D1.', ...composition });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Label Composition failed.', release: RELEASE, build: BUILD }, 409);
  }
}
