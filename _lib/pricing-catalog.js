// functions/api/_lib/pricing-catalog.js
// Canonical pricing catalog loader.
// Reads app_management_settings.pricing_catalog first, then falls back to bundled JSON.

import { serviceHeaders } from "./staff-session.js";

const FALLBACK_CATALOG = {"charts": [{"filename": "CarPrice2025.PNG", "title": "Vehicle Price Chart 2025", "r2_url": "/assets/brand/CarPrice2025.PNG"}, {"filename": "CarPriceDetails2025.PNG", "title": "Package Service Details Chart", "r2_url": "/assets/brand/CarPriceDetails2025.PNG"}, {"filename": "CarSizeChart.PNG", "title": "Vehicle Size Chart", "r2_url": "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG"}], "packages": [{"code": "premium_wash", "name": "Premium Wash", "subtitle": "Quick exterior clean", "prices_cad": {"small": 85, "mid": 105, "oversize": 125}, "deposit_cad": 50, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWash.png", "mid": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWashMidSize.png", "oversize": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWashLargeSizeExotic.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Quick exterior-focused clean", "Main image changes with vehicle size"]}, {"code": "basic_detail", "name": "Basic Detail", "subtitle": "Quick interior clean", "prices_cad": {"small": 115, "mid": 135, "oversize": 170}, "deposit_cad": 50, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailSmallSize.png", "mid": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailMidSize.png", "oversize": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailExotics.png"}, "included_services": [{"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Quick interior-focused package", "Main image changes with vehicle size"]}, {"code": "complete_detail", "name": "Complete Detail", "subtitle": "Our #1 choice", "prices_cad": {"small": 319, "mid": 369, "oversize": 419}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/CompleteDetailSmallCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/CompleteDetailMidSizelCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/CompleteDetailOverSizeExoticCars.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Shampoo Carpets & Mats"}, {"name": "Shampoo Cloth Seats", "optional_condition_note": "Where equipped"}], "notes": ["Best all-around package", "Main image changes with vehicle size"]}, {"code": "interior_detail", "name": "Interior Detail", "subtitle": "Full interior detailing", "prices_cad": {"small": 195, "mid": 220, "oversize": 245}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailSmallCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailMidSuvCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailLargeExoticCars.png"}, "included_services": [{"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Shampoo Carpets & Mats"}, {"name": "Shampoo Cloth Seats", "optional_condition_note": "Where equipped"}], "notes": ["Interior-only full detailing package", "Main image changes with vehicle size"]}, {"code": "exterior_detail", "name": "Exterior Detail", "subtitle": "Full exterior detailing", "prices_cad": {"small": 195, "mid": 220, "oversize": 245}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailSmallSizeCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailMidSizeCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailLargeExoticCars.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Exterior-only full detailing package", "Main image changes with vehicle size"]}], "service_matrix": [{"service": "Hand Wash & Dry", "included_in": {"premium_wash": true, "basic_detail": false, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Full Vacuum (Seats, Carpets, Mats, Trunk)", "included_in": {"premium_wash": false, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Clean Dash & Centre Console", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Clean Windows (In/Out)", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": true}}, {"service": "Door Jambs", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Wash Tires & Wheel Wells", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Clean Leather / Vinyl Seats", "conditional_note": "Where equipped", "included_in": {"premium_wash": false, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Shampoo Carpets & Mats", "included_in": {"premium_wash": false, "basic_detail": false, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Shampoo Cloth Seats", "conditional_note": "Where equipped", "included_in": {"premium_wash": false, "basic_detail": false, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}], "addons": [{"code": "full_clay_treatment", "name": "Full Clay Treatment", "prices_cad": {"small": 79, "mid": 99, "oversize": 129}, "quote_required": false, "source": "interpreted_pricing", "notes": ["Add-on service not included in any package", "Requires exterior or complete detail first."], "category": "paint correction", "type": "surface prep", "image_url": "https://assets.rosiedazzlers.ca/packages/full_clay_treatment.png", "image_fallback_url": "/assets/addons/full_clay_treatment.png", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first."}, {"code": "two_stage_polish", "name": "Two Stage Polish", "prices_cad": {"small": 199, "mid": 279, "oversize": 359}, "quote_required": true, "source": "interpreted_pricing", "notes": ["Quote required because paint condition varies", "Requires exterior or complete detail first."], "category": "paint correction", "type": "machine polishing", "image_url": "https://assets.rosiedazzlers.ca/packages/two_stage_polish.png", "image_fallback_url": "/assets/addons/two_stage_polish.png", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first."}, {"code": "high_grade_paint_sealant", "name": "High Grade Paint Sealant", "prices_cad": {"small": 59, "mid": 79, "oversize": 99}, "quote_required": false, "source": "interpreted_pricing", "category": "paint protection", "type": "sealant", "image_url": "https://assets.rosiedazzlers.ca/packages/high_grade_paint_sealant.png", "notes": ["Longer-lasting gloss", "Requires exterior or complete detail first."], "image_fallback_url": "/assets/addons/high_grade_paint_sealant.png", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first."}, {"code": "uv_protectant_applied_on_interior_panels", "name": "UV Protectant Applied on Interior Panels", "prices_cad": {"small": 25, "mid": 35, "oversize": 45}, "quote_required": false, "source": "interpreted_pricing", "category": "interior protection", "type": "uv protectant", "image_url": "https://assets.rosiedazzlers.ca/packages/uv_protectant_applied_on_interior_panels.png", "notes": ["Interior panel dressing", "Requires complete detail first."], "image_fallback_url": "/assets/addons/uv_protectant_applied_on_interior_panels.png", "standalone_allowed": false, "requires_package_codes_any": ["complete_detail"], "requirement_note": "Requires a complete detail so both the interior and exterior glass can be properly cleaned first."}, {"code": "de_ionizing_treatment", "name": "De-Ionizing Treatment", "prices_cad": {"small": 59, "mid": 79, "oversize": 99}, "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/De-Ionizing%20Vehicle%20Add%20on%20service.png", "category": "odor treatment", "type": "de-ionizing", "image_fallback_url": "/assets/addons/de_ionizing_treatment.svg", "standalone_allowed": false, "requires_package_codes_any": ["interior_detail", "complete_detail"], "requirement_note": "Requires an interior or complete detail so odor-source surfaces can be cleaned first.", "notes": ["Requires interior or complete detail first."]}, {"code": "de_badging", "name": "De-Badging", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/DeBadgingAddonService.png", "category": "appearance modifications", "type": "badge removal", "image_fallback_url": "/assets/addons/de_badging.svg", "standalone_allowed": true, "requires_package_codes_any": [], "requirement_note": "", "notes": []}, {"code": "engine_cleaning", "name": "Engine Cleaning", "price_cad": 59, "quote_required": false, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Engine%20Cleaning%20add%20on%20service.png", "category": "engine bay", "type": "cleaning", "image_fallback_url": "/assets/addons/engine_cleaning.svg", "standalone_allowed": true, "requires_package_codes_any": [], "requirement_note": "Can be booked as a standalone add-on when safe engine-bay access is available.", "prices_cad": {"small": 59, "mid": 69, "oversize": 79}, "notes": ["Standalone service allowed."]}, {"code": "external_ceramic_coating", "name": "External Ceramic Coating", "price_cad": 299, "quote_required": true, "source": "package_asset", "notes": ["Starting price only", "Requires exterior or complete detail first."], "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Ceramic%20coating%20add%20on%20service.png", "category": "paint protection", "type": "ceramic coating", "image_fallback_url": "/assets/addons/external_ceramic_coating.svg", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first."}, {"code": "external_graphene_fine_finish", "name": "External Graphene Fine Finish", "price_cad": 249, "quote_required": true, "source": "package_asset", "notes": ["Starting price only", "Requires exterior or complete detail first."], "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Graphene%20Fine%20finish%20add%20on%20service.png", "category": "paint protection", "type": "graphene finish", "image_fallback_url": "/assets/addons/external_graphene_fine_finish.svg", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first."}, {"code": "external_wax", "name": "External Wax", "prices_cad": {"small": 49, "mid": 59, "oversize": 69}, "quote_required": false, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Wax%20add%20on%20service.png", "category": "paint protection", "type": "wax", "image_fallback_url": "/assets/addons/external_wax.svg", "standalone_allowed": false, "requires_package_codes_any": ["exterior_detail", "complete_detail"], "requirement_note": "Requires an exterior or complete detailing package first.", "notes": ["Requires exterior or complete detail first."]}, {"code": "vinyl_wrapping", "name": "Vinyl Wrapping", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Vinyl%20Wrapping%20add%20on%20service.png", "category": "appearance modifications", "type": "vinyl wrapping", "image_fallback_url": "/assets/addons/vinyl_wrapping.svg", "standalone_allowed": true, "requires_package_codes_any": [], "requirement_note": "", "notes": []}, {"code": "window_tinting", "name": "Window Tinting", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Window%20Tinting%20add%20on%20service.png", "category": "glass services", "type": "window tinting", "image_fallback_url": "/assets/addons/window_tinting.svg", "standalone_allowed": true, "requires_package_codes_any": [], "requirement_note": "", "notes": []}]};

const LOCAL_CHART_URLS = {
  "CarPrice2025.PNG": "/assets/brand/CarPrice2025.PNG",
  "CarPriceDetails2025.PNG": "/assets/brand/CarPriceDetails2025.PNG",
  "CarSizeChart.PNG": "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG"
};

const DEFAULT_BOOKING_RULES = {
  availability_window_days: 21,
  default_service_area: "Tillsonburg, Oxford County",
  hold_minutes: 30,
  slot_labels: {
    AM: "AM half day",
    PM: "PM half day",
    FULL: "Full day"
  },
  public_requirements: [
    "Driveway required",
    "Customer provides power and water or additional fees may apply",
    "One vehicle per day unless half-day jobs are confirmed"
  ],
  travel_pricing: {
    urban: 0,
    township: 0,
    hamlet: 10,
    coastal: 20,
    rural: 20,
    out_of_zone: 50,
    notes: "Travel charges are managed centrally in App Management."
  },
  price_controls: {
    fuel_surcharge_cad: 0,
    material_surcharge_cad: 0,
    minimum_callout_cad: 0,
    tax_rate_percent: 13
  }
};

export async function loadPricingCatalog(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return normalizeCatalog(FALLBACK_CATALOG);
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.pricing_catalog&limit=1`,
      { headers: serviceHeaders(env) }
    );

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (row && row.value && typeof row.value === "object") {
        return mergeCatalog(row.value, FALLBACK_CATALOG);
      }
    }
  } catch {}

  return normalizeCatalog(FALLBACK_CATALOG);
}

export function normalizeCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const charts = normalizeCharts(source.charts);
  const packages = normalizePackages(source.packages);
  const addons = normalizeAddons(source.addons);
  const serviceAreas = normalizeServiceAreas(source.service_areas);
  const serviceMatrix = Array.isArray(source.service_matrix) ? source.service_matrix : [];

  const packageMap = Object.create(null);
  const addonMap = Object.create(null);

  for (const pkg of packages) packageMap[pkg.code] = pkg;
  for (const addon of addons) addonMap[addon.code] = addon;

  const bookingRuleSource = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  const bookingRules = {
    availability_window_days: numberOr(bookingRuleSource.availability_window_days, DEFAULT_BOOKING_RULES.availability_window_days),
    default_service_area: cleanText(bookingRuleSource.default_service_area) || DEFAULT_BOOKING_RULES.default_service_area,
    hold_minutes: numberOr(bookingRuleSource.hold_minutes, DEFAULT_BOOKING_RULES.hold_minutes),
    slot_labels: {
      ...DEFAULT_BOOKING_RULES.slot_labels,
      ...(bookingRuleSource.slot_labels && typeof bookingRuleSource.slot_labels === "object" ? bookingRuleSource.slot_labels : {})
    },
    public_requirements: normalizeStringArray(
      Array.isArray(bookingRuleSource.public_requirements) ? bookingRuleSource.public_requirements : DEFAULT_BOOKING_RULES.public_requirements
    ),
    travel_pricing: {
      urban: numberOr(bookingRuleSource?.travel_pricing?.urban, DEFAULT_BOOKING_RULES.travel_pricing.urban),
      township: numberOr(bookingRuleSource?.travel_pricing?.township, DEFAULT_BOOKING_RULES.travel_pricing.township),
      hamlet: numberOr(bookingRuleSource?.travel_pricing?.hamlet, DEFAULT_BOOKING_RULES.travel_pricing.hamlet),
      coastal: numberOr(bookingRuleSource?.travel_pricing?.coastal, DEFAULT_BOOKING_RULES.travel_pricing.coastal),
      rural: numberOr(bookingRuleSource?.travel_pricing?.rural, DEFAULT_BOOKING_RULES.travel_pricing.rural),
      out_of_zone: numberOr(bookingRuleSource?.travel_pricing?.out_of_zone, DEFAULT_BOOKING_RULES.travel_pricing.out_of_zone),
      notes: cleanText(bookingRuleSource?.travel_pricing?.notes) || DEFAULT_BOOKING_RULES.travel_pricing.notes
    },
    price_controls: {
      fuel_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.fuel_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.fuel_surcharge_cad),
      material_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.material_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.material_surcharge_cad),
      minimum_callout_cad: numberOr(bookingRuleSource?.price_controls?.minimum_callout_cad, DEFAULT_BOOKING_RULES.price_controls.minimum_callout_cad),
      tax_rate_percent: numberOr(bookingRuleSource?.price_controls?.tax_rate_percent, DEFAULT_BOOKING_RULES.price_controls.tax_rate_percent)
    }
  };

  const publicRequirements = normalizeStringArray(
    Array.isArray(source.public_requirements) ? source.public_requirements : bookingRules.public_requirements
  );

  return {
    ...source,
    charts,
    packages,
    addons,
    service_matrix: serviceMatrix,
    service_areas: serviceAreas,
    booking_rules: bookingRules,
    public_requirements: publicRequirements,
    package_map: packageMap,
    addon_map: addonMap
  };
}

function mergeRowsByCode(primaryRows, fallbackRows) {
  const fallbackMap = new Map((Array.isArray(fallbackRows) ? fallbackRows : []).map((row) => [String(row?.code || row?.value || row?.label || ""), row]));
  const primaryList = Array.isArray(primaryRows) ? primaryRows : [];
  const merged = primaryList.map((row) => {
    const key = String(row?.code || row?.value || row?.label || "");
    const fallbackRow = fallbackMap.get(key);
    if (!fallbackRow) return row;
    const mergedRow = {
      ...fallbackRow,
      ...row,
      prices_cad: row?.prices_cad && typeof row.prices_cad === "object"
        ? { ...(fallbackRow?.prices_cad || {}), ...row.prices_cad }
        : (fallbackRow?.prices_cad || row?.prices_cad),
      images_by_size: row?.images_by_size && typeof row.images_by_size === "object"
        ? { ...(fallbackRow?.images_by_size || {}), ...row.images_by_size }
        : (fallbackRow?.images_by_size || row?.images_by_size),
      image_url: cleanText(row?.image_url) || cleanText(fallbackRow?.image_url) || null,
      image_fallback_url: cleanText(row?.image_fallback_url) || cleanText(fallbackRow?.image_fallback_url) || null,
      included_services: hasRows(row?.included_services) ? row.included_services : fallbackRow?.included_services,
      notes: hasRows(row?.notes) ? row.notes : fallbackRow?.notes,
      official_links: hasRows(row?.official_links) ? row.official_links : fallbackRow?.official_links,
      requires_package_codes_any: hasRows(row?.requires_package_codes_any) ? row.requires_package_codes_any : (fallbackRow?.requires_package_codes_any || [])
    };
    return mergedRow;
  });
  const seen = new Set(merged.map((row) => String(row?.code || row?.value || row?.label || "")).filter(Boolean));
  for (const row of Array.isArray(fallbackRows) ? fallbackRows : []) {
    const key = String(row?.code || row?.value || row?.label || "");
    if (key && seen.has(key)) continue;
    merged.push(row);
  }
  return merged;
}

function mergeCatalog(primary, fallback) {
  return normalizeCatalog({
    ...fallback,
    ...primary,
    charts: hasRows(primary?.charts) ? primary.charts : fallback?.charts,
    packages: hasRows(primary?.packages) ? mergeRowsByCode(primary.packages, fallback?.packages) : fallback?.packages,
    addons: hasRows(primary?.addons) ? mergeRowsByCode(primary.addons, fallback?.addons) : fallback?.addons,
    service_matrix: hasRows(primary?.service_matrix) ? primary.service_matrix : fallback?.service_matrix,
    service_areas: hasRows(primary?.service_areas) ? mergeRowsByCode(primary.service_areas, fallback?.service_areas) : fallback?.service_areas,
    booking_rules: {
      ...(fallback?.booking_rules || {}),
      ...(primary?.booking_rules || {})
    },
    public_requirements: hasRows(primary?.public_requirements) ? primary.public_requirements : fallback?.public_requirements
  });
}

function hasRows(value) {
  return Array.isArray(value) && value.length > 0;
}

function normalizeCharts(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const title = cleanText(row?.title || row?.filename);
    const filename = cleanText(row?.filename) || null;
    const r2Url = LOCAL_CHART_URLS[filename] || cleanText(row?.r2_url);
    if (!title || !r2Url) return null;
    return {
      filename,
      title,
      r2_url: r2Url
    };
  }).filter(Boolean);
}

function normalizePackages(rows) {
  return (Array.isArray(rows) ? rows : []).map((pkg) => {
    const code = cleanText(pkg?.code);
    if (!code) return null;
    const images = pkg?.images_by_size && typeof pkg.images_by_size === "object" ? pkg.images_by_size : {};
    const included = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
    return {
      ...pkg,
      code,
      name: cleanText(pkg?.name) || code,
      subtitle: cleanText(pkg?.subtitle) || null,
      deposit_cad: toMoney(pkg?.deposit_cad),
      prices_cad: normalizeSizeMap(pkg?.prices_cad),
      images_by_size: {
        small: cleanText(images.small) || null,
        mid: cleanText(images.mid) || null,
        oversize: cleanText(images.oversize) || null
      },
      included_services: included.map((row) => typeof row === "string"
        ? { name: cleanText(row) }
        : { ...row, name: cleanText(row?.name) }
      ).filter((row) => row.name),
      notes: normalizeStringArray(pkg?.notes)
    };
  }).filter(Boolean);
}

function normalizeAddons(rows) {
  return (Array.isArray(rows) ? rows : []).map((addon) => {
    const code = cleanText(addon?.code);
    if (!code) return null;
    return {
      ...addon,
      code,
      name: cleanText(addon?.name) || code,
      quote_required: addon?.quote_required === true,
      standalone_allowed: addon?.standalone_allowed === true,
      requires_package_codes_any: normalizeStringArray(addon?.requires_package_codes_any),
      requirement_note: cleanText(addon?.requirement_note) || null,
      prices_cad: normalizeSizeMap(addon?.prices_cad),
      price_cad: toMoney(addon?.price_cad),
      image_url: cleanText(addon?.image_url) || null,
      image_fallback_url: cleanText(addon?.image_fallback_url) || null,
      notes: normalizeStringArray(addon?.notes)
    };
  }).filter(Boolean);
}

function normalizeServiceAreas(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const value = cleanText(row?.value || row?.label);
    const label = cleanText(row?.label || row?.value);
    if (!value && !label) return null;
    return {
      ...row,
      county: cleanText(row?.county) || null,
      value: value || label,
      label: label || value,
      municipality: cleanText(row?.municipality) || null,
      zone: cleanText(row?.zone) || null,
      area_type: cleanText(row?.area_type) || null,
      travel_tier: cleanText(row?.travel_tier) || 'township',
      bylaw_note: cleanText(row?.bylaw_note) || null,
      parking_rule: cleanText(row?.parking_rule) || null,
      noise_rule: cleanText(row?.noise_rule) || null,
      water_rule: cleanText(row?.water_rule) || null,
      access_rule: cleanText(row?.access_rule) || null,
      official_links: (Array.isArray(row?.official_links) ? row.official_links : []).map((link) => ({
        label: cleanText(link?.label) || "Official source",
        url: cleanText(link?.url)
      })).filter((link) => link.url)
    };
  }).filter(Boolean);
}

function normalizeSizeMap(value) {
  const map = value && typeof value === "object" ? value : {};
  return {
    small: toMoney(map.small),
    mid: toMoney(map.mid),
    oversize: toMoney(map.oversize)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((row) => cleanText(row)).filter(Boolean);
}

function cleanText(value) {
  return String(value || "").trim();
}

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
