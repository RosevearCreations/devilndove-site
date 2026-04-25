// /assets/pricing-catalog-client.js
// Shared client-side pricing catalog loader and normalizer for public Rosie Dazzlers pages.

const DEFAULT_CHARTS = [
  { filename: "CarPrice2025.PNG", title: "Vehicle Price Chart 2025", r2_url: "/assets/brand/CarPrice2025.PNG" },
  { filename: "CarPriceDetails2025.PNG", title: "Package Service Details Chart", r2_url: "/assets/brand/CarPriceDetails2025.PNG" },
  { filename: "CarSizeChart.PNG", title: "Vehicle Size Chart", r2_url: "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG" }
];

const LOCAL_CHART_URLS = {
  "CarPrice2025.PNG": "/assets/brand/CarPrice2025.PNG",
  "CarPriceDetails2025.PNG": "/assets/brand/CarPriceDetails2025.PNG"
};

export const DEFAULT_BOOKING_RULES = {
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
  ]
};

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSizeMap(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    small: toMoney(source.small),
    mid: toMoney(source.mid),
    oversize: toMoney(source.oversize)
  };
}

function normalizeCharts(rows) {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_CHARTS;
  return source.map((row) => {
    const filename = String(row?.filename || "").trim() || null;
    return {
      filename,
      title: String(row?.title || row?.filename || "").trim() || null,
      r2_url: LOCAL_CHART_URLS[filename] || String(row?.r2_url || "").trim() || null
    };
  }).filter((row) => row.title && row.r2_url);
}

function normalizePackages(rows) {
  return (Array.isArray(rows) ? rows : []).map((pkg) => {
    const code = String(pkg?.code || "").trim();
    if (!code) return null;
    const images = pkg?.images_by_size && typeof pkg.images_by_size === "object" ? pkg.images_by_size : {};
    const included = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
    const notes = Array.isArray(pkg?.notes) ? pkg.notes : [];
    return {
      ...pkg,
      code,
      name: String(pkg?.name || code).trim(),
      subtitle: String(pkg?.subtitle || "").trim() || null,
      deposit_cad: toMoney(pkg?.deposit_cad),
      prices_cad: normalizeSizeMap(pkg?.prices_cad),
      images_by_size: {
        small: String(images.small || "").trim() || null,
        mid: String(images.mid || "").trim() || null,
        oversize: String(images.oversize || "").trim() || null
      },
      included_services: included.map((row) => typeof row === "string" ? { name: row } : {
        ...row,
        name: String(row?.name || "").trim()
      }).filter((row) => row.name),
      notes: notes.map((row) => String(row || "").trim()).filter(Boolean)
    };
  }).filter(Boolean);
}

function normalizeAddons(rows) {
  return (Array.isArray(rows) ? rows : []).map((addon) => {
    const code = String(addon?.code || "").trim();
    if (!code) return null;
    const notes = Array.isArray(addon?.notes) ? addon.notes : [];
    return {
      ...addon,
      code,
      name: String(addon?.name || code).trim(),
      quote_required: addon?.quote_required === true,
      prices_cad: normalizeSizeMap(addon?.prices_cad),
      price_cad: toMoney(addon?.price_cad),
      image_url: String(addon?.image_url || "").trim() || null,
      image_fallback_url: String(addon?.image_fallback_url || "").trim() || null,
      notes: notes.map((row) => String(row || "").trim()).filter(Boolean)
    };
  }).filter(Boolean);
}

function normalizeServiceAreas(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const officialLinks = Array.isArray(row?.official_links) ? row.official_links : [];
    return {
      ...row,
      county: String(row?.county || "").trim() || null,
      value: String(row?.value || row?.label || "").trim() || null,
      label: String(row?.label || row?.value || "").trim() || null,
      municipality: String(row?.municipality || "").trim() || null,
      zone: String(row?.zone || "").trim() || null,
      bylaw_note: String(row?.bylaw_note || "").trim() || null,
      parking_rule: String(row?.parking_rule || "").trim() || null,
      noise_rule: String(row?.noise_rule || "").trim() || null,
      water_rule: String(row?.water_rule || "").trim() || null,
      access_rule: String(row?.access_rule || "").trim() || null,
      official_links: officialLinks.map((link) => ({
        label: String(link?.label || "Official source").trim(),
        url: String(link?.url || "").trim()
      })).filter((link) => link.url)
    };
  }).filter((row) => row.value || row.label);
}

