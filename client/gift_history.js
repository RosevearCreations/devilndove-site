import { getCurrentCustomerSession } from "../_lib/customer-session.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const session = await getCurrentCustomerSession({ request, env });
    const customerId = session?.customer?.id || null;

    if (!customerId) {
      return json({ error: "Unauthorized." }, 401);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const redemptionsRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/gift_code_redemptions` +
        `?select=id,created_at,gift_code_id,amount_cents,booking_id,notes` +
        `&customer_id=eq.${encodeURIComponent(customerId)}` +
        `&order=created_at.desc` +
        `&limit=50`,
      { headers }
    );

    if (!redemptionsRes.ok) {
      return json(
        { error: `Could not load gift history. ${await redemptionsRes.text()}` },
        500
      );
    }

    const redemptions = await redemptionsRes.json().catch(() => []);

    const giftCodeIds = Array.isArray(redemptions)
      ? [...new Set(redemptions.map((r) => r?.gift_code_id).filter(Boolean))]
      : [];

    let giftCodesById = {};

    if (giftCodeIds.length) {
      const idList = giftCodeIds
        .map((id) => `"${String(id).replaceAll('"', '\\"')}"`)
        .join(",");

      const giftCodesRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/gift_codes` +
          `?select=id,code,original_amount_cents,remaining_amount_cents,is_active,expires_at` +
          `&id=in.(${idList})`,
        { headers }
      );

      if (giftCodesRes.ok) {
        const giftCodes = await giftCodesRes.json().catch(() => []);
        giftCodesById = Object.fromEntries(
          (Array.isArray(giftCodes) ? giftCodes : []).map((row) => [row.id, row])
        );
      }
    }

    const history = (Array.isArray(redemptions) ? redemptions : []).map((row) => {
      const gift = giftCodesById[row.gift_code_id] || null;
      return {
        id: row.id,
        created_at: row.created_at,
        booking_id: row.booking_id || null,
        amount_cents: Number(row.amount_cents || 0),
        notes: row.notes || "",
        gift_code: gift
          ? {
              id: gift.id,
              code: gift.code,
              original_amount_cents: Number(gift.original_amount_cents || 0),
              remaining_amount_cents: Number(gift.remaining_amount_cents || 0),
              is_active: gift.is_active === true,
              expires_at: gift.expires_at || null
            }
          : null
      };
    });

    return json({
      ok: true,
      history
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
