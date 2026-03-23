// File: /functions/api/admin/bulk-update-products.js
// Brief description: Applies bulk product updates for admin workflow cleanup. It supports
// bulk status changes, inventory updates, shipping/tax flags, and archive actions so admins
// can make controlled product changes without editing items one by one.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(`
    SELECT s.session_id, s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || '').toLowerCase() !== 'admin') return null;

  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || ''
  };
}

function normalizeStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return ['draft', 'active', 'archived'].includes(status) ? status : '';
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const product_ids = Array.isArray(body.product_ids)
    ? body.product_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const updates = body && typeof body.updates === 'object' ? body.updates : {};

  if (!product_ids.length) {
    return json({ ok: false, error: 'At least one valid product_id is required.' }, 400);
  }

  const setParts = [];
  const bindings = [];

  if (updates.status !== undefined) {
    const status = normalizeStatus(updates.status);
    if (!status) return json({ ok: false, error: 'Invalid bulk status.' }, 400);
    setParts.push('status = ?');
    bindings.push(status);
  }

  if (updates.inventory_quantity !== undefined) {
    const inventory = Number(updates.inventory_quantity);
    if (!Number.isInteger(inventory) || inventory < 0) {
      return json({ ok: false, error: 'inventory_quantity must be a whole number.' }, 400);
    }
    setParts.push('inventory_quantity = ?');
    bindings.push(inventory);
  }

  if (updates.inventory_tracking !== undefined) {
    setParts.push('inventory_tracking = ?');
    bindings.push(Number(updates.inventory_tracking) === 1 ? 1 : 0);
  }

  if (updates.requires_shipping !== undefined) {
    setParts.push('requires_shipping = ?');
    bindings.push(Number(updates.requires_shipping) === 1 ? 1 : 0);
  }

  if (updates.taxable !== undefined) {
    setParts.push('taxable = ?');
    bindings.push(Number(updates.taxable) === 0 ? 0 : 1);
  }

  if (updates.tax_class_id !== undefined) {
    const taxClassId = normalizeText(updates.tax_class_id);
    setParts.push('tax_class_id = ?');
    bindings.push(taxClassId ? Number(taxClassId) : null);
  }

  if (!setParts.length) {
    return json({ ok: false, error: 'No valid bulk updates were provided.' }, 400);
  }

  setParts.push('updated_at = CURRENT_TIMESTAMP');

  const placeholders = product_ids.map(() => '?').join(', ');
  const sql = `UPDATE products SET ${setParts.join(', ')} WHERE product_id IN (${placeholders})`;
  await env.DB.prepare(sql).bind(...bindings, ...product_ids).run();

  return json({
    ok: true,
    message: 'Bulk product update completed.',
    updated_count: product_ids.length,
    updated_by: adminUser
  });
}
