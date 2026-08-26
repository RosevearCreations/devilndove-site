// Build 244/440: bounded server-side D1 resource search for Inventory Operations;
// keeps the full catalog searchable without loading it all at once. Build 440 also
// normalizes literal object-key URL characters so R2 names containing # are not
// truncated by the browser as URL fragments.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { searchResources } from './_productResourcesData.js';

export function browserSafeResourceImageUrl(value) {
  const raw = normalizeText(value);
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  // A literal # in an R2 object name is part of the key, not a browser fragment.
  // Escape it before URL parsing; URL then safely percent-encodes spaces and other
  // path characters without changing the underlying object key.
  const escaped = raw.replace(/#/g, '%23');
  try {
    return new URL(escaped).toString();
  } catch {
    return escaped.replace(/ /g, '%20');
  }
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const url = new URL(request.url);
    const q = normalizeText(url.searchParams.get('q')).toLowerCase();
    const limit = Math.max(25, Math.min(400, Number(url.searchParams.get('limit') || 240)));
    const resources = (await searchResources(db, env, q, limit)).map((resource) => ({
      ...resource,
      image_url: browserSafeResourceImageUrl(resource?.image_url || '')
    }));
    return jsonResponse({ ok: true, resources, query: q });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to search inventory resources.' }, 500);
  }
}