export function normalizePricingCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const charts = normalizeCharts(source.charts);
  const packages = normalizePackages(source.packages);
  const addons = normalizeAddons(source.addons);
  const serviceMatrix = Array.isArray(source.service_matrix) ? source.service_matrix : [];
  const serviceAreas = normalizeServiceAreas(source.service_areas);

  const bookingRuleSource = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  const booking_rules = {
    availability_window_days: Number(bookingRuleSource.availability_window_days || DEFAULT_BOOKING_RULES.availability_window_days) || DEFAULT_BOOKING_RULES.availability_window_days,
    default_service_area: String(bookingRuleSource.default_service_area || DEFAULT_BOOKING_RULES.default_service_area).trim() || DEFAULT_BOOKING_RULES.default_service_area,
    hold_minutes: Number(bookingRuleSource.hold_minutes || DEFAULT_BOOKING_RULES.hold_minutes) || DEFAULT_BOOKING_RULES.hold_minutes,
    slot_labels: {
      ...DEFAULT_BOOKING_RULES.slot_labels,
      ...(bookingRuleSource.slot_labels && typeof bookingRuleSource.slot_labels === "object" ? bookingRuleSource.slot_labels : {})
    },
    public_requirements: (Array.isArray(bookingRuleSource.public_requirements) ? bookingRuleSource.public_requirements : DEFAULT_BOOKING_RULES.public_requirements)
      .map((row) => String(row || "").trim())
      .filter(Boolean)
  };

  const public_requirements = (Array.isArray(source.public_requirements) ? source.public_requirements : booking_rules.public_requirements)
    .map((row) => String(row || "").trim())
    .filter(Boolean);

  return {
    ...source,
    charts,
    packages,
    addons,
    service_matrix: serviceMatrix,
    service_areas: serviceAreas,
    booking_rules,
    public_requirements
  };
}

function mergeCatalog(primary, fallback) {
  return normalizePricingCatalog({
    ...fallback,
    ...primary,
    charts: Array.isArray(primary?.charts) && primary.charts.length ? primary.charts : fallback?.charts,
    packages: Array.isArray(primary?.packages) && primary.packages.length ? primary.packages : fallback?.packages,
    addons: Array.isArray(primary?.addons) && primary.addons.length ? primary.addons : fallback?.addons,
    service_matrix: Array.isArray(primary?.service_matrix) && primary.service_matrix.length ? primary.service_matrix : fallback?.service_matrix,
    service_areas: Array.isArray(primary?.service_areas) && primary.service_areas.length ? primary.service_areas : fallback?.service_areas,
    booking_rules: {
      ...(fallback?.booking_rules || {}),
      ...(primary?.booking_rules || {})
    },
    public_requirements: Array.isArray(primary?.public_requirements) && primary.public_requirements.length ? primary.public_requirements : fallback?.public_requirements
  });
}

