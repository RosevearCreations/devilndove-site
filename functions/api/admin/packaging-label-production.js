// Release 467 Build 44 — Label Production & Reuse.
// Read-only production/reuse authority over existing Packaging versions, printer profiles,
// export history, and physical print-test evidence. No schema creation or request-time DDL.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 44;
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value, max = 1000) => normalizeText(value).slice(0, max);
const id = (value) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; };
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 503) };
  return { adminUser, db };
}

function profile(row = {}) {
  const scale = Math.max(1, number(row.scale_percent, 100));
  return {
    packaging_printer_profile_id: id(row.packaging_printer_profile_id),
    profile_name: text(row.profile_name, 180),
    paper_stock: text(row.paper_stock, 180) || 'Letter 8.5 × 11 in',
    margin_mm: Math.max(0, number(row.margin_mm, 0)),
    gap_mm: Math.max(0, number(row.gap_mm, 0)),
    scale_percent: scale,
    auto_rotate: Number(row.auto_rotate) !== 0,
    is_default_label: Number(row.is_default_label) === 1,
    settings_note: text(row.settings_note, 1000) || '',
    true_size_ready: scale === 100,
  };
}

function qa(row = {}) {
  const passed = String(row.test_status || '') === 'passed'
    && number(row.scale_percent, 0) === 100
    && String(row.wrap_fit_status || '') === 'passed'
    && String(row.legibility_status || '') === 'passed'
    && String(row.overlap_status || '') === 'passed';
  return {
    print_test_id: id(row.print_test_id),
    packaging_project_version_id: id(row.packaging_project_version_id) || null,
    test_status: text(row.test_status, 30) || 'needs_test',
    printer_name: text(row.printer_name, 180) || null,
    paper_stock: text(row.paper_stock, 180) || null,
    scale_percent: number(row.scale_percent, 0),
    wrap_fit_status: text(row.wrap_fit_status, 30) || 'not_checked',
    legibility_status: text(row.legibility_status, 30) || 'not_checked',
    overlap_status: text(row.overlap_status, 30) || 'not_checked',
    proof_image_url: text(row.proof_image_url, 1000) || null,
    notes: text(row.notes, 2000) || null,
    printed_at: row.printed_at || null,
    created_at: row.created_at || null,
    production_qa_passed: passed,
  };
}

