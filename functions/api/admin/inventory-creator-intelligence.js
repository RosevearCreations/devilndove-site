// Release 465 Build 2 — Inventory & Creator Intelligence control-plane API.
// GET-only. Existing Product, Inventory, CAIP, Content Studio and business-pipeline authorities remain authoritative.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';
import {
  chooseNextSafeAction,
  listIntelligenceSelectors,
  loadCreativeReadinessIntelligence,
  loadGenealogyExceptions,
  loadProductAvailabilityIntelligence,
  loadRelatedProductIntelligence,
} from '../_lib/inventoryCreatorIntelligence.js';

const integer = (value) => {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
};
const clampInt = (value, fallback, min, max) => {
  const n = Number(value);
  return Number.isInteger(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const json = (data, status = 200) => jsonResponse({
  release: CURRENT_RELEASE,
  build: 2,
  mutation_capability: 'none',
  provider_execution_active: false,
  provider_publication_active: false,
  inventory_mutation_active: false,
  accounting_posting_active: false,
  automatic_relationship_write: false,
  historical_reconstruction_claimed: false,
  ...data,
}, status, {'Cache-Control': 'no-store'});

async function access(request, env) {
  const user = await getAdminUserFromRequest(request, env);
  if (!user) return { response: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(env);
  if (!db) return { response: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { user, db };
}

export async function onRequestGet({ request, env }) {
  const a = await access(request, env);
  if (a.response) return a.response;

  const url = new URL(request.url);
  const productId = integer(url.searchParams.get('product_id'));
  const creativeProjectId = integer(url.searchParams.get('creative_project_id'));
  const forecastUnits = clampInt(url.searchParams.get('forecast_units'), 1, 1, 100);
  const relatedLimit = clampInt(url.searchParams.get('related_limit'), 8, 1, 20);
  const exceptionLimit = clampInt(url.searchParams.get('exception_limit'), 80, 1, 200);

  try {
    const selectors = await listIntelligenceSelectors(a.db);
    const genealogy = await loadGenealogyExceptions(a.db, { limit: exceptionLimit });

    const [productIntelligence, relatedProducts, creativeReadiness] = await Promise.all([
      productId ? loadProductAvailabilityIntelligence(a.db, productId, { forecastUnits }) : null,
      productId ? loadRelatedProductIntelligence(a.db, productId, { limit: relatedLimit }) : null,
      creativeProjectId ? loadCreativeReadinessIntelligence(a.db, creativeProjectId, { forecastUnits }) : null,
    ]);

    const bundle = {
      ok: true,
      forecast_policy: {
        scenario_units: forecastUnits,
        operator_scenario_only: true,
        actual_planned_quantity_claimed: false,
        stock_consumption_performed: false,
      },
      selectors,
      product_intelligence: productIntelligence,
      related_product_intelligence: relatedProducts,
      genealogy_exceptions: genealogy,
      creative_readiness: creativeReadiness,
    };

    bundle.next_safe_action = chooseNextSafeAction(bundle);
    return json(bundle);
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || 'Inventory & Creator intelligence could not load.',
    }, 500);
  }
}
