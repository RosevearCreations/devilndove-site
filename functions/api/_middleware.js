// Devil n Dove Build 440 — narrow API constraint mapper.
// Catches only migration-owned Product/Inventory commitment guard errors. All unrelated
// exceptions are re-thrown unchanged so this is not a generic error-swallowing layer.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function errorText(error) {
  return String(error?.message || error || '');
}

export async function onRequest(context) {
  try {
    return await context.next();
  } catch (error) {
    const raw = errorText(error);
    if (raw.includes('build440_finished_inventory_commitment_exceeds_available')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_commitment_conflict',
        error: 'Available finished inventory changed while this request was being committed. The incomplete order was cancelled safely; refresh availability and try again.',
        retry_safe_after_refresh: true,
      }, 409);
    }
    if (raw.includes('build440_finished_inventory_below_active_commitments')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_below_active_commitments',
        error: 'Finished inventory cannot be reduced below quantities already committed to active orders. Release or resolve the downstream commitments first.',
        retry_safe_after_refresh: false,
      }, 409);
    }
    throw error;
  }
}
