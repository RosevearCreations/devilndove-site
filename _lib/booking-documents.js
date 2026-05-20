// functions/api/_lib/booking-documents.js
// Shared booking-document builders for public document pages and queued confirmations.

import { serviceHeaders } from "./staff-auth.js";
import { loadPricingCatalog } from "./pricing-catalog.js";

const COMPANY = {
  name: "Rosie Dazzlers",
  legal_name: "Rosie Dazzlers Mobile Auto Detailing",
  phone: "226-752-7613",
  email: "info@rosiedazzlers.ca",
  website: "https://rosiedazzlers.ca",
  service_area: "Oxford County and Norfolk County, Ontario"
};

const DEFAULT_TEMPLATES = {
  confirmation_intro: "Thank you for booking Rosie Dazzlers. Your booking details are below.",
  invoice_footer: "Please review your service summary before arrival. On-site discounts, weather adjustments, and refunds should be documented through the office workflow.",
  gift_footer: "Gift certificates are valid for one year from purchase and are non-refundable."
};

const FINANCE_ENTRY_TYPES = ["deposit", "final_payment", "tip", "refund", "discount", "other"];

export async function loadBookingDocumentPayloadById(env, bookingId) {
  const booking = await loadBookingById(env, bookingId);
  return booking ? await buildPayload(env, booking) : null;
}

export async function loadBookingDocumentPayloadByToken(env, token) {
  const booking = await loadBookingByProgressToken(env, token);
  return booking ? await buildPayload(env, booking) : null;
}

