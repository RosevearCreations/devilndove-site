// Devil n Dove Build 292 Packaging Studio legacy-route retirement adapter.
// GET remains a temporary compatibility read surface for the next read-boundary build.
// Direct POST authority is retired; the active application writes through /api/admin/packaging-write.

import { onRequestGet as loadLegacyPackagingStudio } from '../_lib/packagingDomainService.js';
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = 292;
const REPLACEMENT_WRITE_PATH = '/api/admin/packaging-write';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

export async function onRequestGet(context) {
  return loadLegacyPackagingStudio(context);
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  return json({
    ok: false,
    error: 'The legacy Packaging Studio POST endpoint is retired. Use the native Packaging write endpoint.',
    error_code: 'packaging_legacy_post_retired',
    build: BUILD,
    legacy_post_retired: true,
    replacement_path: REPLACEMENT_WRITE_PATH,
  }, 410);
}
