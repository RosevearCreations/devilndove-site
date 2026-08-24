// Devil n Dove Build 294 Packaging Studio legacy-route retirement adapter.
// Direct GET authority is retired; the active application reads through /api/admin/packaging-bootstrap.
// Direct POST authority remains retired by Build 292.

import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = 294;
const LEGACY_POST_RETIREMENT_BUILD = 292;
const REPLACEMENT_READ_PATH = '/api/admin/packaging-bootstrap';
const REPLACEMENT_WRITE_PATH = '/api/admin/packaging-write';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  return json({
    ok: false,
    error: 'The legacy Packaging Studio GET endpoint is retired. Use the native Packaging bootstrap endpoint.',
    error_code: 'packaging_legacy_get_retired',
    build: BUILD,
    legacy_get_retired: true,
    replacement_path: REPLACEMENT_READ_PATH,
  }, 410);
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  return json({
    ok: false,
    error: 'The legacy Packaging Studio POST endpoint is retired. Use the native Packaging write endpoint.',
    error_code: 'packaging_legacy_post_retired',
    build: LEGACY_POST_RETIREMENT_BUILD,
    legacy_post_retired: true,
    replacement_path: REPLACEMENT_WRITE_PATH,
  }, 410);
}
