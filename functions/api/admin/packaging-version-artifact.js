// Devil n Dove Build 299 Packaging saved-version artifact read.
// Returns exactly one immutable SVG review artifact without bloating the normal
// Packaging bootstrap payload with every historical SVG version.

import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = 299;

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function id(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function safeJson(value, fallback = {}) {
  try {
    const parsed = JSON.parse(String(value || ''));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.', build: BUILD }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.', build: BUILD }, 500);

  const url = new URL(context.request.url);
  const projectId = id(url.searchParams.get('packaging_project_id'));
  const versionId = id(url.searchParams.get('packaging_project_version_id'));
  if (!projectId || !versionId) {
    return json({
      ok: false,
      error: 'Packaging project and saved version are required.',
      error_code: 'packaging_version_artifact_id_required',
      build: BUILD,
    }, 400);
  }

  try {
    const row = await db.prepare(`
      SELECT
        packaging_project_version_id,
        packaging_project_id,
        version_number,
        version_label,
        review_status,
        snapshot_json,
        svg_markup,
        created_at
      FROM packaging_project_versions
      WHERE packaging_project_version_id = ?
        AND packaging_project_id = ?
      LIMIT 1
    `).bind(versionId, projectId).first();

    if (!row) {
      return json({
        ok: false,
        error: 'The selected Packaging review version was not found for this project.',
        error_code: 'packaging_version_artifact_not_found',
        build: BUILD,
      }, 404);
    }

    const svgMarkup = String(row.svg_markup || '').trim();
    if (!svgMarkup) {
      return json({
        ok: false,
        error: 'The selected Packaging review version has no stored SVG artifact.',
        error_code: 'packaging_version_svg_missing',
        build: BUILD,
      }, 409);
    }

    const snapshot = safeJson(row.snapshot_json, {});
    return json({
      ok: true,
      build: BUILD,
      read_authority: 'packaging-version-artifact',
      immutable_saved_version: true,
      artifact: {
        packaging_project_version_id: id(row.packaging_project_version_id),
        packaging_project_id: id(row.packaging_project_id),
        version_number: Number(row.version_number || 0),
        version_label: String(row.version_label || ''),
        review_status: String(row.review_status || 'needs_review'),
        created_at: String(row.created_at || ''),
        checksum: String(snapshot?.checksum || ''),
        svg_markup: svgMarkup,
      },
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'packaging_studio',
      incident_code: 'packaging_version_artifact_failed',
      severity: 'error',
      message: error?.message || 'Packaging saved-version artifact failed to load.',
      related_user_id: adminUser.user_id,
      details: {
        build: BUILD,
        packaging_project_id: projectId,
        packaging_project_version_id: versionId,
        error: String(error?.stack || error),
      },
    }).catch(() => null);

    return json({
      ok: false,
      error: 'The selected Packaging review artifact could not be loaded.',
      error_code: 'packaging_version_artifact_failed',
      build: BUILD,
    }, 500);
  }
}
