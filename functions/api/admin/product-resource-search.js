// Build 244: bounded server-side D1 resource search for Inventory Operations; keeps the full catalog searchable without loading it all at once.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { searchResources } from './_productResourcesData.js';

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const url = new URL(request.url);
    const q = normalizeText(url.searchParams.get('q')).toLowerCase();
    const limit = Math.max(25, Math.min(400, Number(url.searchParams.get('limit') || 240)));
    const resources = await searchResources(db, env, q, limit);
    return jsonResponse({ ok: true, resources, query: q });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to search inventory resources.' }, 500);
  }
}