export async function fetchJsonStrict(url, options = {}) {
  const res = await fetch(url, { cache: "no-store", ...options });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const head = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Expected JSON from ${url} but got: ${head}`);
  }
  if (!res.ok) throw new Error(parsed?.error || `Request failed for ${url}`);
  return parsed;
}

export async function loadPricingCatalogClient({
  apiUrl = "/api/pricing_catalog_public",
  fallbackUrl = "/data/rosie_services_pricing_and_packages.json",
  credentials = "same-origin"
} = {}) {
  let apiCatalog = null;
  let apiError = null;
  try {
    apiCatalog = normalizePricingCatalog(await fetchJsonStrict(apiUrl, { credentials }));
  } catch (err) {
    apiError = err;
  }

  const needsFallback = !apiCatalog
    || !Array.isArray(apiCatalog.packages) || !apiCatalog.packages.length
    || !Array.isArray(apiCatalog.addons) || !apiCatalog.addons.length
    || !Array.isArray(apiCatalog.service_areas) || !apiCatalog.service_areas.length
    || !Array.isArray(apiCatalog.charts) || !apiCatalog.charts.length;

  if (!needsFallback) {
    if (apiError) {
      apiCatalog._source = "api_with_partial_fallback";
      apiCatalog._fallback_error = apiError?.message || null;
    } else {
      apiCatalog._source = "api";
    }
    return apiCatalog;
  }

  const fallbackCatalog = normalizePricingCatalog(await fetchJsonStrict(fallbackUrl, { credentials }));
  const merged = apiCatalog ? mergeCatalog(apiCatalog, fallbackCatalog) : fallbackCatalog;
  merged._source = apiCatalog ? "api_merged_with_bundled_fallback" : "bundled_json_fallback";
  merged._fallback_error = apiError?.message || null;
  return merged;
}

export function money(cad) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(cad || 0));
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function packagePrice(pkg, size) {
  return pkg?.prices_cad?.[size] ?? null;
}

export function packageImageForSize(pkg, size) {
  return pkg?.images_by_size?.[size] || Object.values(pkg?.images_by_size || {}).find(Boolean) || "";
}

export function addonPrimaryImage(addon) {
  return String(addon?.image_url || "").trim() || "";
}

export function addonFallbackImage(addon) {
  return String(addon?.image_fallback_url || "").trim() || "/assets/addons/generic_addon.svg";
}


function svgEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeSvgColumns(columns) {
  const rows = Array.isArray(columns) ? columns : [];
  const total = rows.reduce((sum, col) => sum + Math.max(1, Number(col?.width || 1)), 0) || 1;
  return rows.map((col) => ({
    ...col,
    widthUnits: Math.max(1, Number(col?.width || 1)),
    ratio: Math.max(1, Number(col?.width || 1)) / total
  }));
}

function renderSvgTableChart({ title, subtitle = "", columns = [], rows = [], footer = "", accent = "#f472b6" }) {
  const safeColumns = normalizeSvgColumns(columns);
  const safeRows = Array.isArray(rows) ? rows : [];
  const width = 1200;
  const margin = 36;
  const innerWidth = width - margin * 2;
  const titleY = 60;
  const subtitleY = subtitle ? 90 : 78;
  const tableTop = subtitle ? 124 : 108;
  const headerHeight = 48;
  const rowHeight = 44;
  const footerHeight = footer ? 44 : 18;
  const height = tableTop + headerHeight + (safeRows.length * rowHeight) + footerHeight + 24;
  let cursor = margin;
  const columnRects = safeColumns.map((col) => {
    const widthPx = innerWidth * col.ratio;
    const rect = { ...col, x: cursor, widthPx };
    cursor += widthPx;
    return rect;
  });

  const headerCells = columnRects.map((col) => `
    <text x="${(col.x + 14).toFixed(2)}" y="${tableTop + 30}" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#f8fafc">${svgEscape(col.label || "")}</text>
  `).join("");

  const rowBands = safeRows.map((row, rowIdx) => {
    const y = tableTop + headerHeight + rowIdx * rowHeight;
    const band = rowIdx % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    const cells = columnRects.map((col) => {
      const raw = Array.isArray(row?.cells) ? row.cells[col.index] : "";
      const cell = typeof raw === 'object' && raw !== null ? raw : { text: raw };
      const align = cell.align === 'right' ? 'end' : 'start';
      const x = cell.align === 'right' ? (col.x + col.widthPx - 14) : (col.x + 14);
      const weight = cell.weight === 'bold' ? '700' : '500';
      const fill = cell.fill || '#e5e7eb';
      const size = Number(cell.size || 18);
      return `<text x="${x.toFixed(2)}" y="${y + 28}" text-anchor="${align}" font-size="${size}" font-family="Arial, Helvetica, sans-serif" font-weight="${weight}" fill="${fill}">${svgEscape(cell.text || "")}</text>`;
    }).join("");
    return `
      <rect x="${margin}" y="${y}" width="${innerWidth}" height="${rowHeight}" rx="8" fill="${band}" />
      ${cells}
    `;
  }).join("");

  const verticals = columnRects.slice(1).map((col) => `<line x1="${col.x.toFixed(2)}" y1="${tableTop}" x2="${col.x.toFixed(2)}" y2="${height - footerHeight}" stroke="rgba(255,255,255,0.08)" />`).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${svgEscape(title)}">
  <defs>
    <linearGradient id="rdAccent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#1f2937" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="24" fill="url(#rdAccent)" />
  <rect x="${margin}" y="${tableTop - 14}" width="${innerWidth}" height="${headerHeight}" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.10)" />
  <text x="${margin}" y="${titleY}" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff">${svgEscape(title)}</text>
  ${subtitle ? `<text x="${margin}" y="${subtitleY}" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="#dbe4f0">${svgEscape(subtitle)}</text>` : ''}
  <rect x="${margin}" y="${tableTop - 14}" width="${innerWidth}" height="4" rx="2" fill="${accent}" />
  ${headerCells}
  ${verticals}
  ${rowBands}
  ${footer ? `<text x="${margin}" y="${height - 18}" font-size="16" font-family="Arial, Helvetica, sans-serif" fill="#cbd5e1">${svgEscape(footer)}</text>` : ''}
</svg>`;
}

