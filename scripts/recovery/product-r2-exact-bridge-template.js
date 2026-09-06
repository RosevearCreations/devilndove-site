// Temporary recovery-only Product R2 Pages Function template.
// The runner injects the exact key -> SHA-256 authority and an ephemeral token hash.
// Existing objects are never overwritten. No D1 binding or delete path is present.
const EXPECTED = Object.freeze(__EXPECTED_JSON__);
const TOKEN_SHA256 = '__TOKEN_SHA256__';

function json(data, status = 200) {
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
  const token = request.headers.get('x-product-recovery-token') || '';
  return (await sha256(new TextEncoder().encode(token))) === TOKEN_SHA256;
}

async function exactObject(bucket, key, expectedSha) {
  const object = await bucket.get(key);
  if (!object) return { state: 'missing' };
  const bytes = await object.arrayBuffer();
  const actualSha = await sha256(bytes);
  if (actualSha === expectedSha) {
    return { state: 'exact', size: bytes.byteLength, sha256: actualSha };
  }
  return { state: 'conflict', size: bytes.byteLength, sha256: actualSha };
}

export async function onRequestPost({ request, env }) {
  if (!env.PRODUCT_PROD_BUCKET) return json({ ok: false, error: 'binding missing' }, 503);
  if (!(await authorized(request))) return json({ ok: false, error: 'forbidden' }, 403);

  const key = String(request.headers.get('x-recovery-key') || '').trim();
  const expectedSha = EXPECTED[key];
  if (!expectedSha) return json({ ok: false, error: 'key not authorized' }, 403);

  // Write-free body-hash probe. This proves an unauthorized body cannot pass the
  // content lock regardless of whether the object already exists.
  if (request.headers.get('x-recovery-probe') === 'hash-lock') {
    const probeBytes = await request.arrayBuffer();
    const probeSha = await sha256(probeBytes);
    if (probeSha !== expectedSha) {
      return json({
        ok: false,
        key,
        probe: true,
        error: 'body hash not authorized',
        expected_sha256: expectedSha,
        actual_sha256: probeSha,
      }, 422);
    }
    return json({ ok: true, key, probe: true, state: 'hash_lock_exact' });
  }

  const before = await exactObject(env.PRODUCT_PROD_BUCKET, key, expectedSha);
  if (before.state === 'exact') return json({ ok: true, key, ...before, state: 'already_exact' });
  if (before.state === 'conflict') return json({ ok: false, key, ...before }, 409);

  const bytes = await request.arrayBuffer();
  const bodySha = await sha256(bytes);
  if (bodySha !== expectedSha) {
    return json({
      ok: false,
      key,
      error: 'body hash not authorized',
      expected_sha256: expectedSha,
      actual_sha256: bodySha,
    }, 422);
  }

  const stored = await env.PRODUCT_PROD_BUCKET.put(key, bytes, {
    onlyIf: new Headers({ 'If-None-Match': '*' }),
    httpMetadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      recovery: 'product-drive-exact-20260906',
      recovery_sha256: expectedSha,
    },
  });

  if (stored === null) {
    const raced = await exactObject(env.PRODUCT_PROD_BUCKET, key, expectedSha);
    if (raced.state === 'exact') return json({ ok: true, key, ...raced, state: 'already_exact' });
    return json({ ok: false, key, error: 'conditional write refused', ...raced }, 409);
  }

  const after = await exactObject(env.PRODUCT_PROD_BUCKET, key, expectedSha);
  if (after.state !== 'exact') {
    return json({ ok: false, key, error: 'read-back verification failed', ...after }, 500);
  }
  return json({ ok: true, key, ...after, state: 'restored' });
}
