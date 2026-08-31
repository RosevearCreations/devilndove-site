export const OPERATIONAL_THRESHOLDS = Object.freeze({
  notification_failures_24h: { warning: 1, error: 3 },
  upload_failures_24h: { warning: 1, error: 3 },
  payment_provider_failures_24h: { error: 1, critical: 3 },
  open_critical: { critical: 1 },
  stale_open_hours: { warning: 24, critical: 72 }
});

function text(value) { return String(value || '').trim(); }
function severity(value) {
  const clean = text(value).toLowerCase();
  return ['critical','error','warning','info'].includes(clean) ? clean : 'warning';
}

export function classifyIncidentAttention(row) {
  const status = text(row?.review_status || 'open').toLowerCase();
  if (!['open','reviewing'].includes(status)) return { level: 'none', reasons: [], age_hours: 0 };
  const createdMs = Date.parse(row?.created_at || '');
  const ageHours = Number.isFinite(createdMs) ? Math.max(0, (Date.now() - createdMs) / 3600000) : 0;
  const incidentSeverity = severity(row?.severity);
  let level = incidentSeverity === 'critical' ? 'critical' : (incidentSeverity === 'error' ? 'error' : 'warning');
  const reasons = [];
  if (ageHours >= OPERATIONAL_THRESHOLDS.stale_open_hours.critical) {
    level = 'critical'; reasons.push(`open_${Math.floor(ageHours)}h`);
  } else if (ageHours >= OPERATIONAL_THRESHOLDS.stale_open_hours.warning) {
    reasons.push(`stale_${Math.floor(ageHours)}h`);
  }
  if (incidentSeverity === 'critical') reasons.push('critical_incident');
  return { level, reasons, age_hours: Math.round(ageHours * 10) / 10 };
}

export async function operationalThresholdSnapshot(db) {
  const row = await db.prepare(`
    SELECT
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND LOWER(COALESCE(severity,''))='critical' THEN 1 ELSE 0 END) AS open_critical,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%notif%' OR LOWER(COALESCE(incident_code,'')) LIKE '%notif%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS notification_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%upload%' OR LOWER(COALESCE(incident_scope,'')) LIKE '%media%' OR LOWER(COALESCE(incident_code,'')) LIKE '%upload%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS upload_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%payment%' OR LOWER(COALESCE(incident_scope,'')) LIKE '%provider%' OR LOWER(COALESCE(incident_code,'')) LIKE '%payment%' OR LOWER(COALESCE(incident_code,'')) LIKE '%stripe%' OR LOWER(COALESCE(incident_code,'')) LIKE '%paypal%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS payment_provider_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)<datetime('now','-24 hours') THEN 1 ELSE 0 END) AS stale_open_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)<datetime('now','-72 hours') THEN 1 ELSE 0 END) AS stale_open_72h
    FROM runtime_incidents
  `).first();
  const counts = {
    open_critical: Number(row?.open_critical || 0),
    notification_failures_24h: Number(row?.notification_failures_24h || 0),
    upload_failures_24h: Number(row?.upload_failures_24h || 0),
    payment_provider_failures_24h: Number(row?.payment_provider_failures_24h || 0),
    stale_open_24h: Number(row?.stale_open_24h || 0),
    stale_open_72h: Number(row?.stale_open_72h || 0)
  };
  const breaches = [];
  if (counts.open_critical >= 1) breaches.push({ key:'open_critical', level:'critical', count:counts.open_critical });
  if (counts.payment_provider_failures_24h >= 3) breaches.push({ key:'payment_provider_failures_24h', level:'critical', count:counts.payment_provider_failures_24h });
  else if (counts.payment_provider_failures_24h >= 1) breaches.push({ key:'payment_provider_failures_24h', level:'error', count:counts.payment_provider_failures_24h });
  for (const key of ['notification_failures_24h','upload_failures_24h']) {
    if (counts[key] >= 3) breaches.push({ key, level:'error', count:counts[key] });
    else if (counts[key] >= 1) breaches.push({ key, level:'warning', count:counts[key] });
  }
  if (counts.stale_open_72h > 0) breaches.push({ key:'stale_open_72h', level:'critical', count:counts.stale_open_72h });
  else if (counts.stale_open_24h > 0) breaches.push({ key:'stale_open_24h', level:'warning', count:counts.stale_open_24h });
  const status = breaches.some((b)=>b.level==='critical') ? 'critical' : breaches.some((b)=>b.level==='error') ? 'error' : breaches.length ? 'warning' : 'ok';
  return { thresholds: OPERATIONAL_THRESHOLDS, counts, breaches, status };
}
