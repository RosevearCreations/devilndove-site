// File: /functions/api/admin/create-product.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      users.user_id,
      users.email,
      users.display_name,
      users.role,
      users.is_active
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
      AND sessions.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  return sessionUser || null;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return { error: json({ ok: false, error: "Missing session token." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid session." }, 401) };
  }

  if (!sessionUser.is_active) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  if (sessionUser.role !== "admin") {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return { sessionUser };
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const name = String(body.name || "").trim();
  const slug = normalizeSlug(body.slug || body.name || "");
  const sku = String(body.sku || "").trim() || null;
  const short_description = String(body.short_description || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const product_type = String(body.product_type || "").trim().toLowerCase();
  const status = String(body.status || "draft").trim().toLowerCase();
  const price_cents = Number(body.price_cents);
  const compare_at_price_cents =
    body.compare_at_price_cents == null || body.compare_at_price_cents === ""
      ? null
      : Number(body.compare_at_price_cents);
  const currency = String(body.currency || "CAD").trim().toUpperCase();
  const taxable = Number(body.taxable) === 0 ? 0 : 1;
  const tax_class_id =
    body.tax_class_id == null || body.tax_class_id === ""
      ? null
      : Number(body.tax_class_id);
  const requires_shipping = Number(body.requires_shipping) === 1 ? 1 : 0;
  const weight_grams =
    body.weight_grams == null || body.weight_grams === ""
      ? null
      : Number(body.weight_grams);
  const inventory_tracking = Number(body.inventory_tracking) === 1 ? 1 : 0;
  const inventory_quantity =
    body.inventory_quantity == null || body.inventory_quantity === ""
      ? 0
      : Number(body.inventory_quantity);
  const digital_file_url = String(body.digital_file_url || "").trim() || null;
  const featured_image_url = String(body.featured_image_url || "").trim() || null;
  const sort_order =
    body.sort_order == null || body.sort_order === ""
      ? 0
      : Number(body.sort_order);

  if (!name) {
    return json({ ok: false, error: "Product name is required." }, 400);
  }

  if (!slug) {
    return json({ ok: false, error: "A valid slug is required." }, 400);
  }

  if (product_type !== "physical" && product_type !== "digital") {
    return json({ ok: false, error: "Product type must be physical or digital." }, 400);
  }

  if (!["draft", "active", "archived"].includes(status)) {
    return json({ ok: false, error: "Status must be draft, active, or archived." }, 400);
  }

  if (!Number.isInteger(price_cents) || price_cents < 0) {
    return json({ ok: false, error: "price_cents must be a valid whole number of cents." }, 400);
  }

  if (
    compare_at_price_cents !== null &&
    (!Number.isInteger(compare_at_price_cents) || compare_at_price_cents < 0)
  ) {
    return json({ ok: false, error: "compare_at_price_cents must be a valid whole number of cents." }, 400);
  }

  if (tax_class_id !== null && (!Number.isInteger(tax_class_id) || tax_class_id <= 0)) {
    return json({ ok: false, error: "tax_class_id must be a valid id." }, 400);
  }

  if (weight_grams !== null && (!Number.isInteger(weight_grams) || weight_grams < 0)) {
    return json({ ok: false, error: "weight_grams must be a valid whole number." }, 400);
  }

  if (!Number.isInteger(inventory_quantity) || inventory_quantity < 0) {
    return json({ ok: false, error: "inventory_quantity must be a valid whole number." }, 400);
  }

  if (!Number.isInteger(sort_order)) {
    return json({ ok: false, error: "sort_order must be a valid whole number." }, 400);
  }

  const existingSlug = await env.DB.prepare(`
    SELECT product_id
    FROM products
    WHERE slug = ?
    LIMIT 1
  `)
    .bind(slug)
    .first();

  if (existingSlug) {
    return json({ ok: false, error: "That product slug already exists." }, 409);
  }

  if (sku) {
    const existingSku = await env.DB.prepare(`
      SELECT product_id
      FROM products
      WHERE sku = ?
      LIMIT 1
    `)
      .bind(sku)
      .first();

    if (existingSku) {
      return json({ ok: false, error: "That SKU already exists." }, 409);
    }
  }

  if (tax_class_id !== null) {
    const taxClass = await env.DB.prepare(`
      SELECT tax_class_id
      FROM tax_classes
      WHERE tax_class_id = ?
        AND is_active = 1
      LIMIT 1
    `)
      .bind(tax_class_id)
      .first();

    if (!taxClass) {
      return json({ ok: false, error: "Selected tax class was not found." }, 400);
    }
  }

  const insertResult = await env.DB.prepare(`
    INSERT INTO products (
      slug,
      sku,
      name,
      short_description,
      description,
      product_type,
      status,
      price_cents,
      compare_at_price_cents,
      currency,
      taxable,
      tax_class_id,
      requires_shipping,
      weight_grams,
      inventory_tracking,
      inventory_quantity,
      digital_file_url,
      featured_image_url,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
    .bind(
      slug,
      sku,
      name,
      short_description,
      description,
      product_type,
      status,
      price_cents,
      compare_at_price_cents,
      currency,
      taxable,
      tax_class_id,
      requires_shipping,
      weight_grams,
      inventory_tracking,
      inventory_quantity,
      digital_file_url,
      featured_image_url,
      sort_order
    )
    .run();

  const newProductId = insertResult?.meta?.last_row_id;

  const createdProduct = await env.DB.prepare(`
    SELECT
      product_id,
      slug,
      sku,
      name,
      short_description,
      description,
      product_type,
      status,
      price_cents,
      compare_at_price_cents,
      currency,
      taxable,
      tax_class_id,
      requires_shipping,
      weight_grams,
      inventory_tracking,
      inventory_quantity,
      digital_file_url,
      featured_image_url,
      sort_order,
      created_at,
      updated_at
    FROM products
    WHERE product_id = ?
    LIMIT 1
  `)
    .bind(newProductId)
    .first();

  return json({
    ok: true,
    message: "Product created successfully.",
    product: createdProduct
  }, 201);
}
