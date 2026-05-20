const SERVICE_AREA_COORDINATES = {
  "woodstock, oxford county": { latitude: 43.1306, longitude: -80.7467, label: "Woodstock service area", radius_m: 12000 },
  "tillsonburg, oxford county": { latitude: 42.8619, longitude: -80.7265, label: "Tillsonburg service area", radius_m: 12000 },
  "ingersoll, oxford county": { latitude: 43.0401, longitude: -80.8848, label: "Ingersoll service area", radius_m: 12000 },
  "norwich / otterville, oxford county": { latitude: 42.9870, longitude: -80.5980, label: "Norwich / Otterville service area", radius_m: 16000 },
  "thamesford / embro / innerkip, oxford county": { latitude: 43.1010, longitude: -80.9650, label: "Thamesford / Embro / Innerkip service area", radius_m: 18000 },
  "tavistock / hickson, oxford county": { latitude: 43.3130, longitude: -80.8390, label: "Tavistock / Hickson service area", radius_m: 18000 },
  "beachville / south-west oxford, oxford county": { latitude: 43.0500, longitude: -80.9530, label: "Beachville / South-West Oxford service area", radius_m: 18000 },
  "plattsville / blandford-blenheim, oxford county": { latitude: 43.3010, longitude: -80.6170, label: "Plattsville / Blandford-Blenheim service area", radius_m: 18000 },
  "rural oxford county": { latitude: 43.1400, longitude: -80.8600, label: "Rural Oxford County service area", radius_m: 26000 },
  "simcoe, norfolk county": { latitude: 42.8353, longitude: -80.3031, label: "Simcoe service area", radius_m: 12000 },
  "delhi, norfolk county": { latitude: 42.8544, longitude: -80.4997, label: "Delhi service area", radius_m: 12000 },
  "port dover, norfolk county": { latitude: 42.7860, longitude: -80.2040, label: "Port Dover service area", radius_m: 12000 },
  "waterford, norfolk county": { latitude: 42.9320, longitude: -80.2840, label: "Waterford service area", radius_m: 12000 },
  "port rowan, norfolk county": { latitude: 42.7520, longitude: -80.4580, label: "Port Rowan service area", radius_m: 12000 },
  "langton, norfolk county": { latitude: 42.8450, longitude: -80.7210, label: "Langton service area", radius_m: 12000 },
  "courtland, norfolk county": { latitude: 42.9030, longitude: -80.7080, label: "Courtland service area", radius_m: 12000 },
  "vittoria / st. williams, norfolk county": { latitude: 42.7120, longitude: -80.4250, label: "Vittoria / St. Williams service area", radius_m: 18000 },
  "turkey point / long point, norfolk county": { latitude: 42.7090, longitude: -80.3320, label: "Turkey Point / Long Point service area", radius_m: 20000 },
  "walsh / walsingham, norfolk county": { latitude: 42.7010, longitude: -80.5750, label: "Walsh / Walsingham service area", radius_m: 20000 },
  "rural norfolk county": { latitude: 42.7800, longitude: -80.4200, label: "Rural Norfolk County service area", radius_m: 28000 }
};

const COUNTY_FALLBACK_COORDINATES = {
  "oxford county": { latitude: 43.1300, longitude: -80.8600, label: "Oxford County fallback", radius_m: 32000 },
  "norfolk county": { latitude: 42.8000, longitude: -80.3600, label: "Norfolk County fallback", radius_m: 36000 }
};

export async function resolveTrustedBookingLocation({ bookingLike = {}, serviceAreaMeta = null }) {
  const manualLat = toCoord(bookingLike.trusted_service_latitude);
  const manualLng = toCoord(bookingLike.trusted_service_longitude);
  if (manualLat != null && manualLng != null) {
    return {
      latitude: manualLat,
      longitude: manualLng,
      source: "manual",
      status: "resolved",
      label: buildLabel(bookingLike),
      radius_m: 250
    };
  }

  const explicitServiceAreaCoordinate = extractExplicitServiceAreaCoordinate(serviceAreaMeta, bookingLike);
  if (explicitServiceAreaCoordinate) {
    return {
      latitude: explicitServiceAreaCoordinate.latitude,
      longitude: explicitServiceAreaCoordinate.longitude,
      source: 'service_area_meta',
      status: 'resolved',
      label: explicitServiceAreaCoordinate.label || buildLabel(bookingLike),
      radius_m: explicitServiceAreaCoordinate.radius_m || 12000
    };
  }

  const serviceAreaMatch = lookupServiceAreaCoordinate(serviceAreaMeta, bookingLike);
  if (serviceAreaMatch) {
    return {
      latitude: serviceAreaMatch.latitude,
      longitude: serviceAreaMatch.longitude,
      source: "service_area_lookup",
      status: "resolved",
      label: serviceAreaMatch.label || buildLabel(bookingLike),
      radius_m: serviceAreaMatch.radius_m || 15000
    };
  }

  const countyMatch = lookupCountyCoordinate(serviceAreaMeta, bookingLike);
  if (countyMatch) {
    return {
      latitude: countyMatch.latitude,
      longitude: countyMatch.longitude,
      source: "county_centroid",
      status: "resolved",
      label: countyMatch.label || buildLabel(bookingLike),
      radius_m: countyMatch.radius_m || 30000
    };
  }

  return {
    latitude: null,
    longitude: null,
    source: "unresolved",
    status: "unresolved",
    label: buildLabel(bookingLike),
    radius_m: 250
  };
}

