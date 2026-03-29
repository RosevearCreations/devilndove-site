import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

// File: /functions/api/admin/media-upload.js
// Brief description: Accepts admin-authenticated image uploads and stores them in the configured
// R2 bucket so product media can be uploaded directly instead of only pasting URLs.

function json(data, status = 200) { return jsonResponse(data, status); }



function sanitizeFilename(filename) {
  const cleaned = String(filename || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'upload';
}

function inferExtension(filename, mimeType) {
  const fromName = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif'
  };
  return map[String(mimeType || '').toLowerCase()] || 'bin';
}

function buildPublicUrl(env, objectKey) {
  const base = normalizeText(env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL);
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${String(objectKey || '').replace(/^\/+/, '')}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const bucket = env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  if (!bucket || typeof bucket.put !== 'function') {
    return json({ ok: false, error: 'R2 media bucket binding is missing.' }, 500);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Expected multipart/form-data upload.' }, 400);
  }

  const file = form.get('file');
  const productId = Number(form.get('product_id') || 0);
  if (!file || typeof file.arrayBuffer !== 'function') {
    return json({ ok: false, error: 'An image file is required.' }, 400);
  }

  const mimeType = normalizeText(file.type || 'application/octet-stream').toLowerCase();
  if (!mimeType.startsWith('image/')) {
    return json({ ok: false, error: 'Only image uploads are supported.' }, 400);
  }

  const fileSize = Number(file.size || 0);
  if (fileSize <= 0) {
    return json({ ok: false, error: 'Uploaded file is empty.' }, 400);
  }
  if (fileSize > 10 * 1024 * 1024) {
    return json({ ok: false, error: 'Image uploads must be 10 MB or smaller.' }, 400);
  }

  const originalName = sanitizeFilename(file.name || 'upload');
  const extension = inferExtension(originalName, mimeType);
  const safeProductId = Number.isInteger(productId) && productId > 0 ? productId : null;
  const objectKey = [
    'products',
    safeProductId ? String(safeProductId) : 'unassigned',
    `${Date.now()}-${crypto.randomUUID()}.${extension}`
  ].join('/');

  const buffer = await file.arrayBuffer();
  await bucket.put(objectKey, buffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000, immutable'
    },
    customMetadata: {
      original_name: originalName,
      product_id: safeProductId ? String(safeProductId) : '',
      uploaded_by_user_id: String(adminUser.user_id || '')
    }
  });

  const publicUrl = buildPublicUrl(env, objectKey);

  try {
    await db.prepare(`
      INSERT INTO media_assets (
        product_id,
        storage_provider,
        bucket_name,
        object_key,
        public_url,
        original_filename,
        mime_type,
        file_size_bytes,
        created_by_user_id,
        created_at,
        updated_at
      ) VALUES (?, 'r2', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      safeProductId,
      normalizeText(env.PRODUCT_MEDIA_BUCKET_NAME || env.R2_BUCKET_NAME || 'product-media'),
      objectKey,
      publicUrl || null,
      originalName,
      mimeType,
      fileSize,
      adminUser.user_id
    ).run();
  } catch {
    // schema may not be migrated yet; upload itself already succeeded
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: "media_upload",
    target_type: "media_asset",
    target_key: objectKey,
    target_id: safeProductId || null,
    details: { product_id: safeProductId, mime_type: mimeType, file_size_bytes: fileSize, public_url: publicUrl || null }
  });

  return json({
    ok: true,
    message: 'Image uploaded successfully.',
    asset: {
      product_id: safeProductId,
      object_key: objectKey,
      public_url: publicUrl,
      original_filename: originalName,
      mime_type: mimeType,
      file_size_bytes: fileSize
    }
  });
}
