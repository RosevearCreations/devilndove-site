// Release 467 Build 36 — admin-only current read-only reliability snapshot.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import {
  CURRENT_RELIABILITY_RELEASE,
  CURRENT_RELIABILITY_BUILD,
  CURRENT_RELIABILITY_TITLE,
  CURRENT_RELIABILITY_AUTHORITY,
  loadCurrentReliability,
} from '../_lib/currentReliability.js';

const json = (data, status = 200) => jsonResponse({
  release: CURRENT_RELIABILITY_RELEASE,
  build: CURRENT_RELIABILITY_BUILD,
  title: CURRENT_RELIABILITY_TITLE,
  authority: CURRENT_RELIABILITY_AUTHORITY,
  ...data,
}, status, { 'Cache-Control': 'no-store' });

export async function onRequestGet({ request, env }) {
  const user = await getAdminUserFromRequest(request, env);
  if (!user) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    const reliability = await loadCurrentReliability(db, env);
    return json({ ok: true, mutation_capability: 'none', reliability });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Current reliability snapshot could not load.' }, 500);
  }
}