export async function queueOrderConfirmationNotification(env, bookingId, source = "system") {
  try {
    const payload = await loadBookingDocumentPayloadById(env, bookingId);
    if (!payload?.booking?.customer_email) {
      return { ok: false, skipped: true, reason: "no_customer_email" };
    }

    const subject = `Rosie Dazzlers booking confirmation — ${payload.package.name} on ${payload.booking.service_date || "scheduled date"}`;
    const bodyText = [
      DEFAULT_TEMPLATES.confirmation_intro,
      `Customer: ${payload.booking.customer_name || "Customer"}`,
      `Service date: ${payload.booking.service_date || "TBD"}`,
      `Time: ${payload.booking.slot_label || payload.booking.start_slot || "TBD"}`,
      `Package: ${payload.package.name}`,
      `Vehicle: ${payload.vehicle.label}`,
      `Service area: ${payload.booking.service_area_label}`,
      `Deposit due / paid: ${formatMoney(payload.summary.deposit_cents)}`,
      `Estimated total: ${formatMoney(payload.summary.effective_total_cents)}`,
      `Order confirmation: ${payload.documents.confirmation_url}`,
      `Invoice / summary: ${payload.documents.invoice_url}`
    ].join("\n");

    const bodyHtml = `
      <h1>Booking confirmation</h1>
      <p>${escapeHtml(DEFAULT_TEMPLATES.confirmation_intro)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(payload.booking.customer_name || "Customer")}</p>
      <p><strong>Service date:</strong> ${escapeHtml(payload.booking.service_date || "TBD")}</p>
      <p><strong>Time:</strong> ${escapeHtml(payload.booking.slot_label || payload.booking.start_slot || "TBD")}</p>
      <p><strong>Package:</strong> ${escapeHtml(payload.package.name)}</p>
      <p><strong>Vehicle:</strong> ${escapeHtml(payload.vehicle.label)}</p>
      <p><strong>Service area:</strong> ${escapeHtml(payload.booking.service_area_label)}</p>
      <p><strong>Deposit due / paid:</strong> ${escapeHtml(formatMoney(payload.summary.deposit_cents))}</p>
      <p><strong>Estimated total:</strong> ${escapeHtml(formatMoney(payload.summary.effective_total_cents))}</p>
      <p><a href="${payload.documents.confirmation_url}">Open order confirmation</a><br><a href="${payload.documents.invoice_url}">Open invoice / summary</a></p>
    `;

    const row = {
      event_type: "order_confirmation_email",
      channel: "email",
      booking_id: payload.booking.id,
      customer_profile_id: payload.booking.customer_profile_id || null,
      recipient_email: payload.booking.customer_email,
      recipient_phone: payload.booking.customer_phone || null,
      payload: {
        template_key: "order_confirmation",
        source,
        progress_token: payload.booking.progress_token,
        confirmation_url: payload.documents.confirmation_url,
        invoice_url: payload.documents.invoice_url,
        package_name: payload.package.name,
        service_date: payload.booking.service_date,
        slot_label: payload.booking.slot_label || payload.booking.start_slot,
        service_area: payload.booking.service_area_label,
        vehicle_label: payload.vehicle.label
      },
      status: "queued",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      max_attempts: 5,
      subject,
      body_text: bodyText,
      body_html: bodyHtml
    };

    const headers = { ...serviceHeaders(env), Prefer: "return=representation" };

    let res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
      method: "POST",
      headers,
      body: JSON.stringify([row])
    });

    if (!res.ok) {
      const fallbackRow = { ...row };
      delete fallbackRow.subject;
      delete fallbackRow.body_text;
      delete fallbackRow.body_html;
      fallbackRow.payload = {
        ...fallbackRow.payload,
        subject,
        body_text: bodyText,
        body_html: bodyHtml
      };

      res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
        method: "POST",
        headers,
        body: JSON.stringify([fallbackRow])
      });
    }

    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function buildPayload(env, booking) {
  const pricing = await loadPricingCatalog(env);
  const finance = await loadBookingFinanceSummary(env, booking.id);
  const pkg = pricing.package_map?.[String(booking.package_code || "")] || null;
  const addonLines = resolveAddonLines(pricing, booking.addons, booking.vehicle_size);
  const baseTotalCents = toCents(booking.price_total_cents);
  const discountCents = toCents(finance.discount);
  const refundCents = toCents(finance.refund);
  const depositCents = toCents(booking.deposit_cents || 0);
  const collectedCents = toCents(finance.collected_total);
  const effectiveTotalCents = Math.max(0, baseTotalCents - discountCents);
  const balanceDueCents = Math.max(0, effectiveTotalCents - collectedCents + refundCents);
  const progressToken = String(booking.progress_token || "").trim() || null;
  const origin = COMPANY.website;
  const serviceAreaLabel =
    [booking.service_area_zone, booking.service_area_municipality].filter(Boolean).join(" · ") ||
    booking.service_area ||
    "—";
  const slotLabel = slotLabelForBooking(booking);
  const templates = await loadDocumentTemplates(env);

  return {
    company: { ...COMPANY, templates },
    booking: {
      id: booking.id,
      status: booking.status || null,
      job_status: booking.job_status || null,
      created_at: booking.created_at || null,
      service_date: booking.service_date || null,
      start_slot: booking.start_slot || null,
      duration_slots: Number(booking.duration_slots || 1),
      slot_label: slotLabel,
      service_area: booking.service_area || null,
      service_area_county: booking.service_area_county || null,
      service_area_municipality: booking.service_area_municipality || null,
      service_area_zone: booking.service_area_zone || null,
      service_area_label: serviceAreaLabel,
      customer_name: booking.customer_name || null,
      customer_email: booking.customer_email || null,
      customer_phone: booking.customer_phone || null,
      address_line1: booking.address_line1 || null,
      address_line2: booking.address_line2 || null,
      city: booking.city || null,
      postal_code: booking.postal_code || null,
      notes: booking.notes || null,
      progress_token: progressToken,
      payment_provider: booking.payment_provider || null,
      customer_profile_id: booking.customer_profile_id || null
    },
    vehicle: {
      year: booking.vehicle_year || null,
      make: booking.vehicle_make || null,
      model: booking.vehicle_model || null,
      body_style: booking.vehicle_body_style || null,
      category: booking.vehicle_category || null,
      size: booking.vehicle_size || null,
      label:
        [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") ||
        [booking.package_code, booking.vehicle_size].filter(Boolean).join(" · ") ||
        "Vehicle"
    },
    package: {
      code: booking.package_code || null,
      name: pkg?.name || booking.package_code || "Service package",
      subtitle: pkg?.subtitle || null,
      included_services: Array.isArray(pkg?.included_services) ? pkg.included_services : [],
      base_total_cents: baseTotalCents
    },
    addons: addonLines,
    finance,
    summary: {
      base_total_cents: baseTotalCents,
      discount_cents: discountCents,
      refund_cents: refundCents,
      deposit_cents: depositCents,
      collected_total_cents: collectedCents,
      effective_total_cents: effectiveTotalCents,
      balance_due_cents: balanceDueCents
    },
    documents: {
      confirmation_url: progressToken
        ? `${origin}/order-confirmation?token=${encodeURIComponent(progressToken)}`
        : null,
      invoice_url: progressToken
        ? `${origin}/invoice?token=${encodeURIComponent(progressToken)}`
        : null,
      gift_certificate_url: `${origin}/gift-certificate-print`
    }
  };
}

async function loadDocumentTemplates(env) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return DEFAULT_TEMPLATES;
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.document_templates&limit=1`,
      { headers: serviceHeaders(env) }
    );

    if (!res.ok) {
      return DEFAULT_TEMPLATES;
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return {
      ...DEFAULT_TEMPLATES,
      ...(row?.value && typeof row.value === "object" ? row.value : {})
    };
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function resolveAddonLines(pricing, rawAddons, vehicleSize) {
  const rows = Array.isArray(rawAddons) ? rawAddons : [];

  return rows.map((row) => {
    const code = String(row?.code || row || "").trim();
    const addon = pricing.addon_map?.[code] || null;
    const cents =
      row?.cents != null
        ? toCents(row.cents)
        : addon?.prices_cad?.[vehicleSize] != null
          ? toCents(Math.round(Number(addon.prices_cad[vehicleSize]) * 100))
          : addon?.price_cad != null
            ? toCents(Math.round(Number(addon.price_cad) * 100))
            : 0;

    return {
      code,
      name: row?.label || addon?.name || code || "Add-on",
      quote_required: row?.quote_required === true || addon?.quote_required === true,
      cents
    };
  });
}

async function loadBookingFinanceSummary(env, bookingId) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !bookingId) {
    return emptyFinanceSummary();
  }

  const filters = FINANCE_ENTRY_TYPES.map(
    (entryType) => `event_type.eq.booking_finance_${entryType}`
  ).join(",");

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/booking_events?select=created_at,event_type,payload,event_note&booking_id=eq.${encodeURIComponent(bookingId)}&or=(${filters})&order=created_at.asc`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    return emptyFinanceSummary();
  }

  const rows = await res.json().catch(() => []);
  const summary = emptyFinanceSummary();

  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const entryType = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
    const amount = toMoney(payload.amount_cad || 0);

    if (Object.prototype.hasOwnProperty.call(summary, entryType)) {
      summary[entryType] = toMoney(summary[entryType] + amount);
    }

    if (["deposit", "final_payment", "tip", "other"].includes(entryType)) {
      summary.collected_total = toMoney(summary.collected_total + amount);
    }

    if (entryType === "refund") {
      summary.collected_total = toMoney(summary.collected_total - amount);
    }

    summary.last_finance_event_at = row.created_at || summary.last_finance_event_at;
    summary.last_finance_event_type = entryType || summary.last_finance_event_type;
  }

  return summary;
}

function emptyFinanceSummary() {
  return {
    deposit: 0,
    final_payment: 0,
    tip: 0,
    refund: 0,
    discount: 0,
    other: 0,
    collected_total: 0,
    last_finance_event_at: null,
    last_finance_event_type: null
  };
}

async function loadBookingById(env, bookingId) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !bookingId) {
    return null;
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings?select=*&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    return null;
  }

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadBookingByProgressToken(env, token) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !token) {
    return null;
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings?select=*&progress_token=eq.${encodeURIComponent(token)}&limit=1`,
    {
      headers: serviceHeaders(env)
    }
  );

  if (!res.ok) {
    return null;
  }

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function slotLabelForBooking(booking) {
  const slot = String(booking.start_slot || "").toUpperCase();
  const duration = Number(booking.duration_slots || 1);

  if (duration === 2) return "Full day";
  if (slot === "AM") return "AM half day";
  if (slot === "PM") return "PM half day";
  return slot || "Scheduled";
}

function toMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}

function toCents(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function formatMoney(cents) {
  const amount = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD"
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