export function buildLivePricingChartSvg(catalog) {
  const normalized = normalizePricingCatalog(catalog);
  const rows = normalized.packages.map((pkg) => ({
    cells: [
      { text: pkg.name || pkg.code, weight: 'bold', fill: '#ffffff' },
      { text: pkg.prices_cad?.small != null ? money(pkg.prices_cad.small) : '—' },
      { text: pkg.prices_cad?.mid != null ? money(pkg.prices_cad.mid) : '—' },
      { text: pkg.prices_cad?.oversize != null ? money(pkg.prices_cad.oversize) : '—' },
      { text: pkg.deposit_cad != null ? money(pkg.deposit_cad) : '—' }
    ]
  }));
  return renderSvgTableChart({
    title: 'Vehicle Price Chart',
    subtitle: 'Generated live from the current Rosie Dazzlers pricing catalog.',
    columns: [
      { index: 0, label: 'Package', width: 2.4 },
      { index: 1, label: 'Small', width: 1.05 },
      { index: 2, label: 'Mid-sized', width: 1.15 },
      { index: 3, label: 'Oversize / exotic', width: 1.35 },
      { index: 4, label: 'Deposit', width: 1.05 }
    ],
    rows,
    footer: 'Booking, pricing, and checkout all read the same canonical pricing source with bundled JSON fallback.',
    accent: '#fb7185'
  });
}

export function buildLivePricingChartDataUri(catalog) {
  return svgDataUri(buildLivePricingChartSvg(catalog));
}

export function buildLiveServiceDetailsChartSvg(catalog) {
  const normalized = normalizePricingCatalog(catalog);
  const packageNames = normalized.packages.map((pkg) => pkg.name || pkg.code);
  const packageCodes = normalized.packages.map((pkg) => pkg.code);
  const rows = (Array.isArray(normalized.service_matrix) ? normalized.service_matrix : []).map((row) => ({
    cells: [
      { text: row?.service || 'Service item', weight: 'bold', fill: '#ffffff', size: 17 },
      ...packageCodes.map((code) => ({
        text: row?.included_in?.[code] ? '✓' : '—',
        align: 'right',
        fill: row?.included_in?.[code] ? '#86efac' : '#cbd5e1',
        weight: row?.included_in?.[code] ? 'bold' : '500',
        size: 20
      }))
    ]
  }));
  return renderSvgTableChart({
    title: 'Package Service Details',
    subtitle: 'Generated live from the same package/service matrix used by the public site.',
    columns: [
      { index: 0, label: 'Included service', width: 3.2 },
      ...packageNames.map((name, idx) => ({ index: idx + 1, label: name, width: Math.max(1.05, name.length / 10) }))
    ],
    rows,
    footer: '✓ means the service is included in that package.',
    accent: '#f472b6'
  });
}

export function buildLiveServiceDetailsChartDataUri(catalog) {
  return svgDataUri(buildLiveServiceDetailsChartSvg(catalog));
}


export function buildLiveVehicleSizeChartSvg(catalog) {
  const rows = [
    {
      cells: [
        { text: 'Small', weight: 'bold', fill: '#ffffff' },
        { text: 'Cars, compact SUVs, small crossovers' },
        { text: 'Easiest fit for the base price tier' }
      ]
    },
    {
      cells: [
        { text: 'Mid-sized', weight: 'bold', fill: '#ffffff' },
        { text: 'Sedans, vans, regular SUVs, light trucks' },
        { text: 'More cabin/cargo area and setup time' }
      ]
    },
    {
      cells: [
        { text: 'Oversize / exotic', weight: 'bold', fill: '#ffffff' },
        { text: 'Large SUVs, heavy trucks, specialty/exotic vehicles' },
        { text: 'Highest surface area or special-care handling' }
      ]
    }
  ];

  return renderSvgTableChart({
    title: 'Vehicle Size Guide',
    subtitle: 'Generated live so the public size reference stays consistent with booking and pricing labels.',
    columns: [
      { index: 0, label: 'Pricing size', width: 1.1 },
      { index: 1, label: 'Common examples', width: 2.8 },
      { index: 2, label: 'How to choose', width: 2.2 }
    ],
    rows,
    footer: 'Unsure? Choose the closest size and Rosie Dazzlers can confirm before the appointment.',
    accent: '#38bdf8'
  });
}

export function buildLiveVehicleSizeChartDataUri(catalog) {
  return svgDataUri(buildLiveVehicleSizeChartSvg(catalog));
}

