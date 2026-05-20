import { serviceHeaders } from "./staff-auth.js";

export async function syncAccountingRecordForBooking(env, booking, options = {}) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !booking?.id) {
    return null;
  }

  const headers = serviceHeaders(env);
  const bookingId = String(booking.id);
  const financeSummary = await loadFinanceSummary(env, headers, bookingId);

  const totalCad = toMoneyNumber(booking.total_price ?? booking.price_total_cents ?? 0);
  const depositDueCad = toMoneyNumber(booking.deposit_amount ?? booking.deposit_cents ?? 0);
  const tipCad = toMoneyNumber(financeSummary.tip);
  const refundCad = toMoneyNumber(financeSummary.refund);
  const discountCad = toMoneyNumber(financeSummary.discount);
  const finalPaidCad = toMoneyNumber(financeSummary.final_payment);
  const depositPaidCad = toMoneyNumber(financeSummary.deposit);
  const otherPaidCad = toMoneyNumber(financeSummary.other);
  const collectedTotalCad = toMoneyNumber(financeSummary.collected_total);
  const effectiveTotalCad = toMoneyNumber(Math.max(0, totalCad - discountCad));
  const taxableAmountCad = effectiveTotalCad;
  const taxCad = 0;
  const revenueCad = toMoneyNumber(Math.max(0, collectedTotalCad - tipCad - refundCad));
  const balanceDueCad = toMoneyNumber(Math.max(0, effectiveTotalCad - depositPaidCad - finalPaidCad - otherPaidCad + refundCad));
  const actor = options.actor || null;
  const source = options.source || "booking";
  const existing = await loadExistingAccountingRecord(env, headers, bookingId);

  const payload = {
    booking_id: bookingId,
    record_source: source,
    order_status: normalizeOrderStatus(booking.status || booking.job_status || "pending"),
    accounting_stage: normalizeAccountingStage({ booking, financeSummary }),
    customer_name: booking.customer_name || null,
    customer_email: booking.customer_email || null,
    customer_phone: booking.customer_phone || null,
    service_date: booking.service_date || null,
    start_slot: booking.start_slot || null,
    package_code: booking.package_code || null,
    vehicle_size: booking.vehicle_size || null,
    booking_status: booking.status || null,
    job_status: booking.job_status || null,
    subtotal_cad: totalCad,
    total_cad: effectiveTotalCad,
    taxable_amount_cad: taxableAmountCad,
    tax_cad: taxCad,
    deposit_due_cad: depositDueCad,
    deposit_paid_cad: depositPaidCad,
    final_paid_cad: finalPaidCad,
    tip_cad: tipCad,
    refund_cad: refundCad,
    discount_cad: discountCad,
    other_paid_cad: otherPaidCad,
    collected_total_cad: collectedTotalCad,
    revenue_cad: revenueCad,
    balance_due_cad: balanceDueCad,
    notes: booking.notes || null,
    last_finance_event_at: financeSummary.last_finance_event_at,
    last_finance_event_type: financeSummary.last_finance_event_type,
    last_recorded_by_name: actor?.full_name || actor?.email || null,
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const rows = await writeAccountingRecord(env, headers, existing.id, payload, "PATCH");
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  const createPayload = [{
    ...payload,
    created_at: new Date().toISOString(),
    created_by_name: actor?.full_name || actor?.email || null
  }];
  const rows = await writeAccountingRecord(env, headers, null, createPayload, "POST");
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function writeAccountingRecord(env, headers, recordId, payload, method) {
  const url = recordId
    ? `${env.SUPABASE_URL}/rest/v1/accounting_records?id=eq.${encodeURIComponent(recordId)}`
    : `${env.SUPABASE_URL}/rest/v1/accounting_records`;
  let res = await fetch(url, {
    method,
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('discount_cad')) {
      const stripped = stripDiscount(payload);
      res = await fetch(url, {
        method,
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(stripped)
      });
      if (!res.ok) {
        throw new Error(`Could not ${method === 'PATCH' ? 'update' : 'create'} accounting record. ${await res.text()}`);
      }
      return await res.json().catch(() => []);
    }
    throw new Error(`Could not ${method === 'PATCH' ? 'update' : 'create'} accounting record. ${text}`);
  }
  return await res.json().catch(() => []);
}

function stripDiscount(payload) {
  if (Array.isArray(payload)) return payload.map((row) => {
    const clone = { ...row };
    delete clone.discount_cad;
    return clone;
  });
  const clone = { ...payload };
  delete clone.discount_cad;
  return clone;
}

async function loadExistingAccountingRecord(env, headers, bookingId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_records?select=id,booking_id&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`, {
    headers
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not verify accounting record. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadFinanceSummary(env, headers, bookingId) {
  const types = [
    "booking_finance_deposit",
    "booking_finance_final_payment",
    "booking_finance_tip",
    "booking_finance_refund",
    "booking_finance_discount",
    "booking_finance_other"
  ].map((x) => `event_type.eq.${x}`).join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=created_at,event_type,payload,event_note&booking_id=eq.${encodeURIComponent(bookingId)}&or=(${types})&order=created_at.asc`, {
    headers
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not load finance summary. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  const summary = { deposit: 0, final_payment: 0, tip: 0, refund: 0, discount: 0, other: 0, collected_total: 0, last_finance_event_at: null, last_finance_event_type: null };
  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const entryType = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
    const amount = toMoneyNumber(payload.amount_cad || 0);
    if (Object.prototype.hasOwnProperty.call(summary, entryType)) summary[entryType] += amount;
    if (["deposit", "final_payment", "tip", "other"].includes(entryType)) summary.collected_total += amount;
    if (entryType === "refund") summary.collected_total -= amount;
    summary.last_finance_event_at = row.created_at || summary.last_finance_event_at;
    summary.last_finance_event_type = entryType || summary.last_finance_event_type;
  }
  for (const key of ["deposit","final_payment","tip","refund","discount","other","collected_total"]) {
    summary[key] = toMoneyNumber(summary[key]);
  }
  return summary;
}

function normalizeAccountingStage({ booking, financeSummary }) {
  const total = toMoneyNumber(booking.total_price ?? booking.price_total_cents ?? 0);
  const discount = toMoneyNumber(financeSummary.discount || 0);
  const effectiveTotal = toMoneyNumber(Math.max(0, total - discount));
  const collected = toMoneyNumber(financeSummary.collected_total || 0);
  const depositDue = toMoneyNumber(booking.deposit_amount ?? booking.deposit_cents ?? 0);
  if (collected <= 0) return depositDue > 0 ? "deposit_due" : "open";
  if (depositDue > 0 && collected < depositDue) return "deposit_partial";
  if (collected < effectiveTotal) return "balance_due";
  return "paid";
}

function normalizeOrderStatus(value) {
  const s = String(value || "pending").trim().toLowerCase();
  if (["cancelled","canceled"].includes(s)) return "cancelled";
  if (["completed","done","paid"].includes(s)) return "completed";
  if (["confirmed","scheduled","in_progress","in-progress"].includes(s)) return "active";
  return "open";
}

function toMoneyNumber(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  if (Math.abs(num) >= 1000 && Number.isInteger(num)) return Math.round(num) / 100;
  return Math.round(num * 100) / 100;
}
