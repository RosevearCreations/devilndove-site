// Release 467 Build 437 — offline checkout/gifting safety simulations.
// No network, Cloudflare, payment provider, or persistent database is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/checkout-create-order.js';
import { onRequestPost as quoteGiftCard } from '../functions/api/gift-card-quote.js';
import { COMMERCE_POLICY, validateCommerceEnvelope } from '../public/js/commerce-policy-core.js';
import { GIFT_CARD_TABLE_COLUMNS } from '../functions/api/_lib/giftCardSchemaReadiness.js';

const valid = {
  customer_name: 'Ontario Test Customer', customer_email: 'test@example.invalid',
  currency: 'CAD', billing_country: 'CA', shipping_country: 'CA',
  shipping_name: 'Ontario Test Customer', shipping_address1: '1 Example Street',
  shipping_city: 'Tillsonburg', shipping_province: 'ON', shipping_postal_code: 'N4G 1A1',
};

function fakeDb(product = {}) {
  const calls = [];
  const row = { product_id: 17, name: 'Test Soap', sku: 'T-17', product_type: 'physical',
    status: 'active', price_cents: 1250, currency: 'CAD', taxable: 1,
    requires_shipping: 1, inventory_tracking: 1, inventory_quantity: 2, ...product };
  let orderId = 91;
  const db = { calls, prepare(sql) {
    const statement = { values: [], bind(...values) { this.values = values; return this; },
      async all() {
        calls.push({ type: 'all', sql, values: this.values });
        if (sql.includes('FROM products WHERE product_id IN')) return { results: [row] };
        if (sql.includes('FROM product_quantity_price_tiers')) return { results: [] };
        const schema = sql.match(/^PRAGMA table_info\((\w+)\)/);
        if (schema) return { results: (GIFT_CARD_TABLE_COLUMNS[schema[1]] || []).map(name => ({ name })) };
        throw Error('Unmocked SELECT list: ' + sql.slice(0, 90));
      },
      async first() {
        calls.push({ type: 'first', sql, values: this.values });
        if (sql.includes('FROM product_bundle_settings')) return null;
        if (sql.includes('reserved_component_quantity')) return { reserved_quantity: 0 };
        if (sql.includes('FROM gift_cards WHERE order_id=')) return {
          gift_card_id: 12, code: 'TEST-GIFT', currency: 'CAD', initial_amount_cents: 5000,
          remaining_amount_cents: 5000, recipient_email: 'gift@example.invalid', status: 'pending_activation' };
        if (sql.includes('FROM orders WHERE order_id=')) return {
          order_id: orderId, order_number: 'TEST-ORDER', customer_name: valid.customer_name,
          customer_email: valid.customer_email, payment_status: 'pending', order_status: 'pending',
          subtotal_cents: 2500, shipping_cents: 1500, discount_cents: 0, tax_cents: 520, total_cents: 4520 };
        throw Error('Unmocked SELECT one: ' + sql.slice(0, 90));
      },
      async run() {
        calls.push({ type: 'run', sql, values: this.values });
        if (sql.includes('INSERT INTO orders')) return { meta: { last_row_id: orderId, changes: 1 } };
        if (/INSERT INTO (order_items|order_status_history|gift_cards)|UPDATE checkout_recovery_leads/.test(sql)) return { meta: { changes: 1 } };
        throw Error('Unmocked write: ' + sql.slice(0, 90));
      },
    }; return statement;
  } }; return db;
}

async function checkout(body, db = fakeDb()) {
  const response = await onRequestPost({ request: new Request('https://local.invalid/api/checkout-create-order', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, ...body }),
  }), env: { DB: db } });
  return { status: response.status, data: await response.json(), calls: db.calls };
}

test('Canada-first storefront policy remains closed to U.S. billing and shipping', () => {
  assert.deepEqual(COMMERCE_POLICY.allowed_shipping_country_codes, ['CA']);
  assert.equal(COMMERCE_POLICY.united_states_sales_enabled, false);
  assert.equal(COMMERCE_POLICY.united_states_shipping_enabled, false);
  assert.equal(validateCommerceEnvelope({ currency: 'CAD', billing_country: 'CA', shipping_country: 'CA' }).ok, true);
});