export function buildTrustedLocationPatch(location, radiusMeters = null) {
  const derivedRadius = Number.isFinite(Number(radiusMeters))
    ? Number(radiusMeters)
    : Number.isFinite(Number(location?.radius_m))
      ? Number(location.radius_m)
      : 250;
  return {
    trusted_service_latitude: toCoord(location?.latitude),
    trusted_service_longitude: toCoord(location?.longitude),
    trusted_service_coordinate_source: String(location?.source || "unresolved").trim() || "unresolved",
    trusted_service_coordinate_status: String(location?.status || "pending").trim() || "pending",
    trusted_service_coordinate_label: String(location?.label || "").trim() || null,
    trusted_service_coordinate_resolved_at: location?.latitude != null && location?.longitude != null ? new Date().toISOString() : null,
    trusted_service_geofence_radius_m: derivedRadius
  };
}

export function compareAgainstTrustedLocation({ trustedLatitude, trustedLongitude, deviceLatitude, deviceLongitude, radiusMeters = 250 }) {
  const trustedLat = toCoord(trustedLatitude);
  const trustedLng = toCoord(trustedLongitude);
  const deviceLat = toCoord(deviceLatitude);
  const deviceLng = toCoord(deviceLongitude);
  const radius = Number.isFinite(Number(radiusMeters)) ? Number(radiusMeters) : 250;

  if (trustedLat == null || trustedLng == null) {
    return { status: "no_reference", distance_m: null, within_radius: null, radius_m: radius };
  }
  if (deviceLat == null || deviceLng == null) {
    return { status: "device_unavailable", distance_m: null, within_radius: null, radius_m: radius };
  }

  const distance = distanceMeters(trustedLat, trustedLng, deviceLat, deviceLng);
  const inside = distance <= radius;
  return {
    status: inside ? "inside_geofence" : "outside_geofence",
    distance_m: Math.round(distance),
    within_radius: inside,
    radius_m: radius
  };
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractExplicitServiceAreaCoordinate(serviceAreaMeta, bookingLike) {
  const latitude = toCoord(serviceAreaMeta?.latitude ?? serviceAreaMeta?.lat ?? bookingLike?.trusted_service_latitude);
  const longitude = toCoord(serviceAreaMeta?.longitude ?? serviceAreaMeta?.lng ?? serviceAreaMeta?.lon ?? bookingLike?.trusted_service_longitude);
  if (latitude == null || longitude == null) return null;
  const radius_m = Number.isFinite(Number(serviceAreaMeta?.radius_m ?? serviceAreaMeta?.geofence_radius_m)) ? Number(serviceAreaMeta?.radius_m ?? serviceAreaMeta?.geofence_radius_m) : null;
  return {
    latitude,
    longitude,
    radius_m,
    label: String(serviceAreaMeta?.label || serviceAreaMeta?.zone || serviceAreaMeta?.municipality || serviceAreaMeta?.value || '').trim() || buildLabel(bookingLike)
  };
}

function lookupServiceAreaCoordinate(serviceAreaMeta, bookingLike) {
  const keys = [
    serviceAreaMeta?.value,
    serviceAreaMeta?.label,
    bookingLike?.service_area,
    serviceAreaMeta?.zone,
    serviceAreaMeta?.municipality
  ].map(normalizeLookupKey).filter(Boolean);
  for (const key of keys) {
    if (SERVICE_AREA_COORDINATES[key]) return SERVICE_AREA_COORDINATES[key];
  }
  return null;
}

function lookupCountyCoordinate(serviceAreaMeta, bookingLike) {
  const keys = [
    serviceAreaMeta?.county,
    bookingLike?.service_area_county,
    bookingLike?.service_area_municipality
  ].map(normalizeLookupKey).filter(Boolean);
  for (const key of keys) {
    if (COUNTY_FALLBACK_COORDINATES[key]) return COUNTY_FALLBACK_COORDINATES[key];
  }
  return null;
}

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function toCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildLabel(bookingLike) {
  const parts = [
    bookingLike.address_line1,
    bookingLike.city,
    bookingLike.postal_code,
    bookingLike.service_area_municipality,
    bookingLike.service_area_county
  ].map((value) => String(value || "").trim()).filter(Boolean);
  return parts.join(", ") || String(bookingLike.service_area || "Booking location").trim() || "Booking location";
}