export function buildPricingOfferCatalogSchema(catalog, pageUrl = 'https://rosiedazzlers.ca/pricing') {
  const normalized = normalizePricingCatalog(catalog);
  const sizeLabels = {
    small: 'Small vehicle',
    mid: 'Mid-sized vehicle',
    oversize: 'Oversize / exotic vehicle'
  };
  const offers = normalized.packages.flatMap((pkg) => ['small', 'mid', 'oversize'].map((size) => {
    const price = pkg?.prices_cad?.[size];
    if (price == null) return null;
    return {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: Number(price),
      availability: 'https://schema.org/InStock',
      url: `https://rosiedazzlers.ca/book?package=${encodeURIComponent(pkg.code)}&size=${encodeURIComponent(size)}`,
      itemOffered: {
        '@type': 'Service',
        name: `${pkg.name} — ${sizeLabels[size] || size}`,
        description: pkg.subtitle || `${pkg.name} mobile auto detailing service.`,
        provider: {
          '@type': 'AutoDetailing',
          name: 'Rosie Dazzlers Mobile Auto Detailing',
          url: 'https://rosiedazzlers.ca/'
        },
        areaServed: ['Oxford County, Ontario', 'Norfolk County, Ontario'],
        serviceType: 'Mobile auto detailing'
      }
    };
  }).filter(Boolean));
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDetailing',
    name: 'Rosie Dazzlers Mobile Auto Detailing',
    url: pageUrl,
    areaServed: ['Oxford County, Ontario', 'Norfolk County, Ontario'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Rosie Dazzlers mobile auto detailing pricing',
      itemListElement: offers
    }
  };
}

export function buildServicesCatalogSchema(catalog, pageUrl = 'https://rosiedazzlers.ca/services') {
  const normalized = normalizePricingCatalog(catalog);
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDetailing',
    name: 'Rosie Dazzlers Mobile Auto Detailing',
    url: pageUrl,
    areaServed: ['Oxford County, Ontario', 'Norfolk County, Ontario'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Rosie Dazzlers detailing services and add-ons',
      itemListElement: [
        ...normalized.packages.map((pkg) => ({
          '@type': 'OfferCatalog',
          name: pkg.name,
          itemListElement: (pkg.included_services || []).map((item) => ({ '@type': 'ListItem', name: item?.name || '' })).filter((item) => item.name)
        })),
        ...normalized.addons.map((addon) => ({
          '@type': 'Offer',
          priceCurrency: 'CAD',
          price: addon.price_cad != null ? Number(addon.price_cad) : undefined,
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Service',
            name: addon.name,
            description: addon.quote_required ? 'Quote required add-on service.' : 'Optional mobile detailing add-on.',
            serviceType: 'Mobile auto detailing add-on'
          }
        }))
      ]
    }
  };
}

export function applyJsonLdScript(scriptId, payload) {
  if (!scriptId || !payload || typeof document === 'undefined') return;
  const node = document.getElementById(scriptId);
  if (!node) return;
  node.textContent = JSON.stringify(payload, null, 2);
}

export function addonDisplay(addon, size) {
  if (addon?.quote_required === true) {
    if (addon?.prices_cad?.[size] != null) return `From ${money(addon.prices_cad[size])} · Quote required`;
    if (addon?.price_cad != null) return `From ${money(addon.price_cad)} · Quote required`;
    return "Quote required";
  }
  if (addon?.prices_cad?.[size] != null) return money(addon.prices_cad[size]);
  if (addon?.price_cad != null) return money(addon.price_cad);
  return "$—";
}

export function bookingRules(catalog) {
  return normalizePricingCatalog(catalog).booking_rules;
}

export function publicRequirements(catalog) {
  const normalized = normalizePricingCatalog(catalog);
  return normalized.public_requirements?.length ? normalized.public_requirements : normalized.booking_rules.public_requirements;
}

export function serviceAreaRows(catalog) {
  return normalizePricingCatalog(catalog).service_areas;
}

export function findServiceArea(catalog, value) {
  const needle = String(value || "").trim().toLowerCase();
  return serviceAreaRows(catalog).find((row) => [row?.value, row?.label].some((entry) => String(entry || "").trim().toLowerCase() === needle)) || null;
}

export function chartUrl(catalog, key) {
  const needle = String(key || "").trim().toLowerCase();
  const row = normalizePricingCatalog(catalog).charts.find((chart) =>
    [chart?.title, chart?.filename].some((entry) => String(entry || "").trim().toLowerCase() === needle)
  );
  if (row?.r2_url) return row.r2_url;
  const fallback = DEFAULT_CHARTS.find((chart) =>
    [chart?.title, chart?.filename].some((entry) => String(entry || "").trim().toLowerCase() === needle)
  );
  return fallback?.r2_url || "";
}