test('direct order handler rejects U.S. shipping, U.S. billing, and non-CAD without any DB writes', async () => {
  for (const [patch, code] of [
    [{ shipping_country: 'United States' }, 'shipping_country_not_supported'],
    [{ billing_country: 'US' }, 'billing_country_not_supported'],
    [{ currency: 'USD' }, 'commerce_currency_not_supported'],
  ]) {
    const result = await checkout({ items: [{ product_id: 17, quantity: 1 }], ...patch });
    assert.equal(result.status, 422);
    assert.equal(result.data.code, code);
    assert.equal(result.data.local_order_mutation_performed, false);
    assert.equal(result.calls.length, 0);
  }
});

test('duplicate lines cannot bypass aggregate inventory limits', async () => {
  const result = await checkout({ items: [{ product_id: 17, quantity: 2 }, { product_id: 17, quantity: 2 }] });
  assert.equal(result.status, 400);
  assert.equal(result.data.code, 'checkout_duplicate_product');
  assert.equal(result.calls.length, 0);
});

test('checkout uses live inventory and product currency, never trusting submitted price', async () => {
  const lowStock = await checkout({ items: [{ product_id: 17, quantity: 3, unit_price_cents: 1 }] });
  assert.equal(lowStock.status, 409);
  assert.equal(lowStock.data.code, 'checkout_stock_changed');
  assert.equal(lowStock.calls.filter(c => c.type === 'run').length, 0);

  const foreign = await checkout({ items: [{ product_id: 17, quantity: 1 }] }, fakeDb({ currency: 'USD' }));
  assert.equal(foreign.status, 409);
  assert.equal(foreign.data.code, 'checkout_product_currency_not_supported');
  assert.equal(foreign.calls.filter(c => c.type === 'run').length, 0);

  const safe = await checkout({ items: [{ product_id: 17, quantity: 2, unit_price_cents: 1 }] });
  assert.equal(safe.status, 200);
  assert.equal(safe.data.server_totals_authoritative, true);
  const itemInsert = safe.calls.find(c => c.type === 'run' && c.sql.includes('INSERT INTO order_items'));
  assert.equal(itemInsert.values[5], 1250);
  assert.equal(itemInsert.values[7], 2500);
});

test('new gift-card purchase is created pending activation, without provider execution', async () => {
  const foreign = await checkout({ items: [], gift_card_purchase: {
    amount_cents: 5000, currency: 'USD', recipient_email: 'gift@example.invalid' } });
  assert.equal(foreign.status, 422);
  assert.equal(foreign.data.code, 'gift_card_currency_not_supported');
  assert.equal(foreign.calls.length, 0);

  const result = await checkout({ items: [], gift_card_purchase: {
    amount_cents: 5000, currency: 'CAD', recipient_email: 'gift@example.invalid', recipient_name: 'Recipient' } });
  assert.equal(result.status, 200);
  assert.equal(result.data.storefront_gift_card.status, 'pending_activation');
  const insert = result.calls.find(c => c.type === 'run' && c.sql.includes('INSERT INTO gift_cards'));
  assert.ok(insert);
  assert.match(insert.sql, /'pending_activation'/);
});

test('gift-card quote refuses unactivated cards and caps active discounts to stored balance', async () => {
  async function quote(status) {
    const db = { prepare(sql) { return {
      bind() { return this; },
      async all() {
        assert.match(sql, /^PRAGMA table_info\(gift_cards\)/);
        return { results: GIFT_CARD_TABLE_COLUMNS.gift_cards.map(name => ({ name })) };
      },
      async first() { return { gift_card_id: 3, code: 'TEST-GC', currency: 'CAD', initial_amount_cents: 5000,
        remaining_amount_cents: 1700, status, expires_at: null }; },
    }; } };
    const response = await quoteGiftCard({ request: new Request('https://local.invalid/api/gift-card-quote', {
      method: 'POST', body: JSON.stringify({ code: 'TEST-GC', currency: 'CAD', order_total_cents: 6000 }),
    }), env: { DB: db } });
    return { status: response.status, body: await response.json() };
  }
  const inactive = await quote('pending_activation');
  assert.equal(inactive.status, 400);
  const active = await quote('active');
  assert.equal(active.status, 200);
  assert.equal(active.body.gift_card.applicable_discount_cents, 1700);
});
