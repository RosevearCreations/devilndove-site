// functions/api/codes/preview.js
// POST /api/codes/preview
// Validates promo_code and/or gift_code and returns a pricing/deposit preview.
//
// Request JSON:
// {
//   "subtotal_cents": 20400,
//   "deposit_base_cents": 5000,
//   "package_code": "premium_wash",
//   "vehicle_size": "small",
//   "promo_code": "WELCOME10",
//   "gift_code": "RD-XXXXXX"
// }

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  const VERSION = "codes_preview_v1_20260308";

  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, version: VERSION, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const raw = await request.text();
    if (!raw) return corsJson({ ok: false, version: VERSION, error: "Missing JSON body" }, 400);

    let body;
    try { body = JSON.parse(raw); }
    catch { return corsJson({ ok: false, version: VERSION, error: "Invalid JSON" }, 400); }

    const subtotalCents = Number(body.subtotal_cents);
    const depositBaseCents = Number(body.deposit_base_cents);
    const packageCode = String(body.package_code || "").trim();
    const vehicleSize = String(body.vehicle_size || "").trim();

    const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim().toUpperCase() : "";
    const giftCode  = typeof body.gift_code  === "string" ? body.gift_code.trim().toUpperCase()  : "";

    if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
      return corsJson({ ok: false, version: VERSION, error: "subtotal_cents must be a number >= 0" }, 400);
    }
    if (!Number.isFinite(depositBaseCents) || depositBaseCents < 0) {
      return corsJson({ ok: false, version: VERSION, error: "deposit_base_cents must be a number >= 0" }, 400);
    }
    if (!packageCode) return corsJson({ ok: false, version: VERSION, error: "Missing package_code" }, 400);
    if (!["small", "mid", "oversize"].includes(vehicleSize)) {
      return corsJson({ ok: false, version: VERSION, error: "vehicle_size must be small, mid, or oversize" }, 400);
    }

    const supaGet = async (path) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "GET",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Accept: "application/json",
        },
      });
      const text = await res.text();
      const data = text ? safeJsonText(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // -----------------------
    // Promo validation
    // -----------------------
    let promo = null;
    let promoDiscountCents = 0;
    let promoMessage = null;

    if (promoCode) {
      const promoRes = await supaGet(
        `/rest/v1/promo_codes?select=code,active,discount_type,discount_percent,discount_cents,starts_at,ends_at,max_uses,uses&code=eq.${encodeURIComponent(
          promoCode
        )}&limit=1`
      );

      if (!promoRes.ok) {
        return corsJson({ ok: false, version: VERSION, error: "Supabase error (promo_codes)", details: promoRes }, 500);
      }

      promo = Array.isArray(promoRes.data) ? promoRes.data[0] : null;
      if (!promo) {
        promoMessage = "Invalid promo code";
      } else {
        const now = new Date();
        const startsAt = promo.starts_at ? new Date(promo.starts_at) : null;
        const endsAt = promo.ends_at ? new Date(promo.ends_at) : null;

        if (promo.active !== true) promoMessage = "Promo code is not active";
        else if (startsAt && now < startsAt) promoMessage = "Promo code is not active yet";
        else if (endsAt && now > endsAt) promoMessage = "Promo code has expired";
        else {
          const maxUses = Number(promo.max_uses ?? 0);
          const uses = Number(promo.uses ?? 0);
          if (maxUses > 0 && uses >= maxUses) promoMessage = "Promo code usage limit reached";
          else {
            const type = String(promo.discount_type || "").toLowerCase();
            if (type === "percent") {
              const pct = Math.max(0, Math.min(90, Number(promo.discount_percent ?? 0)));
              promoDiscountCents = Math.floor((subtotalCents * pct) / 100);
            } else {
              promoDiscountCents = Number(promo.discount_cents ?? 0);
            }

            if (!Number.isFinite(promoDiscountCents) || promoDiscountCents < 0) promoDiscountCents = 0;
            promoDiscountCents = Math.min(promoDiscountCents, subtotalCents);
            promoMessage = "Promo applied";
          }
        }
      }
    }

    const afterPromoCents = Math.max(0, subtotalCents - promoDiscountCents);

    // -----------------------
    // Gift validation
    // -----------------------
    let gift = null;
    let giftApplyCents = 0;
    let giftMessage = null;

    if (giftCode) {
      const giftRes = await supaGet(
        `/rest/v1/gift_certificates?select=id,code,type,status,remaining_cents,expires_at,package_code,vehicle_size,currency&code=eq.${encodeURIComponent(
          giftCode
        )}&limit=1`
      );

      if (!giftRes.ok) {
        return corsJson({ ok: false, version: VERSION, error: "Supabase error (gift_certificates)", details: giftRes }, 500);
      }

      gift = Array.isArray(giftRes.data) ? giftRes.data[0] : null;
      if (!gift) {
        giftMessage = "Invalid gift code";
      } else {
        const nowIso = new Date().toISOString();

        if (String(gift.status) !== "active") giftMessage = "Gift code is not active";
        else if (gift.expires_at && String(gift.expires_at) <= nowIso) giftMessage = "Gift code has expired";
        else {
          const remaining = Number(gift.remaining_cents ?? 0);
          if (!Number.isFinite(remaining) || remaining <= 0) giftMessage = "Gift code has no remaining balance";
          else {
            const gType = String(gift.type || "").toLowerCase();
            if (gType === "service") {
              if (gift.package_code !== packageCode || gift.vehicle_size !== vehicleSize) {
                giftMessage = "Service gift does not match selected package/size";
              } else {
                giftApplyCents = Math.min(remaining, afterPromoCents);
                giftMessage = "Service gift valid";
              }
            } else {
              giftApplyCents = Math.min(remaining, afterPromoCents);
              giftMessage = "Dollar gift valid";
            }
          }
        }
      }
    }

    const totalAfterDiscounts = Math.max(0, afterPromoCents - giftApplyCents);

    // Deposit reduction (gift can cover deposit too)
    const depositCapped = Math.min(depositBaseCents, afterPromoCents);
    const giftToDeposit = Math.min(depositCapped, giftApplyCents);
    const depositDueNow = Math.max(0, depositCapped - giftToDeposit);

    return corsJson({
      ok: true,
      version: VERSION,

      subtotal_cents: subtotalCents,
      deposit_base_cents: depositBaseCents,

      promo_code: promoCode || null,
      promo_message: promoMessage,
      promo_discount_cents: promoDiscountCents,

      gift_code: giftCode || null,
      gift_message: giftMessage,
      gift_apply_cents: giftApplyCents,

      total_after_discounts_cents: totalAfterDiscounts,
      deposit_due_now_cents: depositDueNow,
    });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function safeJsonText(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