async function payload(db, projectId) {
  const project = await db.prepare(`
    SELECT pp.packaging_project_id,pp.project_key,pp.project_name,pp.project_status,pp.compliance_status,
           pp.packaging_template_id,pp.updated_at,t.template_name,t.package_type,t.page_width_mm,t.page_height_mm
      FROM packaging_projects pp
      JOIN packaging_templates t ON t.packaging_template_id=pp.packaging_template_id
     WHERE pp.packaging_project_id=?
  `).bind(projectId).first();
  if (!project) return null;

  const printers = rows(await db.prepare(`
    SELECT packaging_printer_profile_id,profile_name,paper_stock,margin_mm,gap_mm,scale_percent,
           auto_rotate,settings_note,is_default_label
      FROM packaging_printer_profiles
     WHERE is_active=1
     ORDER BY is_default_label DESC,LOWER(profile_name),packaging_printer_profile_id
  `).all()).map(profile);

  const tests = rows(await db.prepare(`
    SELECT print_test_id,packaging_project_version_id,test_status,printed_at,printer_name,paper_stock,
           scale_percent,wrap_fit_status,legibility_status,overlap_status,proof_image_url,notes,created_at
      FROM soap_label_print_tests
     WHERE packaging_project_id=?
     ORDER BY created_at DESC,print_test_id DESC
     LIMIT 100
  `).bind(projectId).all()).map(qa);

  const versions = rows(await db.prepare(`
    SELECT packaging_project_version_id,version_number,version_label,review_status,reviewed_at,
           created_at,CASE WHEN COALESCE(svg_markup,'')<>'' THEN 1 ELSE 0 END AS has_svg
      FROM packaging_project_versions
     WHERE packaging_project_id=?
     ORDER BY version_number DESC,packaging_project_version_id DESC
  `).bind(projectId).all()).map((row) => {
    const versionId = id(row.packaging_project_version_id);
    const qaRows = tests.filter((item) => item.packaging_project_version_id === versionId);
    const passedQa = qaRows.find((item) => item.production_qa_passed) || null;
    const immutableArtifact = Number(row.has_svg) === 1;
    const approved = String(row.review_status || '') === 'approved';
    return {
      packaging_project_version_id: versionId,
      version_number: number(row.version_number),
      version_label: text(row.version_label, 160) || `Version ${number(row.version_number)}`,
      review_status: text(row.review_status, 40) || 'needs_review',
      reviewed_at: row.reviewed_at || null,
      created_at: row.created_at || null,
      immutable_svg_artifact: immutableArtifact,
      qa_history_count: qaRows.length,
      latest_qa: qaRows[0] || null,
      passed_qa: passedQa,
      reusable_production_version: approved && immutableArtifact && Boolean(passedQa),
    };
  });

  const exports = rows(await db.prepare(`
    SELECT packaging_export_history_id,packaging_project_version_id,export_format,export_status,
           file_name,created_at
      FROM packaging_export_history
     WHERE packaging_project_id=?
     ORDER BY created_at DESC,packaging_export_history_id DESC
     LIMIT 100
  `).bind(projectId).all()).map((row) => ({
    packaging_export_history_id: id(row.packaging_export_history_id),
    packaging_project_version_id: id(row.packaging_project_version_id) || null,
    export_format: text(row.export_format, 30),
    export_status: text(row.export_status, 30),
    file_name: text(row.file_name, 300) || null,
    created_at: row.created_at || null,
  }));

  const exactProfiles = printers.filter((item) => item.true_size_ready);
  const reusable = versions.filter((item) => item.reusable_production_version);
  const blockers = [];
  if (!printers.length) blockers.push('Save at least one printer profile before production printing.');
  if (printers.length && !exactProfiles.length) blockers.push('At least one active printer profile must use exact 100% scale.');
  if (!versions.length) blockers.push('Save an immutable Packaging review version before production reuse.');
  if (versions.length && !versions.some((item) => item.review_status === 'approved')) blockers.push('Approve a saved Packaging version before production reuse.');
  if (versions.some((item) => item.review_status === 'approved') && !reusable.length) blockers.push('An approved saved version still requires matching passed physical QA at 100% scale, with wrap fit, legibility and overlap all passed.');

  return {
    release: RELEASE,
    build: BUILD,
    project: {
      packaging_project_id: id(project.packaging_project_id),
      project_key: text(project.project_key, 120),
      project_name: text(project.project_name, 180),
      project_status: text(project.project_status, 40),
      compliance_status: text(project.compliance_status, 40),
      packaging_template_id: id(project.packaging_template_id),
      template_name: text(project.template_name, 180),
      package_type: text(project.package_type, 80),
      width_mm: number(project.page_width_mm),
      height_mm: number(project.page_height_mm),
      updated_at: project.updated_at || null,
    },
    printer_profiles: printers,
    exact_size_printer_profiles: exactProfiles,
    versions,
    reusable_versions: reusable,
    qa_history: tests,
    export_history: exports,
    production_ready: blockers.length === 0 && reusable.length > 0 && exactProfiles.length > 0,
    blockers,
    rules: {
      printer_scale_percent: 100,
      version_review_status: 'approved',
      immutable_svg_required: true,
      physical_qa_status: 'passed',
      wrap_fit_status: 'passed',
      legibility_status: 'passed',
      overlap_status: 'passed',
      build41_safe_area_required_at_print_time: true,
      build43_composition_required_at_print_time: true
    },
    schema_change: false,
    request_time_ddl: false,
    d1_mutation: false,
    r2_mutation: false,
    production_contacted: false,
    authoritative_readback: true,
  };
}

export async function onRequestGet(context) {
  const a = await access(context); if (a.error) return a.error;
  const url = new URL(context.request.url);
  const projectId = id(url.searchParams.get('project_id'));
  if (!projectId) return json({ ok: false, error: 'project_id is required.' }, 400);
  try {
    const data = await payload(a.db, projectId);
    if (!data) return json({ ok: false, error: 'Packaging project was not found.' }, 404);
    return json({ ok: true, ...data });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Label Production & Reuse authority could not be loaded.', release: RELEASE, build: BUILD }, 503);
  }
}
