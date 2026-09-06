// Temporary read-only Product R2 inventory bridge template.
// The runner injects only a SHA-256 hash of an ephemeral token.
const TOKEN_SHA256 = '__TOKEN_SHA256__';

function respond(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(bytes) {
  return hex(await crypto.subtle.digest('SHA-256', bytes));
}

async function authorized(request) {
  const token = request.headers.get('x-product-inventory-token') || '';
  return (await sha256(new TextEncoder().encode(token))) === TOKEN_SHA256;
}

function snapshot(object) {
  return {
    key: String(object?.key || ''),
    size: Number(object?.size || 0),
    etag: String(object?.etag || ''),
    uploaded: object?.uploaded ? new Date(object.uploaded).toISOString() : null,
    storageClass: String(object?.storageClass || 'Standard'),
  };
}

export async function onRequestPost({ request, env }) {
  if (!(await authorized(request))) return respond({ ok: false, error: 'forbidden' }, 403);
  const body = await request.json().catch(() => ({}));
  const target = String(body.target || '').trim().toLowerCase();
  const bucket = target === 'source' ? env.PRODUCT_SOURCE_BUCKET : target === 'destination' ? env.PRODUCT_DESTINATION_BUCKET : null;
  if (!bucket || typeof bucket.list !== 'function') return respond({ ok: false, error: 'invalid target or binding missing' }, 400);
  const cursor = String(body.cursor || '').trim();
  const limit = Math.max(1, Math.min(500, Math.trunc(Number(body.limit || 500)) || 500));
  const listing = await bucket.list({
    prefix: 'products/',
    limit,
    ...(cursor ? { cursor } : {}),
  });
  return respond({
    ok: true,
    target,
    processed: (listing.objects || []).length,
    results: (listing.objects || []).map(snapshot),
    done: !listing.truncated,
    next_cursor: listing.truncated ? String(listing.cursor || '') : '',
    mutation: false,
  });
}
