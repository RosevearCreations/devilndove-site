// Release 462 — admin-only, read-only live resource binding diagnostic.
// D1 metadata reads plus R2 LIST(limit=1) only. No object bodies, D1 writes, R2 writes, provider calls, or publication.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 462;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });

async function bucketDiagnostic(bucket, binding) {
  if (!bucket || typeof bucket.list !== 'function') {
    return { binding, binding_available: false, list_success: false, listed_objects: 0, truncated: false, error: 'binding_unavailable' };
  }
  try {
    const page = await bucket.list({ limit: 1 });
    return {
      binding,
      binding_available: true,
      list_success: true,
      listed_objects: Array.isArray(page?.objects) ? page.objects.length : 0,
      truncated: Boolean(page?.truncated),
      error: null,
    };
  } catch (error) {
    return {
      binding,
      binding_available: true,
      list_success: false,
      listed_objects: 0,
      truncated: false,
      error: String(error?.message || error || 'R2 list failed').slice(0, 500),
    };
  }
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, release: RELEASE, error: 'Admin access required.', mutation_capability: 'none' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, release: RELEASE, error: 'Database binding missing.', mutation_capability: 'none' }, 500);

  try {
    const [tableRow, indexRow, fkRow, productMedia, caipPrivate] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count_value FROM sqlite_master WHERE type='table'").first(),
      db.prepare("SELECT COUNT(*) AS count_value FROM sqlite_master WHERE type='index'").first(),
      db.prepare('SELECT COUNT(*) AS count_value FROM pragma_foreign_key_check').first(),
      bucketDiagnostic(env.PRODUCT_MEDIA_BUCKET, 'PRODUCT_MEDIA_BUCKET'),
      bucketDiagnostic(env.CAIP_PRIVATE_MEDIA_BUCKET, 'CAIP_PRIVATE_MEDIA_BUCKET'),
    ]);
    return json({
      ok: true,
      release: RELEASE,
      authority: 'production_release462_promoted_resources',
      d1: {
        binding_available: true,
        table_count: Number(tableRow?.count_value || 0),
        index_count: Number(indexRow?.count_value || 0),
        foreign_key_violations: Number(fkRow?.count_value || 0),
      },
      r2: { product_media: productMedia, caip_private_media: caipPrivate },
      safety: {
        d1_mutation_executed: false,
        r2_body_read_executed: false,
        r2_mutation_executed: false,
        provider_execution_active: false,
        provider_publication_active: false,
      },
      mutation_capability: 'none',
    });
  } catch (error) {
    return json({
      ok: false,
      release: RELEASE,
      error: String(error?.message || error || 'Resource diagnostic failed').slice(0, 700),
      mutation_capability: 'none',
    }, 500);
  }
}
