// File: /functions/api/checkout-create-order.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizePaymentMethod(value) {
  const method = normalizeText(value).toLowerCase();

  if (["paypal", "stripe", "square", "manual", "other"].includes(method)) {
    return method;
  }

  if (method === "card") {
    return "stripe";
  }

  return "";
}

function determineFulfillmentType(items) {
  let hasPhysical = false;
  let hasDigital = false;

  for (const item of items) {
    const type = String(item.product_type || "").toLowerCase();
    const requiresShipping =
      Number(item.requires_shipping || 0) === 1 ||
      type === "physical";

    if (requiresShipping) {
      hasPhysical = true;
    } else {
      hasDigital = true;
    }
  }

  if (hasPhysical && hasDigital) return "mixed";
  if (hasPhysical) return "shipping";
  return "digital";
}

function needsShippingAddress(fulfillmentType) {
  return fulfillmentType === "shipping" || fulfillmentType === "mixed";
}

function calculateTaxCents(subtotalCents, shippingCents = 0) {
  const taxRate = 0.13;
  const taxableBase = Number(subtotalCents || 0) + Number(shippingCents || 0);
  return Math.round(taxableBase * taxRate);
}

function escapeHistoryNoteValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const customer_email = normalizeText(body.email).toLowerCase();
  const customer_name = normalizeText(body.customer_name);
  const shipping_name = normalizeOptionalText(body.shipping_name || body.customer_name);

  const shipping_address1 = normalizeOptionalText(body.shipping_address1);
  const shipping_address2 = normalizeOptionalText(body.shipping_address2);
  const shipping_city = normalizeOptionalText(body.shipping_city);
  const shipping_province = normalizeOptionalText(body.shipping_province);
  const shipping_postal_code = normalizeOptionalText(body.shipping_postal_code);
  const shipping_country = normalizeOptionalText(body.shipping_country || "Canada");
  const notes = normalizeOptionalText(body.notes);
  const payment_method = normalizePaymentMethod(body.payment_method);
  const rawCartItems = Array.isArray(body.cart_items) ? body.cart_items : [];

  if (!customer_email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!customer_name) {
    return json({ ok: false, error: "Customer name is required." }, 400);
  }

  if (!payment_method) {
    return json({ ok: false, error: "A valid payment_method is required." }, 400);
  }

  if (!rawCartItems.length) {
    return json({ ok: false, error: "Cart is empty." }, 400);
  }

  const normalizedCartItems = rawCartItems.map((item) => {
    const product_id = Number(item.product_id || 0);
    const quantity = Number(item.quantity || 0);

    return {
      product_id,
      quantity,
      name: normalizeText(item.name),
      product_type: normalizeText(item.product_type).toLowerCase(),
      requires_shipping: Number(item.requires_shipping || 0),
      price_cents: Number(item.price_cents || 0),
      currency: normalizeText(item.currency || "CAD").toUpperCase(),
      image_url: normalizeOptionalText(item.image_url),
      sku: normalizeOptionalText(item.sku)
    };
  });

  for (const item of normalizedCartItems) {
    if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
      return json({ ok: false, error: "Each cart item must include a valid product_id." }, 400);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return json({ ok: false, error: "Each cart item must include a valid quantity." }, 400);
    }
  }

  const productIds = normalizedCartItems.map((item) => item.product_id);
  const placeholders = productIds.map(() => "?").join(", ");

  const productQuery = `
    SELECT
      product_id,
      name,
      slug,
      sku,
      product_type,
      price_cents,
      compare_at_price_cents,
      currency,
      product_state,
      is_active,
      track_inventory,
      inventory_qty,
      allow_backorders,
      requires_shipping
    FROM products
    WHERE product_id IN (${placeholders})
  `;

  const productResult = await env.DB.prepare(productQuery)
    .bind(...productIds)
    .all();

  const dbProducts = Array.isArray(productResult?.results) ? productResult.results : [];
  const productsById = new Map(dbProducts.map((product) => [Number(product.product_id), product]));

  if (dbProducts.length !== productIds.length) {
    return json({
      ok: false,
      error: "One or more cart products could not be found."
    }, 400);
  }

  let subtotal_cents = 0;
  let shipping_cents = 0;
  const validatedItems = [];

  for (const cartItem of normalizedCartItems) {
    const product = productsById.get(cartItem.product_id);

    if (!product) {
      return json({
        ok: false,
        error: `Product not found for item ${cartItem.product_id}.`
      }, 400);
    }

    const isActive = Number(product.is_active || 0) === 1;
    const productState = String(product.product_state || "").toLowerCase();

    if (!isActive || productState !== "active") {
      return json({
        ok: false,
        error: `Product "${product.name}" is not currently available.`
      }, 400);
    }

    const inventoryTracked = Number(product.track_inventory || 0) === 1;
    const allowBackorders = Number(product.allow_backorders || 0) === 1;
    const inventoryQty = Number(product.inventory_qty || 0);

    if (inventoryTracked && !allowBackorders && cartItem.quantity > inventoryQty) {
      return json({
        ok: false,
        error: `Not enough inventory for "${product.name}".`
      }, 400);
    }

    const price_cents = Number(product.price_cents || 0);
    const currency = normalizeText(product.currency || "CAD").toUpperCase();
    const product_type = normalizeText(product.product_type).toLowerCase();
    const requires_shipping = Number(product.requires_shipping || 0);

    const line_subtotal_cents = price_cents * cartItem.quantity;

    subtotal_cents += line_subtotal_cents;

    validatedItems.push({
      product_id: Number(product.product_id),
      product_name: normalizeText(product.name),
      sku: normalizeOptionalText(product.sku),
      product_type,
      requires_shipping,
      quantity: cartItem.quantity,
      price_cents,
      line_subtotal_cents,
      currency
    });
  }

  const fulfillment_type = determineFulfillmentType(validatedItems);

  if (needsShippingAddress(fulfillment_type)) {
    if (!shipping_address1) {
      return json({ ok: false, error: "Shipping address line 1 is required." }, 400);
    }
    if (!shipping_city) {
      return json({ ok: false, error: "Shipping city is required." }, 400);
    }
    if (!shipping_province) {
      return json({ ok: false, error: "Shipping province/state is required." }, 400);
    }
    if (!shipping_postal_code) {
      return json({ ok: false, error: "Shipping postal/ZIP code is required." }, 400);
    }
    if (!shipping_country) {
      return json({ ok: false, error: "Shipping country is required." }, 400);
    }
  }

  if (fulfillment_type === "shipping" || fulfillment_type === "mixed") {
    shipping_cents = 0;
  }

  const tax_cents = calculateTaxCents(subtotal_cents, shipping_cents);
  const total_cents = subtotal_cents + shipping_cents + tax_cents;
  const currency = validatedItems[0]?.currency || "CAD";

  const orderInsert = await env.DB.prepare(`
    INSERT INTO orders (
      order_number,
      order_status,
      fulfillment_type,
      customer_email,
      customer_name,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      currency,
      payment_status,
      payment_method,
      notes,
      created_at,
      updated_at
    )
    VALUES (
      NULL,
      'pending',
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      'pending',
      ?,
      ?,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `)
    .bind(
      fulfillment_type,
      customer_email,
      customer_name,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      currency,
      payment_method,
      notes
    )
    .run();

  const order_id = orderInsert?.meta?.last_row_id;

  if (!order_id) {
    return json({ ok: false, error: "Order could not be created." }, 500);
  }

  const order_number = `DD-${String(order_id).padStart(6, "0")}`;

  await env.DB.prepare(`
    UPDATE orders
    SET order_number = ?, updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `)
    .bind(order_number, order_id)
    .run();

  for (const item of validatedItems) {
    await env.DB.prepare(`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        sku,
        product_type,
        quantity,
        unit_price_cents,
        line_subtotal_cents,
        currency,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        order_id,
        item.product_id,
        item.product_name,
        item.sku,
        item.product_type,
        item.quantity,
        item.price_cents,
        item.line_subtotal_cents,
        item.currency
      )
      .run();

    const product = productsById.get(item.product_id);
    const inventoryTracked = Number(product?.track_inventory || 0) === 1;

    if (inventoryTracked) {
      await env.DB.prepare(`
        UPDATE products
        SET
          inventory_qty = CASE
            WHEN inventory_qty IS NULL THEN NULL
            ELSE MAX(inventory_qty - ?, 0)
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `)
        .bind(item.quantity, item.product_id)
        .run();
    }
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
    .bind(
      order_id,
      escapeHistoryNoteValue(
        `Order created via checkout. Fulfillment: ${fulfillment_type}. Payment method: ${payment_method}.`
      )
    )
    .run();

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      fulfillment_type,
      customer_email,
      customer_name,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      currency,
      payment_status,
      payment_method,
      notes,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  const items = await env.DB.prepare(`
    SELECT
      order_item_id,
      order_id,
      product_id,
      product_name,
      sku,
      product_type,
      quantity,
      unit_price_cents AS price_cents,
      line_subtotal_cents,
      currency,
      created_at
    FROM order_items
    WHERE order_id = ?
    ORDER BY order_item_id ASC
  `)
    .bind(order_id)
    .all();

  return json({
    ok: true,
    message: "Order created successfully.",
    order,
    items: Array.isArray(items?.results) ? items.results : []
  }, 201);
}
