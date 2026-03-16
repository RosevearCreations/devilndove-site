// File: /functions/api/checkout-create-order.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map(item => ({
      product_id: Number(item.product_id),
      slug: normalizeText(item.slug),
      sku: normalizeText(item.sku),
      name: normalizeText(item.name),
      product_type: normalizeText(item.product_type).toLowerCase(),
      price_cents: Number(item.price_cents),
      currency: normalizeText(item.currency || "CAD").toUpperCase(),
      featured_image_url: normalizeText(item.featured_image_url),
      requires_shipping: Number(item.requires_shipping) === 1 ? 1 : 0,
      quantity: Number(item.quantity)
    }))
    .filter(item =>
      Number.isInteger(item.product_id) &&
      item.product_id > 0 &&
      item.name &&
      (item.product_type === "physical" || item.product_type === "digital") &&
      Number.isInteger(item.price_cents) &&
      item.price_cents >= 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
}

function calculateOrderNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const h = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DD-${y}${m}${d}-${h}${min}${s}-${rand}`;
}

async function getActiveProducts(env, productIds) {
  if (!productIds.length) return [];

  const placeholders = productIds.map(() => "?").join(", ");
  const stmt = env.DB.prepare(`
    SELECT
      p.product_id,
      p.slug,
      p.sku,
      p.name,
      p.product_type,
      p.status,
      p.price_cents,
      p.currency,
      p.taxable,
      p.tax_class_id,
      p.requires_shipping,
      p.digital_file_url,
      tc.code AS tax_class_code,
      tc.tax_rate AS tax_rate
    FROM products p
    LEFT JOIN tax_classes tc
      ON p.tax_class_id = tc.tax_class_id
    WHERE p.product_id IN (${placeholders})
      AND p.status = 'active'
  `);

  return stmt.bind(...productIds).all();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const customer_email = normalizeEmail(body.email);
  const customer_name = normalizeText(body.customer_name);
  const payment_method = normalizeText(body.payment_method || "paypal").toLowerCase();

  const shipping_address1 = normalizeText(body.shipping_address1);
  const shipping_address2 = normalizeText(body.shipping_address2);
  const shipping_city = normalizeText(body.shipping_city);
  const shipping_province = normalizeText(body.shipping_province);
  const shipping_postal_code = normalizeText(body.shipping_postal_code);
  const shipping_country = normalizeText(body.shipping_country || "Canada");

  const cart_items = normalizeCartItems(body.cart_items);

  if (!customer_email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!customer_name) {
    return json({ ok: false, error: "Customer name is required." }, 400);
  }

  if (!["paypal", "card"].includes(payment_method)) {
    return json({ ok: false, error: "Payment method must be paypal or card." }, 400);
  }

  if (!cart_items.length) {
    return json({ ok: false, error: "Your cart is empty." }, 400);
  }

  const productIds = [...new Set(cart_items.map(item => item.product_id))];
  const productsResult = await getActiveProducts(env, productIds);
  const productRows = productsResult.results || [];

  if (!productRows.length) {
    return json({ ok: false, error: "No valid active products were found in the cart." }, 400);
  }

  const productMap = new Map(productRows.map(row => [Number(row.product_id), row]));

  const validatedItems = [];
  for (const item of cart_items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return json({
        ok: false,
        error: `A cart item is no longer available: ${item.name || item.product_id}`
      }, 400);
    }

    validatedItems.push({
      product_id: Number(product.product_id),
      sku: product.sku || item.sku || null,
      product_name: product.name,
      product_type: product.product_type,
      unit_price_cents: Number(product.price_cents || 0),
      quantity: Number(item.quantity),
      line_subtotal_cents: Number(product.price_cents || 0) * Number(item.quantity),
      taxable: Number(product.taxable) === 0 ? 0 : 1,
      tax_class_code: product.tax_class_code || null,
      requires_shipping: Number(product.requires_shipping) === 1 ? 1 : 0,
      digital_file_url: product.digital_file_url || null,
      tax_rate: Number(product.tax_rate || 0)
    });
  }

  const subtotal_cents = validatedItems.reduce((sum, item) => sum + item.line_subtotal_cents, 0);
  const shipping_cents = 0;
  const discount_cents = 0;

  const tax_cents = validatedItems.reduce((sum, item) => {
    if (item.taxable !== 1) return sum;
    const lineTax = Math.round(item.line_subtotal_cents * item.tax_rate);
    return sum + lineTax;
  }, 0);

  const total_cents = subtotal_cents + shipping_cents + tax_cents - discount_cents;

  const hasPhysical = validatedItems.some(item => item.product_type === "physical");
  const hasDigital = validatedItems.some(item => item.product_type === "digital");

  const fulfillment_type =
    hasPhysical && hasDigital ? "mixed" : hasPhysical ? "shipping" : "digital";

  const order_number = calculateOrderNumber();

  const insertOrder = await env.DB.prepare(`
    INSERT INTO orders (
      order_number,
      user_id,
      customer_email,
      customer_name,
      order_status,
      fulfillment_type,
      currency,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      notes,
      created_at,
      updated_at
    )
    VALUES (?, NULL, ?, ?, 'pending', ?, 'CAD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
    .bind(
      order_number,
      customer_email,
      customer_name,
      fulfillment_type,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      customer_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      `Preferred payment method: ${payment_method}`
    )
    .run();

  const order_id = insertOrder?.meta?.last_row_id;

  for (const item of validatedItems) {
    await env.DB.prepare(`
      INSERT INTO order_items (
        order_id,
        product_id,
        sku,
        product_name,
        product_type,
        unit_price_cents,
        quantity,
        line_subtotal_cents,
        taxable,
        tax_class_code,
        requires_shipping,
        digital_file_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        order_id,
        item.product_id,
        item.sku,
        item.product_name,
        item.product_type,
        item.unit_price_cents,
        item.quantity,
        item.line_subtotal_cents,
        item.taxable,
        item.tax_class_code,
        item.requires_shipping,
        item.digital_file_url
      )
      .run();
  }

  await env.DB.prepare(`
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by_user_id,
      note,
      created_at
    )
    VALUES (?, NULL, 'pending', NULL, ?, CURRENT_TIMESTAMP)
  `)
    .bind(order_id, `Order created with payment method: ${payment_method}`)
    .run();

  const createdOrder = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      customer_email,
      customer_name,
      order_status,
      fulfillment_type,
      currency,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      notes,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  return json({
    ok: true,
    message: "Order created successfully.",
    order: createdOrder,
    items: validatedItems.map(item => ({
      product_id: item.product_id,
      sku: item.sku,
      product_name: item.product_name,
      product_type: item.product_type,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      line_subtotal_cents: item.line_subtotal_cents,
      taxable: item.taxable,
      tax_class_code: item.tax_class_code,
      requires_shipping: item.requires_shipping
    })),
    payment: {
      method: payment_method,
      provider_ready: false
    }
  }, 201);
}
